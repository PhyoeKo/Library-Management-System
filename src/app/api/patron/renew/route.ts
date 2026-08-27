import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/patron/renew - Self-service loan renewal in Koha OPAC
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { loanId, userId } = body;

    if (!loanId) {
      return NextResponse.json({ success: false, error: 'Loan ID is required' }, { status: 400 });
    }

    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        user: { include: { category: true } },
      },
    });

    if (!loan) {
      return NextResponse.json({ success: false, error: 'Loan record not found' }, { status: 404 });
    }

    if (loan.status === 'RETURNED') {
      return NextResponse.json({ success: false, error: 'Cannot renew an already returned loan' }, { status: 400 });
    }

    if (loan.user.isBlocked) {
      return NextResponse.json({ success: false, error: 'Borrower account is suspended. Please contact the circulation desk.' }, { status: 403 });
    }

    // Check renewal limits (standard Koha rule max 3 renewals)
    if (loan.renewCount >= 3) {
      return NextResponse.json({ success: false, error: 'Maximum loan renewal limit (3 times) reached for this item.' }, { status: 400 });
    }

    // Extend due date by patron category loan period (default 14 days)
    const loanPeriodDays = loan.user.category?.loanPeriodDays || 14;
    const currentDue = new Date(loan.dueDate);
    const baseDate = currentDue > new Date() ? currentDue : new Date();
    const newDueDate = new Date(baseDate);
    newDueDate.setDate(newDueDate.getDate() + loanPeriodDays);

    const updatedLoan = await prisma.loan.update({
      where: { id: loanId },
      data: {
        dueDate: newDueDate,
        renewCount: loan.renewCount + 1,
        status: 'ISSUED',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Loan renewed successfully until ${newDueDate.toLocaleDateString('en-GB')}`,
      loan: updatedLoan,
    });
  } catch (error: any) {
    console.error('Renewal error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Renewal failed' }, { status: 500 });
  }
}
