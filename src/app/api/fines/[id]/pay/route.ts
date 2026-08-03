import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { amountPaid, paymentMethod, processedBy } = body;

    const amount = parseFloat(amountPaid);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid payment amount is required.' },
        { status: 400 }
      );
    }

    const fine = await prisma.fine.findUnique({
      where: { id },
      include: { user: true, loan: { include: { copy: { include: { book: true } } } } },
    });

    if (!fine) {
      return NextResponse.json(
        { success: false, error: 'Fine record not found' },
        { status: 404 }
      );
    }

    const remainingBalance = fine.amount - fine.paidAmount;
    if (amount > remainingBalance + 0.01) {
      return NextResponse.json(
        {
          success: false,
          error: `Payment amount ($${amount.toFixed(
            2
          )}) exceeds outstanding balance ($${remainingBalance.toFixed(2)}).`,
        },
        { status: 400 }
      );
    }

    const newPaidAmount = parseFloat((fine.paidAmount + amount).toFixed(2));
    const isFullyPaid = newPaidAmount >= fine.amount - 0.01;
    const newStatus = isFullyPaid ? 'PAID' : 'PARTIALLY_PAID';

    // Generate POS receipt number
    const receiptNumber = `POS-REC-${Date.now()}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    const [updatedFine, paymentRecord] = await prisma.$transaction([
      prisma.fine.update({
        where: { id },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
        },
      }),
      prisma.finePayment.create({
        data: {
          fineId: id,
          amountPaid: amount,
          paymentMethod: paymentMethod || 'CASH',
          receiptNumber,
          processedBy: processedBy || 'STAFF-OFFICER',
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: isFullyPaid
        ? 'Fine fully settled successfully!'
        : 'Partial payment recorded successfully.',
      receipt: {
        receiptNumber: paymentRecord.receiptNumber,
        fineId: fine.id,
        patronName: fine.user.name,
        patronBarcode: fine.user.barcode,
        bookTitle: fine.loan?.copy.book.title || 'N/A',
        totalFineAmount: fine.amount,
        amountPaidThisTransaction: amount,
        totalPaidToDate: newPaidAmount,
        remainingBalance: parseFloat((fine.amount - newPaidAmount).toFixed(2)),
        paymentMethod: paymentRecord.paymentMethod,
        processedBy: paymentRecord.processedBy,
        timestamp: paymentRecord.createdAt,
      },
      fine: updatedFine,
    });
  } catch (error: any) {
    console.error('Payment processing error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process payment' },
      { status: 500 }
    );
  }
}
