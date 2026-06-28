import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { MessageDirection } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { patientPhone, direction, content, whatsappMessageId } = body;

    if (!patientPhone || !direction || !content) {
      return NextResponse.json(
        { error: 'Missing required parameters: patientPhone, direction, and content' },
        { status: 400 }
      );
    }

    const directionEnum = direction as MessageDirection;

    // Retrieve or register placeholder patient
    let patient = await prisma.patient.findUnique({
      where: { phone: patientPhone },
    });

    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          name: 'WhatsApp User',
          phone: patientPhone,
          age: 0,
          gender: 'OTHER',
        },
      });
    }

    // Save message record
    const message = await prisma.message.create({
      data: {
        patientId: patient.id,
        direction: directionEnum,
        content,
        whatsappMessageId: whatsappMessageId || null,
      },
    });

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    console.error('Webhook message error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
