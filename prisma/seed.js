const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  // Clear existing records in correct order to avoid foreign key issues
  await prisma.workingDay.deleteMany({});
  await prisma.holiday.deleteMany({});
  await prisma.fee.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.reminderQueue.deleteMany({});
  await prisma.medicalNote.deleteMany({});
  await prisma.followUpVisit.deleteMany({});
  await prisma.subscription.deleteMany({});
  
  await prisma.receptionist.deleteMany({});
  await prisma.doctor.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.clinic.deleteMany({});
  await prisma.plan.deleteMany({});

  // 1. Create a Plan
  const plan = await prisma.plan.create({
    data: {
      name: 'Growth Plan',
      price: 49.00,
      durationMonths: 1,
      maxAppointments: 1000,
      maxDoctors: 3,
      features: ['WhatsApp Bot Integration', 'AI Auto Booking', 'Multi-tenant Support'],
    }
  });
  console.log('Seeded Plan:', plan.name);

  // 2. Create Super Admin User
  const adminHash = await bcrypt.hash('AdminPass123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@clinicbot.ai',
      name: 'Dr. Sarah Jenkins (Super Admin)',
      passwordHash: adminHash,
      role: 'SUPER_ADMIN',
    }
  });
  console.log('Seeded Admin:', admin.email);

  // 3. Create Clinic
  const clinic = await prisma.clinic.create({
    data: {
      name: 'Metro Care Clinic',
      address: '456 Medical Parkway, Sector 5, Kolkata',
      phone: '+919876543210',
      googleMapsUrl: 'https://maps.google.com',
    }
  });
  console.log('Seeded Clinic:', clinic.name);

  // 4. Create Doctor User and Profile
  const doctorHash = await bcrypt.hash('DoctorPass123', 10);
  const doctorUser = await prisma.user.create({
    data: {
      email: 'doctor@clinicbot.ai',
      name: 'Dr. Meraj Khan',
      passwordHash: doctorHash,
      role: 'DOCTOR',
    }
  });

  const doctor = await prisma.doctor.create({
    data: {
      userId: doctorUser.id,
      clinicId: clinic.id,
      specialty: 'Cardiologist',
      bio: 'Senior Consultant Cardiologist with 15+ years experience.',
      consultationFee: 500,
      slotDuration: 15,
    }
  });
  console.log('Seeded Doctor:', doctorUser.email);

  // Create Subscription for Doctor
  await prisma.subscription.create({
    data: {
      doctorId: doctor.id,
      planId: plan.id,
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    }
  });

  // Create Working Days
  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  for (const day of days) {
    await prisma.workingDay.create({
      data: {
        doctorId: doctor.id,
        dayOfWeek: day,
        isWorking: true,
        startTime: '10:00',
        endTime: '17:00',
        breakStart: '13:00',
        breakEnd: '14:00',
      }
    });
  }

  // 5. Create Receptionist User and Profile
  const receptionistHash = await bcrypt.hash('ReceptionistPass123', 10);
  const receptionistUser = await prisma.user.create({
    data: {
      email: 'receptionist@clinicbot.ai',
      name: 'Anjali Sharma (Receptionist)',
      passwordHash: receptionistHash,
      role: 'RECEPTIONIST',
    }
  });

  await prisma.receptionist.create({
    data: {
      userId: receptionistUser.id,
      clinicId: clinic.id,
      doctorId: doctor.id,
    }
  });
  console.log('Seeded Receptionist:', receptionistUser.email);

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
