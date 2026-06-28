import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAvailableSlots } from '@/lib/booking';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      doctorId,
      patientPhone,
      patientName,
      patientAge,
      patientGender,
      patientAddress,
      date,
      timeSlot,
      reasonForVisit,
    } = body;

    // Validate inputs
    if (!doctorId || !patientPhone || !patientName || !patientAge || !patientGender || !date || !timeSlot || !reasonForVisit) {
      return NextResponse.json(
        { error: 'Missing required parameters in body' },
        { status: 400 }
      );
    }

    // Verify slot is available
    const slots = await getAvailableSlots(doctorId, date);
    const requestedSlot = slots.find((s) => s.time === timeSlot);

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

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    const ageInt = parseInt(patientAge);
    const genderStr = String(patientGender);

    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const appointment = await prisma.$transaction(async (tx) => {
      // 1. Upsert Patient details
      const patient = await tx.patient.upsert({
        where: { phone: patientPhone },
        update: { name: patientName, age: ageInt, gender: genderStr, address: patientAddress || null },
        create: { name: patientName, phone: patientPhone, age: ageInt, gender: genderStr, address: patientAddress || null },
      });

      // 2. Count today's bookings for serial Token
      const count = await tx.appointment.count({
        where: {
          doctorId,
          date: { gte: startOfDay, lte: endOfDay },
          status: { in: ['BOOKED', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'FOLLOW_UP'] },
        },
      });

      const tokenNumber = count + 1;
      const dateCode = date.replace(/-/g, '');
      const serialCode = tokenNumber.toString().padStart(3, '0');
      const appointmentNumber = `CB-${dateCode}-${serialCode}`;

      // 3. Create appointment
      return tx.appointment.create({
        data: {
          appointmentNumber,
          patientId: patient.id,
          doctorId,
          clinicId: doctor.clinicId,
          date: new Date(date),
          timeSlot,
          status: 'BOOKED',
          reasonForVisit,
          consultationFee: doctor.consultationFee,
          tokenNumber,
        },
        include: {
          patient: true,
          doctor: {
            include: {
              user: { select: { name: true } },
            },
          },
        },
      });
    });

    return NextResponse.json({ success: true, appointment });
  } catch (error: any) {
    console.error('Error booking appointment via API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
