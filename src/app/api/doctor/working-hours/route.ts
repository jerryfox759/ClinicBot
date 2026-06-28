import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { DayOfWeek } from '@prisma/client';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { userId: user.userId },
    });

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });
    }

    const workingDays = await prisma.workingDay.findMany({
      where: { doctorId: doctor.id },
    });

    // Sort order: Monday to Sunday
    const dayOrder: Record<DayOfWeek, number> = {
      MONDAY: 1,
      TUESDAY: 2,
      WEDNESDAY: 3,
      THURSDAY: 4,
      FRIDAY: 5,
      SATURDAY: 6,
      SUNDAY: 7,
    };

    const sortedDays = workingDays.sort((a, b) => dayOrder[a.dayOfWeek] - dayOrder[b.dayOfWeek]);

    return NextResponse.json({ workingDays: sortedDays });
  } catch (error: any) {
    console.error('Error fetching working days:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { userId: user.userId },
    });

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });
    }

    const { workingDays } = await request.json();

    if (!workingDays || !Array.isArray(workingDays)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    await prisma.$transaction(
      workingDays.map((day: any) => {
        return prisma.workingDay.update({
          where: { id: day.id },
          data: {
            isWorking: day.isWorking,
            startTime: day.startTime,
            endTime: day.endTime,
            breakStart: day.breakStart,
            breakEnd: day.breakEnd,
          },
        });
      })
    );

    const updatedWorkingDays = await prisma.workingDay.findMany({
      where: { doctorId: doctor.id },
    });

    return NextResponse.json({ workingDays: updatedWorkingDays });
  } catch (error: any) {
    console.error('Error updating working days:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
