import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { extractBookingInfo } from '@/lib/gemini';
import { getAvailableSlots } from '@/lib/booking';
import { Language, AppointmentStatus, DayOfWeek } from '@prisma/client';

// Meta Webhook Handshake Verification (GET)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'clinicbot_verify_token';

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('Webhook verified successfully!');
      return new Response(challenge, { status: 200 });
    }

    return new Response('Forbidden', { status: 403 });
  } catch (error) {
    return new Response('Internal Error', { status: 500 });
  }
}

// Incoming WhatsApp Webhook Router (POST)
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Validate Meta JSON structure
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message) {
      // Return 200 to acknowledge Meta webhook event even if it's status logs
      return NextResponse.json({ success: true, status: 'acknowledged_event' });
    }

    const from = message.from; // Sender phone number
    const text = message.text?.body?.trim();
    const messageId = message.id;

    if (!text) {
      return NextResponse.json({ success: true });
    }

    // 2. Fetch or Create Patient Profile
    let patient = await prisma.patient.findUnique({
      where: { phone: from },
      include: { languagePreference: true },
    });

    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          name: 'New WhatsApp Patient',
          phone: from,
          age: 0,
          gender: 'OTHER',
        },
        include: { languagePreference: true },
      });
    }

    // Persist incoming message to DB
    await prisma.message.create({
      data: {
        patientId: patient.id,
        direction: 'INCOMING',
        content: text,
        whatsappMessageId: messageId,
      },
    });

    // 3. Language State Check
    if (!patient.languagePreference) {
      // Check if message is a selection (1 to 4)
      if (['1', '2', '3', '4'].includes(text)) {
        const langMap: Record<string, Language> = {
          '1': 'ENGLISH',
          '2': 'HINDI',
          '3': 'BENGALI',
          '4': 'URDU',
        };
        const selectedLang = langMap[text];
        
        await prisma.languagePreference.create({
          data: {
            patientId: patient.id,
            language: selectedLang,
          },
        });

        // Send Main Menu in selected language
        await sendMainMenu(from, selectedLang);
        return NextResponse.json({ success: true });
      } else {
        // Send Language Selection Menu
        await sendLanguageWelcome(from);
        return NextResponse.json({ success: true });
      }
    }

    const currentLang = patient.languagePreference.language;

    // 4. Menu Command Parsing (Numeric inputs from Main Menu)
    if (['1', '2', '3', '4', '5', '6', '7', '8'].includes(text)) {
      await handleMenuSelection(from, text, currentLang, patient.id);
      return NextResponse.json({ success: true });
    }

    // 5. NLP Gemini Parsing for Conversation Context
    const chatHistory = await loadPatientChatHistory(patient.id);
    const todayStr = new Date().toISOString().split('T')[0];

    const geminiAnalysis = await extractBookingInfo(
      chatHistory,
      text,
      currentLang.toLowerCase(),
      todayStr
    );

    // 6. Handle Intent Action Routing
    await executeIntent(from, patient.id, currentLang, geminiAnalysis, todayStr);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Webhook processing failure:', error);
    return NextResponse.json({ error: 'Webhook Handler Failed' }, { status: 200 }); // Acknowledge Meta with 200 to prevent webhook disabled flags
  }
}

// LANGUAGE SELECTIONS WELCOME
async function sendLanguageWelcome(to: string) {
  const text = `Welcome to Dr. Meraj Khan's Chamber.\nPlease choose your preferred language.\n\n1 English\n2 Hindi\n3 Bengali\n4 Urdu`;
  await sendWhatsAppMessage(to, text);
}

// MAIN MENU SENDER
async function sendMainMenu(to: string, lang: Language) {
  let text = '';
  switch (lang) {
    case 'HINDI':
      text = `मुख्य मेनू:\n1. अपॉइंटमेंट बुक करें\n2. मेरा अपॉइंटमेंट\n3. रीशेड्यूل करें\n4. रद्द करें\n5. परामर्श शुल्क\n6. डॉक्टर का समय\n7. क्लिनिक का पता\n8. रिसेप्शन سے संपर्क करें`;
      break;
    case 'BENGALI':
      text = `মূল মেনু:\n1. অ্যাপয়েন্টমেন্ট বুকিং\n2. আমার অ্যাপয়েন্টমেন্ট\n3. সময় পরিবর্তন\n4. বাতিলকরণ\n5. পরামর্শ ফি\n6. ডাক্তারের সময়সূচী\n7. চেম্বারের ঠিকানা\n8. রিসেপশনিস্টের সাথে যোগাযোগ`;
      break;
    case 'URDU':
      text = `مین مینو:\n1۔ ملاقات بک کریں\n2۔ میری ملاقات\n3۔ دوبارہ شیڈول کریں\n4۔ منسوخ کریں\n5۔ ڈاکٹر کی فیس\n6۔ ڈاکٹر کا وقت\n7۔ کلینک کا پتہ\n8۔ ریسپشن سے رابطہ کریں`;
      break;
    default:
      text = `Main Menu:\n1. Book Appointment\n2. My Appointment\n3. Reschedule\n4. Cancel\n5. Consultation Fees\n6. Doctor Timing\n7. Clinic Address\n8. Contact Reception`;
  }
  await sendWhatsAppMessage(to, text);
}

// CHAT HISTORY LOADER
async function loadPatientChatHistory(patientId: string) {
  const messages = await prisma.message.findMany({
    where: { patientId },
    orderBy: { createdAt: 'desc' },
    take: 6,
  });

  return messages
    .reverse()
    .map((msg) => ({
      role: msg.direction === 'INCOMING' ? ('user' as const) : ('model' as const),
      parts: msg.content,
    }));
}

// MAIN MENU HANDLER
async function handleMenuSelection(to: string, input: string, lang: Language, patientId: string) {
  const doctor = await prisma.doctor.findFirst({
    include: { clinic: true, user: { select: { name: true } } },
  });

  if (!doctor) {
    await sendWhatsAppMessage(to, 'System configurations missing. Doctor profiles not seeded.');
    return;
  }

  let text = '';

  if (input === '1') {
    // Book Appointment trigger
    switch (lang) {
      case 'HINDI':
        text = `चैंबर अपॉइंटमेंट बुक करने के लिए कृपया अपनी विवरण भेजें:\nमरीज का नाम, उम्र, लिंग, बीमारी और पसंदीदा तारीख (YYYY-MM-DD) और समय (HH:MM)।`;
        break;
      case 'BENGALI':
        text = `অ্যাপয়েন্টমেন্ট বুক করার জন্য অনুগ্রহ করে রোগীর বিবরণ পাঠান:\nনাম, বয়স, লিঙ্গ, সমস্যার ধরন এবং কাঙ্ক্ষিত তারিখ (YYYY-MM-DD) ও সময় (HH:MM)।`;
        break;
      case 'URDU':
        text = `ملاقات بک کرنے کے لیے برائے مہربانی درج ذیل تفصیلات بھیجیں:\nمریض کا نام، عمر، جنس، وجہ اور تاریخ (YYYY-MM-DD) اور وقت (HH:MM)۔`;
        break;
      default:
        text = `To book an appointment, please reply with details:\nPatient Name, Age, Gender, Reason, and Preferred Date (YYYY-MM-DD) and Time (HH:MM).`;
    }
  } else if (input === '2') {
    // List appointments
    const appointments = await prisma.appointment.findMany({
      where: {
        patientId,
        status: { in: ['BOOKED', 'CONFIRMED', 'CHECKED_IN'] },
      },
      orderBy: { date: 'asc' },
    });

    if (appointments.length === 0) {
      text = lang === 'HINDI' ? 'आपका कोई सक्रिय अपॉइंटमेंट नहीं है।' :
             lang === 'BENGALI' ? 'আপনার কোন সক্রিয় অ্যাপয়েন্টমেন্ট নেই।' :
             lang === 'URDU' ? 'آپ کی کوئی ملاقات بک نہیں ہے۔' :
             'You have no active appointments.';
    } else {
      text = lang === 'HINDI' ? 'आपके अपॉइंटमेंट:\n' :
             lang === 'BENGALI' ? 'আপনার অ্যাপয়েন্টমেন্টসমূহ:\n' :
             lang === 'URDU' ? 'آپ کی ملاقاتیں:\n' :
             'Your appointments:\n';
      appointments.forEach((app) => {
        text += `- ID: ${app.appointmentNumber} | Date: ${new Date(app.date).toISOString().split('T')[0]} | Slot: ${app.timeSlot} | Status: ${app.status}\n`;
      });
    }
  } else if (input === '3') {
    text = lang === 'HINDI' ? 'रीशेड्यूल करने के लिए, अपना अपॉइंटमेंट नंबर (ID) और नई तारीख और समय भेजें।' :
           lang === 'BENGALI' ? 'সময় পরিবর্তন করতে অনুগ্রহ করে আপনার অ্যাপয়েন্টমেন্ট আইডি এবং নতুন তারিখ ও সময় পাঠান।' :
           lang === 'URDU' ? 'دوبارہ شیڈول کرنے کے لیے ملاقات نمبر اور نئی تاریخ اور وقت بھیجیں۔' :
           'To reschedule, please send your Appointment ID along with the new date and time slot.';
  } else if (input === '4') {
    text = lang === 'HINDI' ? 'रद्द करने के लिए, कृपया अपना अपॉइंटमेंट नंबर (ID) भेजें।' :
           lang === 'BENGALI' ? 'অ্যাপয়েন্টমেন্ট বাতিল করতে অনুগ্রহ করে আইডি পাঠান।' :
           lang === 'URDU' ? 'منسوخ کرنے کے لیے ملاقات نمبر بھیجیں۔' :
           'To cancel, please reply with your Appointment ID.';
  } else if (input === '5') {
    // Fee details
    text = lang === 'HINDI' ? `डॉ. ${doctor.user.name} की परामर्श शुल्क ₹${doctor.consultationFee} है।` :
           lang === 'BENGALI' ? `ডঃ ${doctor.user.name} এর ভিজিট ফি হল ₹${doctor.consultationFee}।` :
           lang === 'URDU' ? `ڈاکٹر ${doctor.user.name} کی فیس ₹${doctor.consultationFee} ہے۔` :
           `Consultation Fee for Dr. ${doctor.user.name} is ₹${doctor.consultationFee}.`;
  } else if (input === '6') {
    // Timings
    const workingDays = await prisma.workingDay.findMany({ where: { doctorId: doctor.id } });
    text = lang === 'HINDI' ? 'डॉक्टर चैंबर का समय:\n' :
           lang === 'BENGALI' ? 'ডাক্তারের সময়সূচী:\n' :
           lang === 'URDU' ? 'چیمبر کے اوقات:\n' :
           'Doctor chamber hours:\n';
    workingDays.forEach((wd) => {
      if (wd.isWorking) {
        text += `- ${wd.dayOfWeek.toLowerCase()}: ${wd.startTime} to ${wd.endTime} (Break: ${wd.breakStart}-${wd.breakEnd})\n`;
      }
    });
  } else if (input === '7') {
    // Address
    text = lang === 'HINDI' ? `क्लिनिक का पता: ${doctor.clinic.address}\nगूगल मैप्स: ${doctor.clinic.googleMapsUrl || 'N/A'}` :
           lang === 'BENGALI' ? `চেম্বারের ঠিকানা: ${doctor.clinic.address}\nগুগল ম্যাপস: ${doctor.clinic.googleMapsUrl || 'N/A'}` :
           lang === 'URDU' ? `کلینک کا پتہ: ${doctor.clinic.address}\nگوگل نقشہ: ${doctor.clinic.googleMapsUrl || 'N/A'}` :
           `Clinic Address: ${doctor.clinic.address}\nGoogle Maps: ${doctor.clinic.googleMapsUrl || 'N/A'}`;
  } else if (input === '8') {
    text = lang === 'HINDI' ? `रिसेप्शनिस्ट से संपर्क करने के लिए कॉल करें: ${doctor.clinic.phone || 'N/A'}` :
           lang === 'BENGALI' ? `সহযোগিতার জন্য রিসেপশনিস্টকে কল করুন: ${doctor.clinic.phone || 'N/A'}` :
           lang === 'URDU' ? `ریسپشن سے رابطہ کرنے کے لیے کال کریں: ${doctor.clinic.phone || 'N/A'}` :
           `To contact the receptionist directly, please call: ${doctor.clinic.phone || 'N/A'}`;
  }

  await sendWhatsAppMessage(to, text);
}

// EXECUTE GEMINI INTENT ACTIONS
async function executeIntent(to: string, patientId: string, lang: Language, details: any, todayStr: string) {
  const doctor = await prisma.doctor.findFirst({
    include: { clinic: true, user: { select: { name: true } } },
  });

  if (!doctor) return;

  let replyText = '';

  if (details.intent === 'GENERAL_QUERY' && details.querySubject) {
    // Reroute queries directly to menu scripts
    const queryMap: Record<string, string> = {
      'FEE': '5',
      'TIMING': '6',
      'ADDRESS': '7',
      'RECEPTION': '8',
    };
    await handleMenuSelection(to, queryMap[details.querySubject], lang, patientId);
    return;
  }

  if (details.intent === 'BOOK_APPOINTMENT') {
    // Check if missing fields exist
    if (details.missingFields && details.missingFields.length > 0) {
      const nextField = details.missingFields[0];
      switch (nextField) {
        case 'patientName':
          replyText = lang === 'HINDI' ? 'कृपया मरीज का पूरा नाम बताएं।' :
                      lang === 'BENGALI' ? 'অনুগ্রহ করে রোগীর পুরো নাম বলুন।' :
                      lang === 'URDU' ? 'برائے مہربانی مریض کا نام بتائیں۔' :
                      'Please provide the patient name.';
          break;
        case 'patientAge':
          replyText = lang === 'HINDI' ? 'कृपया मरीज की उम्र बताएं।' :
                      lang === 'BENGALI' ? 'অনুগ্রহ করে রোগীর বয়স বলুন।' :
                      lang === 'URDU' ? 'برائے مہربانی مریض کی عمر بتائیں۔' :
                      'Please provide the patient age.';
          break;
        case 'patientGender':
          replyText = lang === 'HINDI' ? 'कृपया मरीज का लिंग बताएं (MALE, FEMALE, OTHER)।' :
                      lang === 'BENGALI' ? 'অনুগ্রহ করে রোগীর লিঙ্গ বলুন (MALE, FEMALE, OTHER)।' :
                      lang === 'URDU' ? 'برائے مہربانی مریض کی جنس بتائیں۔' :
                      'Please provide the patient gender (MALE, FEMALE, or OTHER).';
          break;
        case 'preferredDate':
          replyText = lang === 'HINDI' ? 'कृपया अपॉइंटमेंट के लिए पसंदीदा तारीख बताएं (उदा. 2026-06-29)।' :
                      lang === 'BENGALI' ? 'অনুগ্রহ করে পছন্দের তারিখ বলুন (উদা. 2026-06-29)।' :
                      lang === 'URDU' ? 'برائے مہربانی پسندیدہ تاریخ بتائیں۔' :
                      'Please specify your preferred date for the appointment (e.g. YYYY-MM-DD).';
          break;
        case 'preferredTime':
          replyText = lang === 'HINDI' ? 'कृपया पसंदीदा समय बताएं (उदा. 11:30)।' :
                      lang === 'BENGALI' ? 'অনুগ্রহ করে সময় বলুন (উদা. 11:30)।' :
                      lang === 'URDU' ? 'برائے مہربانی وقت بتائیں۔' :
                      'Please specify your preferred time slot (e.g., 10:30, 11:00).';
          break;
        case 'reasonForVisit':
          replyText = lang === 'HINDI' ? 'कृपया आने का कारण बताएं।' :
                      lang === 'BENGALI' ? 'অনুগ্রহ করে আসার কারণ বলুন।' :
                      lang === 'URDU' ? 'برائے مہربانی بیماری کی وجہ بتائیں۔' :
                      'Please briefly state the reason for visit.';
          break;
      }
      await sendWhatsAppMessage(to, replyText);
      return;
    }

    // All fields present! Process booking checks
    const { patientName, patientAge, patientGender, preferredDate, preferredTime, reasonForVisit } = details;

    // Check Slot Availability
    const slots = await getAvailableSlots(doctor.id, preferredDate);
    const slot = slots.find((s) => s.time === preferredTime);

    if (slot && slot.available) {
      // Slot is free! Book it
      try {
        const startOfDay = new Date(preferredDate);
        startOfDay.setUTCHours(0,0,0,0);
        const endOfDay = new Date(preferredDate);
        endOfDay.setUTCHours(23,59,59,999);

        const appointment = await prisma.$transaction(async (tx) => {
          // Upsert patient details
          const pat = await tx.patient.upsert({
            where: { phone: to },
            update: { name: patientName, age: parseInt(patientAge), gender: patientGender },
            create: { name: patientName, phone: to, age: parseInt(patientAge), gender: patientGender },
          });

          // Calculate Token
          const count = await tx.appointment.count({
            where: {
              doctorId: doctor.id,
              date: { gte: startOfDay, lte: endOfDay },
              status: { in: ['BOOKED', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'FOLLOW_UP'] },
            },
          });
          const tokenNumber = count + 1;
          const dateCode = preferredDate.replace(/-/g, '');
          const serialCode = tokenNumber.toString().padStart(3, '0');
          const appointmentNumber = `CB-${dateCode}-${serialCode}`;

          return tx.appointment.create({
            data: {
              appointmentNumber,
              patientId: pat.id,
              doctorId: doctor.id,
              clinicId: doctor.clinicId,
              date: new Date(preferredDate),
              timeSlot: preferredTime,
              status: 'BOOKED',
              reasonForVisit: reasonForVisit || 'WhatsApp Booking',
              consultationFee: doctor.consultationFee,
              tokenNumber,
            },
          });
        });

        // Send confirmation
        replyText = lang === 'HINDI' ? `बुक हो गया! डॉ. ${doctor.user.name} के साथ आपका अपॉइंटमेंट पक्का है।\nटोकन नंबर: #${appointment.tokenNumber}\nआईडी: ${appointment.appointmentNumber}\nतारीख: ${preferredDate}\nसमय: ${preferredTime}\nपता: ${doctor.clinic.address}` :
                    lang === 'BENGALI' ? `কনফার্মড! ডঃ ${doctor.user.name} এর সাথে আপনার অ্যাপয়েন্টমেন্ট বুক হয়েছে।\nটোকেন নম্বর: #${appointment.tokenNumber}\nআইডি: ${appointment.appointmentNumber}\nতারিখ: ${preferredDate}\nসময়: ${preferredTime}\nঠিকানা: ${doctor.clinic.address}` :
                    lang === 'URDU' ? `کامیابی! ڈاکٹر ${doctor.user.name} کے ساتھ آپ کی ملاقات بک ہو گئی ہے۔\nٹوکن نمبر: #${appointment.tokenNumber}\nآئی ڈی: ${appointment.appointmentNumber}\nتاریخ: ${preferredDate}\nوقت: ${preferredTime}` :
                    `Success! Your appointment with Dr. ${doctor.user.name} is confirmed.\nToken: #${appointment.tokenNumber}\nAppointment ID: ${appointment.appointmentNumber}\nDate: ${preferredDate}\nTime: ${preferredTime}\nAddress: ${doctor.clinic.address}`;

        await sendWhatsAppMessage(to, replyText);
      } catch (txErr) {
        await sendWhatsAppMessage(to, 'Failed to complete booking transaction. Please try again.');
      }
    } else {
      // Slot is occupied. Propose 3 closest slots
      const freeSlots = slots.filter((s) => s.available).slice(0, 3);
      if (freeSlots.length === 0) {
        replyText = lang === 'HINDI' ? `क्षमा करें, ${preferredDate} को कोई समय उपलब्ध नहीं है। कृपया कोई अन्य तारीख चुनें।` :
                    lang === 'BENGALI' ? `দুঃখিত, ${preferredDate} তারিখে কোন সময় খালি নেই। অনুগ্রহ করে অন্য দিন নির্বাচন করুন।` :
                    lang === 'URDU' ? `معذرت، ${preferredDate} کو کوئی وقت خالی نہیں ہے۔` :
                    `Sorry, no slots are available on ${preferredDate}. Please select another date.`;
      } else {
        const slotOptions = freeSlots.map((s) => s.time).join(', ');
        replyText = lang === 'HINDI' ? `पसंदीदा समय उपलब्ध नहीं है। कृपया इन उपलब्ध समय में से चुनें: ${slotOptions}` :
                    lang === 'BENGALI' ? `দুঃখিত, পছন্দের সময়টি খালি নেই। অনুগ্রহ করে এই সময়গুলির মধ্যে একটি বেছে নিন: ${slotOptions}` :
                    lang === 'URDU' ? `پسندیدہ وقت خالی نہیں ہے۔ ان میں سے انتخاب کریں: ${slotOptions}` :
                    `Selected slot is unavailable. Please choose from these free slots: ${slotOptions}`;
      }
      await sendWhatsAppMessage(to, replyText);
    }
    return;
  }

  // Handle Cancel, Reschedule, My Appointment fallbacks
  switch (details.intent) {
    case 'MY_APPOINTMENT':
      await handleMenuSelection(to, '2', lang, patientId);
      break;
    case 'CANCEL':
      await handleMenuSelection(to, '4', lang, patientId);
      break;
    case 'RESCHEDULE':
      await handleMenuSelection(to, '3', lang, patientId);
      break;
    default:
      // Unknown intent
      replyText = lang === 'HINDI' ? 'क्षमा करें, मैं समझ नहीं पाया। मुख्य मेनू देखने के लिए कृपया कोई भी नंबर भेजें।' :
                  lang === 'BENGALI' ? 'দুঃখিত, আমি বুঝতে পারিনি। মূল মেনু দেখতে অনুগ্রহ করে কোন সংখ্যা পাঠান।' :
                  lang === 'URDU' ? 'معذرت، میں سمجھ نہیں پایا۔' :
                  'Sorry, I could not understand. Please choose an option from the main menu.';
      await sendWhatsAppMessage(to, replyText);
      await sendMainMenu(to, lang);
  }
}
