import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, signJWT } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password, name, role, clinicName, specialty, planId } = await request.json();

    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: 'Name, email, password and role are required' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Run transaction
    const result = await prisma.$transaction(async (tx: any) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          name,
          role,
        },
      });

      let clinicId = null;
      let doctorId = null;

      if (role === 'DOCTOR') {
        // Create a default clinic for this doctor
        const clinic = await tx.clinic.create({
          data: {
            name: clinicName || `${name}'s Chamber`,
            address: '123 Health Street, Clinic Suite',
          },
        });
        clinicId = clinic.id;

        // Create the doctor profile
        const doctor = await tx.doctor.create({
          data: {
            userId: user.id,
            clinicId: clinic.id,
            specialty: specialty || 'General Practitioner',
            consultationFee: 500,
            slotDuration: 15,
          },
        });
        doctorId = doctor.id;

        // 1. Assign Subscription Plan
        let targetPlan = null;
        if (planId) {
          targetPlan = await tx.plan.findUnique({
            where: { id: planId },
          });
        }
        
        if (!targetPlan) {
          targetPlan = await tx.plan.findFirst({
            orderBy: { price: 'asc' },
          });
        }

        if (targetPlan) {
          await tx.subscription.create({
            data: {
              doctorId: doctor.id,
              planId: targetPlan.id,
              status: 'ACTIVE',
              startDate: new Date(),
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            },
          });
        }

        // 2. Create default working days (Monday - Saturday)
        const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
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
      }

      return { user, clinicId, doctorId };
    });

    const payload = {
      userId: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: result.user.role,
      clinicId: result.clinicId,
      doctorId: result.doctorId,
    };

    const token = await signJWT(payload);

    const response = NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
      },
    });

    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
