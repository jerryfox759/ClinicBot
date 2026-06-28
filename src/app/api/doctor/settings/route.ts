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
      include: { clinic: true },
    });

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });
    }

    return NextResponse.json({ clinic: doctor.clinic });
  } catch (error: any) {
    console.error('Error fetching clinic settings:', error);
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

    const { name, address, googleMapsUrl, phone, logoUrl, timezone } = await request.json();

    const updatedClinic = await prisma.clinic.update({
      where: { id: doctor.clinicId },
      data: {
        name: name !== undefined ? name : undefined,
        address: address !== undefined ? address : undefined,
        googleMapsUrl: googleMapsUrl !== undefined ? googleMapsUrl : undefined,
        phone: phone !== undefined ? phone : undefined,
        logoUrl: logoUrl !== undefined ? logoUrl : undefined,
        timezone: timezone !== undefined ? timezone : undefined,
      },
    });

    return NextResponse.json({ clinic: updatedClinic });
  } catch (error: any) {
    console.error('Error updating clinic settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
