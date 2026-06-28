import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Measure DB connection speed latency
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - start;

    // 2. Check Gemini credentials status
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const geminiStatus = geminiApiKey ? 'CONNECTED' : 'MOCK_ACTIVE';

    // 3. Collect system profiles (mocked CPU and memory load)
    const usage = process.memoryUsage();
    const systemHealth = {
      dbStatus: 'HEALTHY',
      dbLatencyMs,
      geminiStatus,
      cpuUsagePercent: 12 + Math.floor(Math.random() * 8), // Simulation details
      memoryUsageMB: Math.round(usage.heapUsed / 1024 / 1024),
      memoryLimitMB: 512,
      whatsappApiStatus: process.env.WHATSAPP_ACCESS_TOKEN ? 'OPERATIONAL' : 'OFFLINE_MOCK',
    };

    return NextResponse.json({ health: systemHealth });
  } catch (error: any) {
    console.error('Error fetching system health stats:', error);
    return NextResponse.json({
      error: 'System Health Check Failed',
      details: error.message,
    }, { status: 500 });
  }
}
