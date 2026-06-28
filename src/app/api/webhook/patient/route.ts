import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Language } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, name, age, gender, language } = body;

    if (!phone || !name) {
      return NextResponse.json(
        { error: 'Missing required parameters: phone and name' },
        { status: 400 }
      );
    }

    const ageInt = age ? parseInt(age) : undefined;
    const genderStr = gender ? String(gender) : undefined;

    const patient = await prisma.$transaction(async (tx) => {
      // Upsert patient profile
      const pat = await tx.patient.upsert({
        where: { phone },
        update: {
          name,
          age: ageInt,
          gender: genderStr,
        },
        create: {
          phone,
          name,
          age: ageInt || 0,
          gender: genderStr || 'OTHER',
        },
      });

      // Handle language preference sync if provided
      if (language) {
        const langEnum = language as Language;
        await tx.languagePreference.upsert({
          where: { patientId: pat.id },
          update: { language: langEnum },
          create: { patientId: pat.id, language: langEnum },
        });
      }

      return tx.patient.findUnique({
        where: { id: pat.id },
        include: { languagePreference: true },
      });
    });

    return NextResponse.json({ success: true, patient });
  } catch (error: any) {
    console.error('Webhook patient error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
