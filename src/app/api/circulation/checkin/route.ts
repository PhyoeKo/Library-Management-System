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

    const inputTrimmed = copyBarcode.trim();
    let copy = await prisma.bookCopy.findUnique({
      where: { barcode: inputTrimmed },
      include: {
        book: true,
        loans: {
          where: { status: { in: ['ISSUED', 'OVERDUE'] } },
          include: { user: { include: { category: true } } },
        },
      },
    });

    if (!copy) {
      // Try by ISBN
      const bookByIsbn = await prisma.book.findUnique({
        where: { isbn: inputTrimmed },
        include: { copies: true },
      });

      if (bookByIsbn && bookByIsbn.copies.length > 0) {
        const activeLoan = await prisma.loan.findFirst({
          where: {
            copyId: { in: bookByIsbn.copies.map((c) => c.id) },
            status: { in: ['ISSUED', 'OVERDUE'] },
          },
          include: {
            copy: {
              include: {
                book: true,
                loans: {
                  where: { status: { in: ['ISSUED', 'OVERDUE'] } },
                  include: { user: { include: { category: true } } },
                },
              },
            },
          },
        });

        if (activeLoan) {
          copy = activeLoan.copy;
        }
      }
    }

    if (!copy) {
      return NextResponse.json(
        { success: false, error: `Copy with Barcode or ISBN "${copyBarcode}" not found.` },
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
      // Use the book's specific daily overdue fine rate in MMK, fallback to patron category or 500 MMK
      const bookFineRate = copy.book.dailyFineRate;
      let fineRatePerDay = bookFineRate ?? category?.fineRatePerDay ?? 500;
      if (fineRatePerDay < 10) fineRatePerDay = 500;

      const gracePeriodDays = category?.gracePeriodDays ?? 0;

      const diffMs = now.getTime() - new Date(activeLoan.dueDate).getTime();
      const overdueDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const chargeableDays = Math.max(0, overdueDays - gracePeriodDays);
      calculatedFineAmount = Math.round(chargeableDays * fineRatePerDay);

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
