import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/patron/me - Koha OPAC "Your Account" data aggregation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let userId = searchParams.get('userId');
    const email = searchParams.get('email');

    if (!userId && email) {
      const u = await prisma.user.findUnique({ where: { email } });
      if (u) userId = u.id;
    }

    if (!userId) {
      const defaultUser = await prisma.user.findFirst({
        where: { role: 'PATRON' },
        orderBy: { createdAt: 'asc' },
      });
      if (defaultUser) userId = defaultUser.id;
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Patron user not found' }, { status: 404 });
    }

    const patron = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        category: true,
        loans: {
          include: {
            copy: {
              include: { book: true },
            },
            fines: true,
          },
          orderBy: { issuedDate: 'desc' },
        },
        holds: {
          include: {
            book: {
              include: {
                copies: true,
              },
            },
          },
          orderBy: { requestDate: 'desc' },
        },
        fines: {
          include: {
            loan: {
              include: {
                copy: {
                  include: { book: true },
                },
              },
            },
            payments: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        savedLists: true,
        readingHistory: {
          orderBy: { readDate: 'desc' },
        },
      },
    });

    if (!patron) {
      return NextResponse.json({ success: false, error: 'Patron not found' }, { status: 404 });
    }

    const now = new Date();

    // 1. Current Checkouts (ISSUED & OVERDUE)
    const activeLoans = patron.loans.filter((l) => l.status === 'ISSUED' || l.status === 'OVERDUE');
    const checkouts = activeLoans.map((l) => {
      const dueDate = new Date(l.dueDate);
      const isOverdue = now > dueDate;
      const diffMs = dueDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const daysOverdue = isOverdue ? Math.abs(daysRemaining) : 0;

      // Calculate accrued fine using book's daily fine rate
      const bookRate = l.copy?.book?.dailyFineRate;
      let fineRate = bookRate ?? patron.category?.fineRatePerDay ?? 500;
      if (fineRate < 10) fineRate = 500;
      const graceDays = patron.category?.gracePeriodDays || 0;
      const fineAccrued = isOverdue && daysOverdue > graceDays ? (daysOverdue - graceDays) * fineRate : 0;

      return {
        id: l.id,
        bookTitle: l.copy.book.title,
        author: l.copy.book.author,
        coverUrl: l.copy.book.coverUrl,
        isbn: l.copy.book.isbn,
        copyBarcode: l.copy.barcode,
        callNumber: l.copy.callNumber,
        issuedDate: l.issuedDate,
        dueDate: l.dueDate,
        renewalCount: l.renewCount,
        isOverdue,
        daysRemaining: isOverdue ? 0 : daysRemaining,
        daysOverdue,
        fineAccrued,
        canRenew: !isOverdue && l.renewCount < 3 && !patron.isBlocked,
      };
    });

    // 2. Holds & Reservations with queue rank calculation
    const allPendingHolds = await prisma.hold.findMany({
      where: { status: 'PENDING' },
      select: { id: true, bookId: true, requestDate: true },
      orderBy: { requestDate: 'asc' },
    });

    const holds = patron.holds.map((h) => {
      const sameBookPending = allPendingHolds.filter((ph) => ph.bookId === h.bookId);
      const queueRank = sameBookPending.findIndex((ph) => ph.id === h.id) + 1;
      const availableCopies = h.book.copies.filter((c) => c.status === 'AVAILABLE').length;

      return {
        id: h.id,
        bookId: h.bookId,
        bookTitle: h.book.title,
        author: h.book.author,
        coverUrl: h.book.coverUrl,
        isbn: h.book.isbn,
        requestDate: h.requestDate,
        status: h.status,
        queueRank: queueRank > 0 ? queueRank : 1,
        totalQueue: sameBookPending.length,
        availableCopies,
      };
    });

    // 3. Fines & Financial Statement
    const unpaidFines = patron.fines.filter((f) => f.status === 'UNPAID' || f.status === 'PARTIALLY_PAID');
    const totalOutstandingFine = unpaidFines.reduce((sum, f) => sum + (f.amount - f.paidAmount), 0);
    const fineStatement = patron.fines.map((f) => ({
      id: f.id,
      reason: f.reason,
      amount: f.amount,
      paidAmount: f.paidAmount,
      balance: f.amount - f.paidAmount,
      status: f.status,
      bookTitle: f.loan?.copy?.book?.title || 'Overdue item',
      createdAt: f.createdAt,
    }));

    // 4. Reading & Borrowing History (Returned loans)
    const returnedLoans = patron.loans
      .filter((l) => l.status === 'RETURNED')
      .map((l) => ({
        id: l.id,
        bookTitle: l.copy.book.title,
        author: l.copy.book.author,
        coverUrl: l.copy.book.coverUrl,
        copyBarcode: l.copy.barcode,
        issuedDate: l.issuedDate,
        returnedDate: l.returnedDate,
      }));

    // 5. Virtual Shelves / Saved Lists
    const savedLists = patron.savedLists.map((sl) => {
      let bookCount = 0;
      try {
        const parsed = JSON.parse(sl.bookIds || '[]');
        bookCount = Array.isArray(parsed) ? parsed.length : 0;
      } catch {}
      return {
        id: sl.id,
        name: sl.name,
        description: sl.description,
        bookCount,
      };
    });

    return NextResponse.json({
      success: true,
      patron: {
        id: patron.id,
        name: patron.name,
        email: patron.email,
        barcode: patron.barcode,
        nrcNumber: patron.nrcNumber,
        phone: patron.phone,
        address: patron.address,
        isBlocked: patron.isBlocked,
        blockReason: patron.blockReason,
        category: patron.category || {
          name: 'Undergraduate Student',
          code: 'STUDENT',
          maxLoanCount: 5,
          loanPeriodDays: 14,
          fineRatePerDay: 500,
        },
      },
      summary: {
        currentCheckoutsCount: checkouts.length,
        overdueCount: checkouts.filter((c) => c.isOverdue).length,
        activeHoldsCount: holds.filter((h) => h.status === 'PENDING' || h.status === 'APPROVED').length,
        totalOutstandingFine,
        totalHistoryCount: returnedLoans.length + patron.readingHistory.length,
      },
      checkouts,
      holds,
      fineStatement,
      history: returnedLoans,
      readingLogs: patron.readingHistory,
      savedLists,
    });
  } catch (error: any) {
    console.error('Error fetching patron profile:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch patron profile' },
      { status: 500 }
    );
  }
}
