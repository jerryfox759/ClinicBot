import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { appointmentId, appointmentNumber } = body;

    if (!appointmentId && !appointmentNumber) {
      return NextResponse.json(
        { error: 'Missing parameter: appointmentId or appointmentNumber is required' },
        { status: 400 }
      );
    }

    // Find the appointment
    const appointment = await prisma.appointment.findFirst({
      where: {
        OR: [
          appointmentId ? { id: appointmentId } : undefined,
          appointmentNumber ? { appointmentNumber } : undefined,
        ].filter(Boolean) as any,
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Update status to CANCELLED
    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: 'CANCELLED' },
      include: {
        patient: true,
      },
    });

    return NextResponse.json({ success: true, appointment: updated });
  } catch (error: any) {
    console.error('Error cancelling appointment:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
