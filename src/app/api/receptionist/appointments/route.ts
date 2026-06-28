import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getAvailableSlots } from '@/lib/booking';
import { AppointmentStatus } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date'); // YYYY-MM-DD
    const query = searchParams.get('query') || '';
    const status = searchParams.get('status') || 'ALL';

    // Scoping query to the clinic context
    const clinicId = user.clinicId;
    if (!clinicId) {
      return NextResponse.json({ error: 'No clinic associated with user session' }, { status: 400 });
    }

    let whereClause: any = { clinicId };

    if (dateParam) {
      const startOfDay = new Date(dateParam);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(dateParam);
      endOfDay.setUTCHours(23, 59, 59, 999);

      whereClause.date = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    if (status !== 'ALL') {
      whereClause.status = status as AppointmentStatus;
    }

    if (query) {
      whereClause.OR = [
        { patient: { name: { contains: query, mode: 'insensitive' } } },
        { patient: { phone: { contains: query, mode: 'insensitive' } } },
        { appointmentNumber: { contains: query, mode: 'insensitive' } },
      ];
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        patient: true,
        doctor: {
          include: {
            user: { select: { name: true } }
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { timeSlot: 'asc' },
      ],
    });

    return NextResponse.json({ appointments });
  } catch (error: any) {
    console.error('Error fetching receptionist appointments:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clinicId = user.clinicId;
    if (!clinicId) {
      return NextResponse.json({ error: 'No clinic associated with session' }, { status: 400 });
    }

    const {
      doctorId,
      patientName,
      patientPhone,
      patientAge,
      patientGender,
      patientAddress,
      date: dateStr,
      timeSlot,
      reasonForVisit,
    } = await request.json();

    if (!doctorId || !patientName || !patientPhone || !patientAge || !patientGender || !dateStr || !timeSlot || !reasonForVisit) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // 1. Verify Slot Availability
    const slots = await getAvailableSlots(doctorId, dateStr);
    const slot = slots.find((s) => s.time === timeSlot);
    if (!slot || !slot.available) {
      return NextResponse.json({ error: 'Selected time slot is already occupied or unavailable' }, { status: 400 });
    }

    // 2. Load Doctor Base consultation Fee
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
    });
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    const date = new Date(dateStr);
    const startOfDay = new Date(dateStr);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(dateStr);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Run in Prisma transaction
    const appointment = await prisma.$transaction(async (tx) => {
      // 3. Upsert Patient
      const patient = await tx.patient.upsert({
        where: { phone: patientPhone },
        update: {
          name: patientName,
          age: parseInt(patientAge),
          gender: patientGender,
          address: patientAddress || null,
        },
        create: {
          name: patientName,
          phone: patientPhone,
          age: parseInt(patientAge),
          gender: patientGender,
          address: patientAddress || null,
        },
      });

      // 4. Calculate Token Number
      const count = await tx.appointment.count({
        where: {
          doctorId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: {
            in: ['BOOKED', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'FOLLOW_UP'],
          },
        },
      });
      const tokenNumber = count + 1;

      // 5. Generate unique Appointment Number (e.g., CB-20260628-001)
      const dateCode = dateStr.replace(/-/g, '');
      const serialCode = tokenNumber.toString().padStart(3, '0');
      const appointmentNumber = `CB-${dateCode}-${serialCode}`;

      // 6. Create Appointment
      return tx.appointment.create({
        data: {
          appointmentNumber,
          patientId: patient.id,
          doctorId,
          clinicId,
          date,
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
              user: { select: { name: true } }
            }
          }
        }
      });
    });

    return NextResponse.json({ success: true, appointment });
  } catch (error: any) {
    console.error('Error booking walk-in:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { appointmentId, status, date: dateStr, timeSlot } = await request.json();

    if (!appointmentId) {
      return NextResponse.json({ error: 'Appointment ID is required' }, { status: 400 });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // 1. Rescheduling logic
    if (dateStr && timeSlot) {
      // Validate slot availability
      const slots = await getAvailableSlots(appointment.doctorId, dateStr);
      const slot = slots.find((s) => s.time === timeSlot);
      if (!slot || !slot.available) {
        return NextResponse.json({ error: 'Selected time slot is already occupied or unavailable' }, { status: 400 });
      }

      const updated = await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          date: new Date(dateStr),
          timeSlot,
        },
        include: { patient: true },
      });

      return NextResponse.json({ success: true, appointment: updated });
    }

    // 2. Status update logic
    if (status) {
      const updated = await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          status: status as AppointmentStatus,
        },
        include: { patient: true },
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId: user.userId,
          action: `UPDATE_APPOINTMENT_STATUS`,
          details: `Appointment ${appointment.appointmentNumber} updated to ${status}`,
        }
      });

      return NextResponse.json({ success: true, appointment: updated });
    }

    return NextResponse.json({ error: 'Invalid update parameters' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating appointment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
