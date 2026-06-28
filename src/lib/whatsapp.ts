import prisma from './prisma';

/**
 * Sends a text message to a patient via WhatsApp Cloud API.
 * In development, if Meta credentials are not configured, it logs the message to the console.
 * In all cases, it logs the message history in the PostgreSQL database.
 */
export async function sendWhatsAppMessage(to: string, content: string): Promise<boolean> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  console.log(`\x1b[36m[WhatsApp Outgoing to ${to}]:\x1b[0m ${content}`);

  let whatsappMessageId = null;

  if (accessToken && phoneNumberId) {
    try {
      const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: {
            body: content,
          },
        }),
      });

      const data = await response.json();
      if (response.ok && data.messages && data.messages.length > 0) {
        whatsappMessageId = data.messages[0].id;
      } else {
        console.error('Meta API response error:', data);
      }
    } catch (error) {
      console.error('Failed to send WhatsApp message via Meta Cloud API:', error);
    }
  }

  // Persist message to database if patient exists
  try {
    const patient = await prisma.patient.findUnique({
      where: { phone: to },
    });

    if (patient) {
      await prisma.message.create({
        data: {
          patientId: patient.id,
          direction: 'OUTGOING',
          content,
          whatsappMessageId,
        },
      });
    }
  } catch (dbError) {
    console.error('Failed to log outgoing message to database:', dbError);
  }

  return true;
}
