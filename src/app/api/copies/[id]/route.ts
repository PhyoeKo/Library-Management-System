import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, condition, location, callNumber } = body;

    const copy = await prisma.bookCopy.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(condition && { condition }),
        ...(location && { location }),
        ...(callNumber && { callNumber }),
      },
    });

    return NextResponse.json({ success: true, copy });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update copy status' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.bookCopy.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Copy deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete copy' },
      { status: 500 }
    );
  }
}
