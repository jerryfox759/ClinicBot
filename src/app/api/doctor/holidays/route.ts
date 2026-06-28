import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

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

    const holidays = await prisma.holiday.findMany({
      where: { doctorId: doctor.id },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json({ holidays });
  } catch (error: any) {
    console.error('Error fetching holidays:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    const { date, reason } = await request.json();

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const holiday = await prisma.holiday.create({
      data: {
        doctorId: doctor.id,
        date: new Date(date),
        reason: reason || '',
      },
    });

    return NextResponse.json({ holiday });
  } catch (error: any) {
    console.error('Error adding holiday:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Holiday ID is required' }, { status: 400 });
    }

    const holiday = await prisma.holiday.findFirst({
      where: { id, doctorId: doctor.id },
    });

    if (!holiday) {
      return NextResponse.json({ error: 'Holiday not found or unauthorized' }, { status: 404 });
    }

    await prisma.holiday.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Holiday deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting holiday:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
