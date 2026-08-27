import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/holds/[id] — fetch a single hold with full details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const hold = await prisma.hold.findUnique({
      where: { id },
      include: {
        user: true,
        book: { include: { copies: true } },
      },
    });

    if (!hold) {
      return NextResponse.json(
        { success: false, error: 'Hold not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, hold });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch hold' },
      { status: 500 }
    );
  }
}

// PATCH /api/holds/[id] — update hold status
// Body: { status: 'APPROVED' | 'FULFILLED' | 'CANCELLED' }
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const validStatuses = ['APPROVED', 'FULFILLED', 'CANCELLED'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const hold = await prisma.hold.findUnique({
      where: { id },
      include: { user: true, book: true },
    });

    if (!hold) {
      return NextResponse.json(
        { success: false, error: 'Hold record not found' },
        { status: 404 }
      );
    }

    if (hold.status === 'FULFILLED' || hold.status === 'CANCELLED') {
      return NextResponse.json(
        { success: false, error: `Hold is already ${hold.status} and cannot be changed.` },
        { status: 409 }
      );
    }

    const updatedHold = await prisma.hold.update({
      where: { id },
      data: { status },
      include: {
        user: true,
        book: { include: { copies: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Hold status updated to ${status}.`,
      hold: updatedHold,
    });
  } catch (error: any) {
    console.error('Hold update error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update hold' },
      { status: 500 }
    );
  }
}

// DELETE /api/holds/[id] — hard-delete a cancelled/fulfilled hold
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.hold.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Hold record deleted.' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete hold' },
      { status: 500 }
    );
  }
}
