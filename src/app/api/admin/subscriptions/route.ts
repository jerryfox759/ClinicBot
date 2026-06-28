import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { SubscriptionStatus } from '@prisma/client';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscriptions = await prisma.subscription.findMany({
      include: {
        plan: {
          select: {
            name: true,
            price: true,
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { endDate: 'asc' },
    });

    return NextResponse.json({ subscriptions });
  } catch (error: any) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscriptionId, status } = await request.json();

    if (!subscriptionId || !status) {
      return NextResponse.json({ error: 'Subscription ID and status are required' }, { status: 400 });
    }

    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: status as SubscriptionStatus,
      },
      include: {
        plan: true,
        doctor: { include: { user: true } },
      },
    });

    return NextResponse.json({ subscription: updated });
  } catch (error: any) {
    console.error('Error updating subscription:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
