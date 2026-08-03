import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, email, barcode, role, phone, address, isBlocked } = body;

    const updatedPatron = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        barcode,
        role: role?.toUpperCase(),
        phone,
        address,
        isBlocked: Boolean(isBlocked),
      },
      include: { category: true },
    });

    return NextResponse.json({ success: true, patron: updatedPatron });
  } catch (error: any) {
    console.error('Error updating patron:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update patron' },
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

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting patron:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete patron' },
      { status: 500 }
    );
  }
}
