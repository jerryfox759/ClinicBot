import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export interface ExtractedBookingDetails {
  intent: 'BOOK_APPOINTMENT' | 'MY_APPOINTMENT' | 'RESCHEDULE' | 'CANCEL' | 'GENERAL_QUERY' | 'UNKNOWN';
  patientName: string | null;
  patientAge: number | null;
  patientGender: 'MALE' | 'FEMALE' | 'OTHER' | null;
  preferredDate: string | null; // YYYY-MM-DD
  preferredTime: string | null; // HH:MM
  reasonForVisit: string | null;
  missingFields: ('patientName' | 'patientAge' | 'patientGender' | 'preferredDate' | 'preferredTime' | 'reasonForVisit')[];
  querySubject: 'FEE' | 'TIMING' | 'ADDRESS' | 'RECEPTION' | null;
}

/**
 * Analyzes conversation history using Gemini 2.5 Flash to extract booking metadata.
 */
export async function extractBookingInfo(
  chatHistory: { role: 'user' | 'model'; parts: string }[],
  latestMessage: string,
  language: string,
  todayDateStr: string
): Promise<ExtractedBookingDetails> {
  
  if (!apiKey) {
    return mockExtraction(latestMessage, todayDateStr);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const systemInstruction = `
You are a friendly, helpful clinic receptionist bot managing appointments for Dr. Meraj Khan, a Cardiologist.
The today's date is: ${todayDateStr}. Use this reference date to resolve relative date expressions (like "tomorrow", "day after tomorrow", "next Monday").
Analyze the conversation history and the latest message to extract booking details in the selected language: ${language}.
Your output must be a valid JSON object matching this schema:
{
  "intent": "BOOK_APPOINTMENT" | "MY_APPOINTMENT" | "RESCHEDULE" | "CANCEL" | "GENERAL_QUERY" | "UNKNOWN",
  "patientName": string or null,
  "patientAge": number or null,
  "patientGender": "MALE" | "FEMALE" | "OTHER" | null,
  "preferredDate": "YYYY-MM-DD" or null,
  "preferredTime": "HH:MM" or null,
  "reasonForVisit": string or null,
  "missingFields": array of missing strings from: ["patientName", "patientAge", "patientGender", "preferredDate", "preferredTime", "reasonForVisit"],
  "querySubject": "FEE" | "TIMING" | "ADDRESS" | "RECEPTION" | null
}

Instructions:
1. Identify the user's intent.
2. If the user wants to book an appointment, parse the details. If they say "mujhe appointment chahiye" or "book a slot", intent is BOOK_APPOINTMENT.
3. If they give details like "Ananya, 28, female", extract name="Ananya", age=28, gender="FEMALE".
4. Resolve dates strictly. "Tomorrow" = 1 day after ${todayDateStr}. "Day after tomorrow" = 2 days after ${todayDateStr}.
5. If the user asks general questions:
   - Consultation fees / cost -> querySubject = "FEE", intent = GENERAL_QUERY.
   - Timings / schedule -> querySubject = "TIMING", intent = GENERAL_QUERY.
   - Clinic address / directions -> querySubject = "ADDRESS", intent = GENERAL_QUERY.
   - Contact human receptionist / helpline -> querySubject = "RECEPTION", intent = GENERAL_QUERY.
6. The "missingFields" list must ONLY contain fields that have not been provided yet. If all details for booking are present, missingFields must be empty [].
7. Do not ask for information twice. If a field was already provided in history, carry it over.
`;

    // format prompt with history
    let prompt = `System Instructions:\n${systemInstruction}\n\n`;
    prompt += `Chat History:\n`;
    for (const turn of chatHistory) {
      prompt += `${turn.role === 'user' ? 'Patient' : 'Receptionist'}: ${turn.parts}\n`;
    }
    prompt += `Patient (latest message): ${latestMessage}\n`;
    prompt += `Response JSON:`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return JSON.parse(responseText) as ExtractedBookingDetails;
  } catch (error) {
    console.error('Gemini extraction error:', error);
    return mockExtraction(latestMessage, todayDateStr);
  }
}

function mockExtraction(message: string, todayStr: string): ExtractedBookingDetails {
  const msg = message.toLowerCase();
  let intent: any = 'UNKNOWN';
  let querySubject: any = null;

  if (msg.includes('book') || msg.includes('appointment') || msg.includes('milna') || msg.includes('দেখা')) {
    intent = 'BOOK_APPOINTMENT';
  } else if (msg.includes('cancel') || msg.includes('radd') || msg.includes('বাতিল')) {
    intent = 'CANCEL';
  } else if (msg.includes('reschedule') || msg.includes('change') || msg.includes('বদলাতে')) {
    intent = 'RESCHEDULE';
  } else if (msg.includes('my') || msg.includes('check') || msg.includes('mer') || msg.includes('আমার')) {
    intent = 'MY_APPOINTMENT';
  } else if (msg.includes('fee') || msg.includes('price') || msg.includes('charge') || msg.includes('fees') || msg.includes('টাকা')) {
    intent = 'GENERAL_QUERY';
    querySubject = 'FEE';
  } else if (msg.includes('timing') || msg.includes('hours') || msg.includes('samay') || msg.includes('সময়')) {
    intent = 'GENERAL_QUERY';
    querySubject = 'TIMING';
  } else if (msg.includes('address') || msg.includes('location') || msg.includes('pata') || msg.includes('ঠিকানা')) {
    intent = 'GENERAL_QUERY';
    querySubject = 'ADDRESS';
  } else if (msg.includes('reception') || msg.includes('contact') || msg.includes('phone') || msg.includes('call') || msg.includes('helpline')) {
    intent = 'GENERAL_QUERY';
    querySubject = 'RECEPTION';
  }

  return {
    intent,
    patientName: null,
    patientAge: null,
    patientGender: null,
    preferredDate: todayStr,
    preferredTime: '10:00',
    reasonForVisit: 'General Consultation',
    missingFields: ['patientName', 'patientAge', 'patientGender'],
    querySubject,
  };
}
