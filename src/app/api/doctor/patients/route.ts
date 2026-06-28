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
    const query = searchParams.get('query') || '';

    // Search patients who have appointments with this doctor or all patients in the clinic
    // Scoping to this doctor's appointments is more private and secure.
    const patients = await prisma.patient.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        appointments: {
          where: { doctorId: doctor.id },
          orderBy: { date: 'desc' },
        },
        medicalNotes: {
          where: { doctorId: doctor.id },
          orderBy: { createdAt: 'desc' },
        },
        followUpVisits: {
          where: { doctorId: doctor.id },
          orderBy: { followUpDate: 'desc' },
        },
      },
    });

    return NextResponse.json({ patients });
  } catch (error: any) {
    console.error('Error fetching patients:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
