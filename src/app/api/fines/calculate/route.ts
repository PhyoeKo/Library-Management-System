import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const now = new Date();

    // Fetch overdue loans
    const overdueLoans = await prisma.loan.findMany({
      where: {
        status: { in: ['ISSUED', 'OVERDUE'] },
        dueDate: { lt: now },
      },
      include: {
        user: {
          include: { category: true },
        },
        fines: true,
      },
    });

    let newFinesCreated = 0;
    let existingFinesUpdated = 0;
    const processedFines: any[] = [];

    for (const loan of overdueLoans) {
      const category = loan.user.category;
      // Default to 500 MMK / day if fineRatePerDay < 10 (migration adjustment to MMK)
      let fineRatePerDay = category?.fineRatePerDay ?? 500;
      if (fineRatePerDay < 10) fineRatePerDay = 500;

      const gracePeriodDays = category?.gracePeriodDays ?? 1;

      // Calculate days overdue
      const diffMs = now.getTime() - new Date(loan.dueDate).getTime();
      const overdueDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const chargeableDays = Math.max(0, overdueDays - gracePeriodDays);
      const calculatedAmount = Math.round(chargeableDays * fineRatePerDay);

      if (calculatedAmount <= 0) continue;

      // Update loan status to OVERDUE if not set
      if (loan.status !== 'OVERDUE') {
        await prisma.loan.update({
          where: { id: loan.id },
          data: { status: 'OVERDUE' },
        });
      }

      const existingFine = loan.fines.find(
        (f) => f.status === 'UNPAID' || f.status === 'PARTIALLY_PAID'
      );

      if (existingFine) {
        if (calculatedAmount > existingFine.amount) {
          const updated = await prisma.fine.update({
            where: { id: existingFine.id },
            data: { amount: calculatedAmount },
          });
          existingFinesUpdated++;
          processedFines.push(updated);
        }
      } else {
        const created = await prisma.fine.create({
          data: {
            userId: loan.userId,
            loanId: loan.id,
            amount: calculatedAmount,
            paidAmount: 0,
            reason: 'OVERDUE',
            status: 'UNPAID',
          },
        });
        newFinesCreated++;
        processedFines.push(created);
      }
    }

    return NextResponse.json({
      success: true,
      overdueLoansProcessed: overdueLoans.length,
      newFinesCreated,
      existingFinesUpdated,
      fines: processedFines,
    });
  } catch (error: any) {
    console.error('Fine calculation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Fine calculation engine failed' },
      { status: 500 }
    );
  }
}
