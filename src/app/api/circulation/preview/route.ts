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

      // 2. Fetch Copy with Active Loan & Holds Priority Queue (Lookup by Copy Barcode OR Book ISBN)
      const inputTrimmed = copyBarcode.trim();
      let copy = await prisma.bookCopy.findUnique({
        where: { barcode: inputTrimmed },
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
        // Try looking up by Book ISBN
        const bookByIsbn = await prisma.book.findUnique({
          where: { isbn: inputTrimmed },
          include: {
            copies: {
              include: {
                loans: {
                  where: { status: { in: ['ISSUED', 'OVERDUE'] } },
                  include: { user: true },
                },
              },
            },
            holds: {
              where: { status: 'PENDING' },
              include: { user: true },
              orderBy: { requestDate: 'asc' },
            },
          },
        });

        if (bookByIsbn) {
          if (!bookByIsbn.copies || bookByIsbn.copies.length === 0) {
            return NextResponse.json(
              {
                success: false,
                error: `Book "${bookByIsbn.title}" (ISBN: ${bookByIsbn.isbn}) has no physical copies in inventory.`,
              },
              { status: 400 }
            );
          }

          // Pick an available copy first; if none available, pick the first copy to show rental/queue status
          const availableCopy = bookByIsbn.copies.find((c) => c.status === 'AVAILABLE');
          const chosen = availableCopy || bookByIsbn.copies[0];

          copy = {
            ...chosen,
            book: bookByIsbn,
            loans: chosen.loans || [],
          } as any;
        }
      }

      if (!copy) {
        return NextResponse.json(
          { success: false, error: `Book copy with barcode or ISBN "${copyBarcode}" not found.` },
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

      const inputTrimmed = copyBarcode.trim();
      let copy = await prisma.bookCopy.findUnique({
        where: { barcode: inputTrimmed },
        include: { book: true },
      });

      if (!copy) {
        // Try finding by Book ISBN
        const bookByIsbn = await prisma.book.findUnique({
          where: { isbn: inputTrimmed },
          include: { copies: true },
        });

        if (bookByIsbn && bookByIsbn.copies.length > 0) {
          // Find which copy of this book is currently on loan
          const activeLoan = await prisma.loan.findFirst({
            where: {
              copyId: { in: bookByIsbn.copies.map((c) => c.id) },
              status: { in: ['ISSUED', 'OVERDUE'] },
            },
            include: { copy: { include: { book: true } } },
          });

          if (activeLoan) {
            copy = activeLoan.copy;
          } else {
            copy = {
              ...bookByIsbn.copies[0],
              book: bookByIsbn,
            } as any;
          }
        }
      }

      if (!copy) {
        return NextResponse.json(
          { success: false, error: `Book copy with barcode or ISBN "${copyBarcode}" not found.` },
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
        const rate = copy.book.dailyFineRate ?? activeLoan.user.category?.fineRatePerDay ?? 500;
        const effectiveRate = rate < 10 ? 500 : rate;
        finePreview = Math.round(chargeableDays * effectiveRate);
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
            dailyFineRate: copy.book.dailyFineRate ?? 500,
          },
          loan: {
            issuedDate: activeLoan.issuedDate,
            dueDate: activeLoan.dueDate,
          },
          overdueDays,
          finePreview,
          dailyFineRate: copy.book.dailyFineRate ?? 500,
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
