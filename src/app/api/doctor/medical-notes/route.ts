import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
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
    const patientId = searchParams.get('patientId');

    const medicalNotes = await prisma.medicalNote.findMany({
      where: {
        doctorId: doctor.id,
        patientId: patientId ? patientId : undefined,
      },
      include: {
        patient: {
          select: { name: true, phone: true }
        },
        appointment: {
          select: { appointmentNumber: true, date: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ medicalNotes });
  } catch (error: any) {
    console.error('Error fetching medical notes:', error);
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

    const { patientId, appointmentId, diagnosis, prescription, symptoms, advice } = await request.json();

    if (!patientId || !diagnosis || !prescription) {
      return NextResponse.json({ error: 'Patient ID, diagnosis, and prescription are required' }, { status: 400 });
    }

    const note = await prisma.medicalNote.create({
      data: {
        doctorId: doctor.id,
        patientId,
        appointmentId: appointmentId || null,
        diagnosis,
        prescription,
        symptoms: symptoms || '',
        advice: advice || '',
      },
    });

    return NextResponse.json({ note });
  } catch (error: any) {
    console.error('Error adding medical note:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
