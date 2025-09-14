// app/api/stations/route.ts  (Next.js App Router API route — server)
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db'; // server-only import

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get('q') ?? '';

    // Example: simple search by name or code
    const stations = await prisma.station.findMany({
      where: {
        OR: [
          { stationname: { contains: q, mode: 'insensitive' } },
          { StationCode: { contains: q, mode: 'insensitive' } }
        ]
      },
      take: 20
    });

    return NextResponse.json(stations);
  } catch (err) {
    console.error('API /api/stations error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
