import { NextResponse } from 'next/server';
import { getAvailableSlots } from '@/lib/booking';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');
    const date = searchParams.get('date');

    if (!doctorId || !date) {
      return NextResponse.json(
        { error: 'Missing required parameters: doctorId and date' },
        { status: 400 }
      );
    }

    // Validate date format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Expected YYYY-MM-DD' },
        { status: 400 }
      );
    }

    const slots = await getAvailableSlots(doctorId, date);
    return NextResponse.json({ success: true, slots });
  } catch (error: any) {
    console.error('Error fetching available slots:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
