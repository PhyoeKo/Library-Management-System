import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { copyBarcode } = body;

    if (!copyBarcode) {
      return NextResponse.json(
        { success: false, error: 'Copy barcode is required.' },
        { status: 400 }
      );
    }

    const copy = await prisma.bookCopy.findUnique({
      where: { barcode: copyBarcode },
      include: {
        book: true,
        loans: {
          where: { status: { in: ['ISSUED', 'OVERDUE'] } },
          include: { user: { include: { category: true } } },
        },
      },
    });

    if (!copy) {
      return NextResponse.json(
        { success: false, error: `Copy with barcode "${copyBarcode}" not found.` },
        { status: 404 }
      );
    }

    const activeLoan = copy.loans[0];
    if (!activeLoan) {
      return NextResponse.json(
        { success: false, error: `Item "${copy.book.title}" (${copyBarcode}) is not currently on loan.` },
        { status: 400 }
      );
    }

    const now = new Date();
    let calculatedFineAmount = 0;
    let fineRecord = null;

    if (now > new Date(activeLoan.dueDate)) {
      const category = activeLoan.user.category;
      const fineRatePerDay = category?.fineRatePerDay ?? 0.50;
      const gracePeriodDays = category?.gracePeriodDays ?? 1;

      const diffMs = now.getTime() - new Date(activeLoan.dueDate).getTime();
      const overdueDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const chargeableDays = Math.max(0, overdueDays - gracePeriodDays);
      calculatedFineAmount = parseFloat((chargeableDays * fineRatePerDay).toFixed(2));

      if (calculatedFineAmount > 0) {
        fineRecord = await prisma.fine.create({
          data: {
            userId: activeLoan.userId,
            loanId: activeLoan.id,
            amount: calculatedFineAmount,
            paidAmount: 0,
            reason: 'OVERDUE',
            status: 'UNPAID',
          },
        });
      }
    }

    await prisma.$transaction([
      prisma.loan.update({
        where: { id: activeLoan.id },
        data: {
          status: 'RETURNED',
          returnedDate: now,
        },
      }),
      prisma.bookCopy.update({
        where: { id: copy.id },
        data: { status: 'AVAILABLE' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Book "${copy.book.title}" successfully returned.`,
      wasOverdue: calculatedFineAmount > 0,
      fineAssessed: calculatedFineAmount,
      fine: fineRecord,
    });
  } catch (error: any) {
    console.error('Checkin error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process check-in' },
      { status: 500 }
    );
  }
}
