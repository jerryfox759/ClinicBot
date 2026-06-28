import { NextResponse } from 'next/server';
import { getAvailableSlots } from '@/lib/booking';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    // Receptionists, Doctors, and Admin can view slots
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');
    const dateStr = searchParams.get('date'); // YYYY-MM-DD

    if (!doctorId || !dateStr) {
      return NextResponse.json({ error: 'doctorId and date are required' }, { status: 400 });
    }

    const slots = await getAvailableSlots(doctorId, dateStr);
    return NextResponse.json({ slots });
  } catch (error: any) {
    console.error('Error fetching slots:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
