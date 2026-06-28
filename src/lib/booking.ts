import prisma from './prisma';
import { DayOfWeek } from '@prisma/client';

export interface TimeSlot {
  time: string; // e.g., "10:30"
  available: boolean;
}

/**
 * Calculates available time slots for a doctor on a specific date.
 */
export async function getAvailableSlots(doctorId: string, dateStr: string): Promise<TimeSlot[]> {
  try {
    const date = new Date(dateStr);
    
    // 1. Fetch Doctor details, Working Days, and Holidays
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: {
        workingDays: true,
        holidays: true,
      },
    });

    if (!doctor) {
      throw new Error('Doctor profile not found');
    }

    // 2. Check if the date is a holiday
    const isHoliday = doctor.holidays.some((holiday) => {
      const holidayDate = new Date(holiday.date).toISOString().split('T')[0];
      return holidayDate === dateStr;
    });

    if (isHoliday) {
      return [];
    }

    // 3. Get Day of Week
    const days: DayOfWeek[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const dayOfWeek = days[date.getDay()];

    // Find working day config
    const workingDay = doctor.workingDays.find((d) => d.dayOfWeek === dayOfWeek);
    if (!workingDay || !workingDay.isWorking) {
      return [];
    }

    // 4. Generate all slots between startTime and endTime
    const slots: string[] = [];
    const duration = doctor.slotDuration; // in minutes

    const parseTime = (tStr: string) => {
      const [h, m] = tStr.split(':').map(Number);
      return h * 60 + m;
    };

    const formatTime = (totalMin: number) => {
      const h = Math.floor(totalMin / 60);
      const m = totalMin % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    const startMin = parseTime(workingDay.startTime);
    const endMin = parseTime(workingDay.endTime);
    
    const breakStartMin = workingDay.breakStart ? parseTime(workingDay.breakStart) : null;
    const breakEndMin = workingDay.breakEnd ? parseTime(workingDay.breakEnd) : null;

    let currentMin = startMin;
    while (currentMin + duration <= endMin) {
      // Check if slot falls inside break time
      let insideBreak = false;
      if (breakStartMin !== null && breakEndMin !== null) {
        insideBreak = currentMin >= breakStartMin && currentMin < breakEndMin;
      }

      if (!insideBreak) {
        slots.push(formatTime(currentMin));
      }
      currentMin += duration;
    }

    // 5. Load active appointments for this doctor on this day
    const startOfDay = new Date(dateStr);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(dateStr);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const activeAppointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ['BOOKED', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'FOLLOW_UP'],
        },
      },
      select: {
        timeSlot: true,
      },
    });

    const bookedSlots = new Set(activeAppointments.map((app) => app.timeSlot));

    // 6. Map slots to TimeSlot objects with availability flags
    return slots.map((time) => ({
      time,
      available: !bookedSlots.has(time),
    }));
  } catch (error) {
    console.error('Error in getAvailableSlots:', error);
    return [];
  }
}
