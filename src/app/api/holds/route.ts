import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/holds — list all holds, optionally filtered by ?status=PENDING|APPROVED|FULFILLED|CANCELLED
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const holds = await prisma.hold.findMany({
      where,
      include: {
        user: true,
        book: {
          include: {
            copies: {
              select: { id: true, status: true, barcode: true },
            },
          },
        },
      },
      orderBy: { requestDate: 'asc' },
    });

    // Enrich with queue position and available copy count
    const enriched = await Promise.all(
      holds.map(async (hold) => {
        const queuePosition = await prisma.hold.count({
          where: {
            bookId: hold.bookId,
            status: 'PENDING',
            requestDate: { lte: hold.requestDate },
          },
        });
        const availableCopies = hold.book.copies.filter(
          (c) => c.status === 'AVAILABLE'
        ).length;
        return { ...hold, queuePosition, availableCopies };
      })
    );

    return NextResponse.json({ success: true, count: enriched.length, holds: enriched });
  } catch (error: any) {
    console.error('Error fetching holds:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch holds' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookId, patronBarcode, patronEmail } = body;

    if (!bookId) {
      return NextResponse.json(
        { success: false, error: 'Book ID is required.' },
        { status: 400 }
      );
    }

    // Find User by barcode or email or fallback to first patron
    let user = null;
    if (patronBarcode) {
      user = await prisma.user.findUnique({ where: { barcode: patronBarcode } });
    }
    if (!user && patronEmail) {
      user = await prisma.user.findUnique({ where: { email: patronEmail } });
    }
    if (!user) {
      user = await prisma.user.findFirst({ where: { role: 'PATRON' } });
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Please sign in as a patron to reserve books.' },
        { status: 401 }
      );
    }

    // Check if user already has an active hold on this book
    const existingHold = await prisma.hold.findFirst({
      where: {
        userId: user.id,
        bookId,
        status: 'PENDING',
      },
    });

    if (existingHold) {
      // Calculate position
      const previousHolds = await prisma.hold.count({
        where: {
          bookId,
          status: 'PENDING',
          requestDate: { lt: existingHold.requestDate },
        },
      });

      return NextResponse.json({
        success: true,
        alreadyReserved: true,
        queuePosition: previousHolds + 1,
        message: `You already have an active hold on this item (Queue Position #${previousHolds + 1}).`,
      });
    }

    // Create new Hold
    const newHold = await prisma.hold.create({
      data: {
        userId: user.id,
        bookId,
        status: 'PENDING',
      },
    });

    // Calculate queue position
    const holdsCount = await prisma.hold.count({
      where: {
        bookId,
        status: 'PENDING',
        requestDate: { lte: newHold.requestDate },
      },
    });

    return NextResponse.json({
      success: true,
      hold: newHold,
      queuePosition: holdsCount,
      message: `Reservation successful! You are #${holdsCount} in queue.`,
    });
  } catch (error: any) {
    console.error('Error creating hold:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to place hold' },
      { status: 500 }
    );
  }
}
