import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/serials - List serial subscriptions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q');
    const frequency = searchParams.get('frequency');

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { issn: { contains: search } },
        { publisher: { contains: search } },
      ];
    }
    if (frequency && frequency !== 'ALL') {
      where.frequency = frequency;
    }

    const subscriptions = await prisma.serialSubscription.findMany({
      where,
      orderBy: { title: 'asc' },
    });

    return NextResponse.json({
      success: true,
      count: subscriptions.length,
      subscriptions,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/serials - Add new serial subscription
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, issn, frequency = 'MONTHLY', publisher, active = true } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: 'Subscription title is required' }, { status: 400 });
    }

    const serial = await prisma.serialSubscription.create({
      data: {
        title: title.trim(),
        issn: issn ? issn.trim() : null,
        frequency,
        publisher: publisher ? publisher.trim() : null,
        active: Boolean(active),
      },
    });

    return NextResponse.json({ success: true, serial }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
