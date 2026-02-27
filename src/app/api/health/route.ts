import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  checks: {
    database: {
      status: 'up' | 'down';
      latency?: number;
      error?: string;
    };
    api: {
      status: 'up' | 'down';
    };
  };
}

const startTime = Date.now();

export async function GET() {
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    checks: {
      database: {
        status: 'down',
      },
      api: {
        status: 'up',
      },
    },
  };

  try {
    const supabase = await createClient();
    const dbStart = Date.now();
    
    const { error } = await supabase.from('settings').select('id').limit(1);
    
    const latency = Date.now() - dbStart;
    
    if (error) {
      health.checks.database.status = 'down';
      health.checks.database.error = error.message;
      health.status = 'degraded';
    } else {
      health.checks.database.status = 'up';
      health.checks.database.latency = latency;
    }
  } catch (error) {
    health.checks.database.status = 'down';
    health.checks.database.error = error instanceof Error ? error.message : 'Unknown error';
    health.status = 'unhealthy';
  }

  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

  return NextResponse.json(health, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store, must-revalidate',
      'X-Health-Status': health.status,
    },
  });
}
