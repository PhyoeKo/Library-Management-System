import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const patron = await prisma.user.findUnique({
      where: { id },
      include: {
        category: true,
        loans: {
          include: {
            copy: { include: { book: true } },
          },
          orderBy: { issuedDate: 'desc' },
        },
        fines: {
          include: { loan: { include: { copy: { include: { book: true } } } } },
          orderBy: { createdAt: 'desc' },
        },
        holds: {
          include: { book: true },
          orderBy: { requestDate: 'desc' },
        },
      },
    });

    if (!patron) {
      return NextResponse.json({ success: false, error: 'Patron not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, patron });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      email,
      barcode,
      role,
      categoryId,
      phone,
      address,
      nrcNumber,
      nrcFrontUrl,
      nrcBackUrl,
      kycStatus,
      isBlocked,
      blockReason,
    } = body;

    const updatedPatron = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(email && { email: email.trim() }),
        ...(barcode && { barcode: barcode.trim() }),
        ...(role && { role: role.toUpperCase() }),
        ...(categoryId !== undefined && { categoryId: categoryId || null }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(address !== undefined && { address: address || null }),
        ...(nrcNumber !== undefined && { nrcNumber: nrcNumber || null }),
        ...(nrcFrontUrl !== undefined && { nrcFrontUrl: nrcFrontUrl || null }),
        ...(nrcBackUrl !== undefined && { nrcBackUrl: nrcBackUrl || null }),
        ...(kycStatus !== undefined && { kycStatus }),
        ...(isBlocked !== undefined && {
          isBlocked: Boolean(isBlocked),
          blockReason: isBlocked ? (blockReason || 'Suspended by staff') : null,
        }),
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

    // Check if patron has active loans or unpaid fines
    const activeLoans = await prisma.loan.count({
      where: { userId: id, status: { in: ['ISSUED', 'OVERDUE'] } },
    });

    if (activeLoans > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete member with active book loans. Check in all copies first.' },
        { status: 400 }
      );
    }

    const unpaidFines = await prisma.fine.count({
      where: { userId: id, status: { in: ['UNPAID', 'PARTIALLY_PAID'] } },
    });

    if (unpaidFines > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete member with outstanding unpaid fines.' },
        { status: 400 }
      );
    }

    // Clean up closed records if any
    await prisma.fine.deleteMany({ where: { userId: id } });
    await prisma.loan.deleteMany({ where: { userId: id } });
    await prisma.hold.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Member record successfully deleted' });
  } catch (error: any) {
    console.error('Error deleting patron:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete patron' },
      { status: 500 }
    );
  }
}
