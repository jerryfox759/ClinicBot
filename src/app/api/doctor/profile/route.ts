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
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        clinic: true,
      },
    });

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });
    }

    return NextResponse.json({ doctor });
  } catch (error: any) {
    console.error('Error fetching doctor profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { specialty, bio, consultationFee, slotDuration, name } = await request.json();

    const doctorProfile = await prisma.doctor.findUnique({
      where: { userId: user.userId },
    });

    if (!doctorProfile) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });
    }

    const updatedDoctor = await prisma.$transaction(async (tx) => {
      // Update User Name if provided
      if (name) {
        await tx.user.update({
          where: { id: user.userId },
          data: { name },
        });
      }

      // Update Doctor Profile
      return tx.doctor.update({
        where: { id: doctorProfile.id },
        data: {
          specialty: specialty !== undefined ? specialty : undefined,
          bio: bio !== undefined ? bio : undefined,
          consultationFee: consultationFee !== undefined ? parseFloat(consultationFee) : undefined,
          slotDuration: slotDuration !== undefined ? parseInt(slotDuration) : undefined,
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
    });

    return NextResponse.json({ doctor: updatedDoctor });
  } catch (error: any) {
    console.error('Error updating doctor profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
