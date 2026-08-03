import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, patronBarcode, copyBarcode } = body;

    if (action === 'checkout') {
      if (!patronBarcode || !copyBarcode) {
        return NextResponse.json(
          { success: false, error: 'Member barcode and Copy barcode are required.' },
          { status: 400 }
        );
      }

      // 1. Fetch Member
      const patron = await prisma.user.findUnique({
        where: { barcode: patronBarcode.trim() },
        include: {
          category: true,
          loans: { where: { status: 'ISSUED' } },
          fines: { where: { status: 'UNPAID' } },
        },
      });

      if (!patron) {
        return NextResponse.json(
          { success: false, error: `Member with barcode "${patronBarcode}" not found.` },
          { status: 404 }
        );
      }

      if (patron.isBlocked) {
        return NextResponse.json(
          {
            success: false,
            error: `Member account is SUSPENDED (${patron.blockReason || 'Blocked by system'}).`,
          },
          { status: 400 }
        );
      }

      // 2. Fetch Copy with Active Loan & Holds Priority Queue
      const copy = await prisma.bookCopy.findUnique({
        where: { barcode: copyBarcode.trim() },
        include: {
          book: {
            include: {
              holds: {
                where: { status: 'PENDING' },
                include: { user: true },
                orderBy: { requestDate: 'asc' },
              },
            },
          },
          loans: {
            where: { status: { in: ['ISSUED', 'OVERDUE'] } },
            include: { user: true },
          },
        },
      });

      if (!copy) {
        return NextResponse.json(
          { success: false, error: `Book copy with barcode "${copyBarcode}" not found.` },
          { status: 404 }
        );
      }

      // IF Copy is ON_LOAN: Return rich Rental Intelligence & Queue Details
      if (copy.status !== 'AVAILABLE') {
        const activeLoan = copy.loans[0] || null;
        const currentBorrower = activeLoan?.user || null;
        const dueDate = activeLoan?.dueDate || new Date();
        const now = new Date();

        // Calculate days remaining or days overdue
        const diffMs = new Date(dueDate).getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        const daysRemainingStr =
          diffDays > 0
            ? `${diffDays} days remaining`
            : `${Math.abs(diffDays)} days OVERDUE`;

        // Format Holds Priority Queue List
        const priorityQueueList = copy.book.holds.map((h, idx) => ({
          position: idx + 1,
          memberName: h.user.name,
          memberBarcode: h.user.barcode,
          phone: h.user.phone || 'N/A',
          requestDate: h.requestDate,
        }));

        return NextResponse.json(
          {
            success: false,
            error: `Book copy "${copy.barcode}" is currently ON_LOAN.`,
            loanStatusDetails: {
              isRented: true,
              copyBarcode: copy.barcode,
              bookTitle: copy.book.title,
              bookAuthor: copy.book.author,
              borrower: currentBorrower
                ? {
                    name: currentBorrower.name,
                    barcode: currentBorrower.barcode,
                    email: currentBorrower.email,
                    phone: currentBorrower.phone || 'N/A',
                  }
                : null,
              issuedDate: activeLoan?.issuedDate,
              dueDate,
              daysRemainingStr,
              priorityQueueList,
              totalHoldsWaiting: priorityQueueList.length,
            },
          },
          { status: 400 }
        );
      }

      // 3. Calculate Due Date using Book's maxRentDays (Default 7 Days)
      const loanPeriodDays = copy.book.maxRentDays || patron.category?.loanPeriodDays || 7;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + loanPeriodDays);

      return NextResponse.json({
        success: true,
        preview: {
          action: 'checkout',
          patron: {
            id: patron.id,
            name: patron.name,
            email: patron.email,
            barcode: patron.barcode,
            categoryName: patron.category?.name || 'Standard Member',
            activeLoansCount: patron.loans.length,
            maxLoanCount: patron.category?.maxLoanCount || 5,
            unpaidFinesCount: patron.fines.length,
          },
          copy: {
            id: copy.id,
            barcode: copy.barcode,
            callNumber: copy.callNumber,
            location: copy.location,
            status: copy.status,
            bookTitle: copy.book.title,
            author: copy.book.author,
            isbn: copy.book.isbn,
            coverUrl: copy.book.coverUrl,
          },
          dueDate: dueDate.toISOString(),
          loanPeriodDays,
        },
      });
    }

    if (action === 'checkin') {
      if (!copyBarcode) {
        return NextResponse.json(
          { success: false, error: 'Book copy barcode is required.' },
          { status: 400 }
        );
      }

      const copy = await prisma.bookCopy.findUnique({
        where: { barcode: copyBarcode.trim() },
        include: { book: true },
      });

      if (!copy) {
        return NextResponse.json(
          { success: false, error: `Book copy with barcode "${copyBarcode}" not found.` },
          { status: 404 }
        );
      }

      // Find active loan
      const activeLoan = await prisma.loan.findFirst({
        where: {
          copyId: copy.id,
          status: { in: ['ISSUED', 'OVERDUE'] },
        },
        include: {
          user: { include: { category: true } },
        },
      });

      if (!activeLoan) {
        return NextResponse.json(
          { success: false, error: `No active loan record found for item "${copyBarcode}".` },
          { status: 400 }
        );
      }

      // Overdue fine preview calculation
      const now = new Date();
      let overdueDays = 0;
      let finePreview = 0;

      if (now > new Date(activeLoan.dueDate)) {
        const diffMs = now.getTime() - new Date(activeLoan.dueDate).getTime();
        overdueDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        const gracePeriod = activeLoan.user.category?.gracePeriodDays ?? 1;
        const chargeableDays = Math.max(0, overdueDays - gracePeriod);
        const rate = activeLoan.user.category?.fineRatePerDay ?? 500;
        finePreview = Math.round(chargeableDays * (rate < 10 ? 500 : rate));
      }

      return NextResponse.json({
        success: true,
        preview: {
          action: 'checkin',
          patron: {
            name: activeLoan.user.name,
            barcode: activeLoan.user.barcode,
            email: activeLoan.user.email,
          },
          copy: {
            barcode: copy.barcode,
            bookTitle: copy.book.title,
            author: copy.book.author,
            callNumber: copy.callNumber,
            location: copy.location,
          },
          loan: {
            issuedDate: activeLoan.issuedDate,
            dueDate: activeLoan.dueDate,
          },
          overdueDays,
          finePreview,
        },
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action.' }, { status: 400 });
  } catch (error: any) {
    console.error('Circulation preview error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate preview' },
      { status: 500 }
    );
  }
}
