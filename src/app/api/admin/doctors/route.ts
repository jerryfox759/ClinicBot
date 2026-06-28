import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

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
