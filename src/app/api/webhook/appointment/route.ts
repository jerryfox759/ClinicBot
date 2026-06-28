import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AppointmentStatus } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { appointmentId, status, details } = body;

    if (!appointmentId || !status) {
      return NextResponse.json(
        { error: 'Missing required parameters: appointmentId and status' },
        { status: 400 }
      );
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: status as AppointmentStatus,
        notes: details ? String(details) : undefined,
      },
    });

    return NextResponse.json({ success: true, appointment: updated });
  } catch (error: any) {
    console.error('Webhook appointment error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
