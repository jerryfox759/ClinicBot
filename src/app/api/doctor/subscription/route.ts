import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let doctorId = user.doctorId;
    if (!doctorId) {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: user.userId },
      });
      doctorId = doctor?.id;
    }

    if (!doctorId) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });
    }

    // Fetch active subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        doctorId: doctorId,
        status: 'ACTIVE',
      },
      include: {
        plan: true,
      },
    });

    // Fetch all available plans for pricing options
    const plans = await prisma.plan.findMany({
      orderBy: { price: 'asc' },
    });

    return NextResponse.json({ subscription, plans });
  } catch (error: any) {
    console.error('Error fetching subscription details:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let doctorId = user.doctorId;
    if (!doctorId) {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: user.userId },
      });
      doctorId = doctor?.id;
    }

    if (!doctorId) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });
    }

    const { planId } = await request.json();
    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Subscription plan not found' }, { status: 404 });
    }

    // Run transaction to cancel active subscriptions and create the new one
    const newSubscription = await prisma.$transaction(async (tx) => {
      // Cancel active subscriptions
      await tx.subscription.updateMany({
        where: {
          doctorId: doctorId,
          status: 'ACTIVE',
        },
        data: {
          status: 'CANCELLED',
        },
      });

      // Create new subscription for 30 days
      return tx.subscription.create({
        data: {
          doctorId: doctorId,
          planId: plan.id,
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        include: {
          plan: true,
        },
      });
    });

    return NextResponse.json({ success: true, subscription: newSubscription });
  } catch (error: any) {
    console.error('Error upgrading subscription:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
