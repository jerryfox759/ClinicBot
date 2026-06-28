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

    const fees = await prisma.fee.findMany({
      where: { doctorId: doctor.id },
      orderBy: { amount: 'asc' },
    });

    return NextResponse.json({ fees });
  } catch (error: any) {
    console.error('Error fetching fees:', error);
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

    const { appointmentType, amount, currency } = await request.json();

    if (!appointmentType || amount === undefined) {
      return NextResponse.json({ error: 'Appointment type and amount are required' }, { status: 400 });
    }

    const fee = await prisma.fee.create({
      data: {
        doctorId: doctor.id,
        appointmentType,
        amount: parseFloat(amount),
        currency: currency || 'INR',
      },
    });

    return NextResponse.json({ fee });
  } catch (error: any) {
    console.error('Error adding fee:', error);
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
      return NextResponse.json({ error: 'Fee ID is required' }, { status: 400 });
    }

    const fee = await prisma.fee.findFirst({
      where: { id, doctorId: doctor.id },
    });

    if (!fee) {
      return NextResponse.json({ error: 'Fee not found or unauthorized' }, { status: 404 });
    }

    await prisma.fee.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Fee deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting fee:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
