import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const doctors = await prisma.doctor.findMany({
      where: { clinicId: user.clinicId },
      include: {
        user: { select: { name: true } }
      }
    });

    return NextResponse.json({ doctors });
  } catch (error: any) {
    console.error('Error fetching clinic doctors:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
