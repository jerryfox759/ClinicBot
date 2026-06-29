import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const doctors = await prisma.doctor.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            createdAt: true,
          },
        },
        clinic: {
          select: {
            name: true,
          },
        },
        subscriptions: {
          include: {
            plan: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ doctors });
  } catch (error: any) {
    console.error('Error fetching doctors listing:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser || sessionUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, email, password, specialty, clinicName, planId } = await request.json();

    if (!name || !email || !password || !specialty || !clinicName || !planId) {
      return NextResponse.json(
        { error: 'Name, email, password, specialty, clinic name, and subscription plan are required' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email is already registered' },
        { status: 400 }
      );
    }

    // Hash the password
    const passwordHash = await hashPassword(password);

    // Create the doctor via transaction
    const newDoctor = await prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          name,
          role: 'DOCTOR',
        },
      });

      // 2. Create Clinic
      const clinic = await tx.clinic.create({
        data: {
          name: clinicName,
          address: '456 Healthcare Blvd, Medical Suite',
        },
      });

      // 3. Create Doctor Profile
      const doctor = await tx.doctor.create({
        data: {
          userId: user.id,
          clinicId: clinic.id,
          specialty,
          consultationFee: 500,
          slotDuration: 15,
        },
      });

      // 4. Create Subscription
      // Fetch plan to make sure it exists
      const plan = await tx.plan.findUnique({
        where: { id: planId },
      });

      if (!plan) {
        throw new Error('Subscription plan not found');
      }

      await tx.subscription.create({
        data: {
          doctorId: doctor.id,
          planId: plan.id,
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });

      // 5. Create default working days (Monday - Saturday)
      const days: ('MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY')[] = [
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
        'SATURDAY',
      ];

      for (const day of days) {
        await tx.workingDay.create({
          data: {
            doctorId: doctor.id,
            dayOfWeek: day,
            isWorking: true,
            startTime: '10:00',
            endTime: '17:00',
            breakStart: '13:00',
            breakEnd: '14:00',
          },
        });
      }

      return {
        id: doctor.id,
        specialty: doctor.specialty,
        createdAt: doctor.createdAt,
        user: {
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        },
        clinic: {
          name: clinic.name,
        },
        subscriptions: [
          {
            plan: {
              name: plan.name,
            },
          },
        ],
      };
    });

    return NextResponse.json({ success: true, doctor: newDoctor }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating doctor:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

