import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAvailableSlots } from '@/lib/booking';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { appointmentId, appointmentNumber, newDate, newTimeSlot } = body;

    if ((!appointmentId && !appointmentNumber) || !newDate || !newTimeSlot) {
      return NextResponse.json(
        { error: 'Missing required parameters: appointmentId (or appointmentNumber), newDate, and newTimeSlot' },
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

    // Check slot availability
    const slots = await getAvailableSlots(appointment.doctorId, newDate);
    const requestedSlot = slots.find((s) => s.time === newTimeSlot);

    if (!requestedSlot || !requestedSlot.available) {
      const alternatives = slots.filter((s) => s.available).slice(0, 3).map((s) => s.time);
      return NextResponse.json(
        { 
          error: 'Requested time slot is not available.',
          alternatives 
        },
        { status: 409 }
      );
    }

    // Update appointment
    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        date: new Date(newDate),
        timeSlot: newTimeSlot,
        status: 'BOOKED', // Reset to Booked upon reschedule
      },
      include: {
        patient: true,
      },
    });

    return NextResponse.json({ success: true, appointment: updated });
  } catch (error: any) {
    console.error('Error rescheduling appointment:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
