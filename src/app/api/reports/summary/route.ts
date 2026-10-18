import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/reports/summary
// Returns all KPI aggregates, period-filtered metrics, chart points, and detailed tables
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const preset = searchParams.get('preset') || '14d';
    const customStart = searchParams.get('startDate');
    const customEnd = searchParams.get('endDate');

    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date();
    endDate.setHours(23, 59, 59, 999);

    if (preset === 'custom' && customStart && customEnd) {
      startDate = new Date(customStart + 'T00:00:00.000Z');
      endDate = new Date(customEnd + 'T23:59:59.999Z');
    } else if (preset === 'today') {
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
    } else if (preset === '7d') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
    } else if (preset === '14d') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 13);
      startDate.setHours(0, 0, 0, 0);
    } else if (preset === '30d') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
    } else if (preset === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
    } else if (preset === '90d') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 89);
      startDate.setHours(0, 0, 0, 0);
    } else if (preset === 'all') {
      startDate = new Date('2020-01-01T00:00:00.000Z');
    } else {
      // Default to 14 days
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 13);
      startDate.setHours(0, 0, 0, 0);
    }

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // ── 1. CATALOG KPIs ────────────────────────────────────────────────────
    const [totalBooks, totalCopies, totalEResources, copiesByStatus] = await Promise.all([
      prisma.book.count(),
      prisma.bookCopy.count(),
      prisma.eResource.count(),
      prisma.bookCopy.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);

    const availableCopies = copiesByStatus.find((s) => s.status === 'AVAILABLE')?._count._all ?? 0;
    const onLoanCopies = copiesByStatus.find((s) => s.status === 'ON_LOAN')?._count._all ?? 0;
    const maintenanceCopies = copiesByStatus.find((s) => s.status === 'MAINTENANCE')?._count._all ?? 0;
    const lostCopies = copiesByStatus.find((s) => s.status === 'LOST')?._count._all ?? 0;

    // ── 2. PATRON KPIs ─────────────────────────────────────────────────────
    const [totalPatrons, blockedPatrons, vipPatrons] = await Promise.all([
      prisma.user.count({ where: { role: 'PATRON' } }),
      prisma.user.count({ where: { role: 'PATRON', isBlocked: true } }),
      prisma.user.count({ where: { role: 'PATRON', isVip: true } }),
    ]);

    // ── 3. CIRCULATION KPIs (All-Time + Recent) ─────────────────────────────
    const [
      totalLoans,
      activeLoans,
      overdueLoans,
      returnedLoans,
      loansLast30Days,
      loansLast7Days,
    ] = await Promise.all([
      prisma.loan.count(),
      prisma.loan.count({ where: { status: 'ISSUED' } }),
      prisma.loan.count({ where: { status: 'OVERDUE' } }),
      prisma.loan.count({ where: { status: 'RETURNED' } }),
      prisma.loan.count({ where: { issuedDate: { gte: thirtyDaysAgo } } }),
      prisma.loan.count({ where: { issuedDate: { gte: sevenDaysAgo } } }),
    ]);

    // ── 4. PERIOD-FILTERED CIRCULATION & FINES ─────────────────────────────
    const periodLoans = await prisma.loan.findMany({
      where: {
        issuedDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            barcode: true,
            email: true,
            phone: true,
            isVip: true,
            role: true,
          },
        },
        copy: {
          include: {
            book: {
              select: {
                id: true,
                title: true,
                author: true,
                isbn: true,
                genre: true,
              },
            },
          },
        },
      },
      orderBy: { issuedDate: 'desc' },
      take: 200,
    });

    const periodLoanCount = await prisma.loan.count({
      where: { issuedDate: { gte: startDate, lte: endDate } },
    });
    const periodReturnedLoans = await prisma.loan.count({
      where: { returnedDate: { gte: startDate, lte: endDate } },
    });
    const periodActiveLoans = await prisma.loan.count({
      where: { issuedDate: { gte: startDate, lte: endDate }, status: 'ISSUED' },
    });
    const periodOverdueLoans = await prisma.loan.count({
      where: { issuedDate: { gte: startDate, lte: endDate }, status: 'OVERDUE' },
    });

    // Period Fines
    const periodFines = await prisma.fine.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            barcode: true,
            phone: true,
            isVip: true,
          },
        },
        loan: {
          include: {
            copy: {
              include: {
                book: {
                  select: { title: true },
                },
              },
            },
          },
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const periodFineAmount = periodFines.reduce((s, f) => s + f.amount, 0);
    const periodCollected = periodFines.reduce((s, f) => s + f.paidAmount, 0);
    const periodOutstanding = periodFineAmount - periodCollected;

    // ── 5. ALL FINES & AGGREGATES ──────────────────────────────────────────
    const allFines = await prisma.fine.findMany({
      include: { payments: true },
    });

    const totalFineAmount = allFines.reduce((s, f) => s + f.amount, 0);
    const totalCollected = allFines.reduce((s, f) => s + f.paidAmount, 0);
    const totalOutstanding = totalFineAmount - totalCollected;
    const unpaidFines = allFines.filter((f) => f.status === 'UNPAID').length;
    const paidFines = allFines.filter((f) => f.status === 'PAID').length;
    const waivedFines = allFines.filter((f) => f.status === 'WAIVED').length;

    // Fines by reason
    const finesByReason = await prisma.fine.groupBy({
      by: ['reason'],
      _count: { _all: true },
      _sum: { amount: true },
    });

    // ── 6. HOLDS KPIs ──────────────────────────────────────────────────────
    const [totalHolds, pendingHolds, fulfilledHolds] = await Promise.all([
      prisma.hold.count(),
      prisma.hold.count({ where: { status: 'PENDING' } }),
      prisma.hold.count({ where: { status: 'FULFILLED' } }),
    ]);

    // ── 7. TOP 5 MOST BORROWED BOOKS ───────────────────────────────────────
    const topBooksRaw = await prisma.loan.groupBy({
      by: ['copyId'],
      _count: { _all: true },
      orderBy: { _count: { copyId: 'desc' } },
      take: 15,
    });

    const copyIds = topBooksRaw.map((r) => r.copyId);
    const copies = await prisma.bookCopy.findMany({
      where: { id: { in: copyIds } },
      include: { book: true },
    });

    const bookLoanMap: Record<string, { title: string; author: string; loanCount: number; genre: string }> = {};
    for (const row of topBooksRaw) {
      const copy = copies.find((c) => c.id === row.copyId);
      if (!copy) continue;
      const key = copy.bookId;
      if (!bookLoanMap[key]) {
        bookLoanMap[key] = {
          title: copy.book.title,
          author: copy.book.author,
          loanCount: 0,
          genre: copy.book.genre || 'General',
        };
      }
      bookLoanMap[key].loanCount += row._count._all;
    }

    const topBooks = Object.values(bookLoanMap)
      .sort((a, b) => b.loanCount - a.loanCount)
      .slice(0, 5);

    // ── 8. LOANS BY DAY (Dynamic based on selected period) ─────────────────
    const diffDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const loansByDay: Record<string, number> = {};

    if (diffDays <= 35) {
      // Build contiguous daily buckets
      const cursor = new Date(startDate);
      while (cursor <= endDate) {
        loansByDay[cursor.toISOString().slice(0, 10)] = 0;
        cursor.setDate(cursor.getDate() + 1);
      }
    } else {
      // Sample recent 14-30 days if range is huge (e.g. All Time)
      const sampleDays = 14;
      const cursor = new Date(now);
      cursor.setDate(cursor.getDate() - (sampleDays - 1));
      for (let i = 0; i < sampleDays; i++) {
        const d = new Date(cursor);
        d.setDate(d.getDate() + i);
        loansByDay[d.toISOString().slice(0, 10)] = 0;
      }
    }

    for (const loan of periodLoans) {
      const key = loan.issuedDate.toISOString().slice(0, 10);
      if (key in loansByDay) {
        loansByDay[key]++;
      }
    }

    const loanTrend = Object.entries(loansByDay).map(([date, count]) => ({ date, count }));

    // ── 9. GENRE DISTRIBUTION ──────────────────────────────────────────────
    const genreGroups = await prisma.book.groupBy({
      by: ['genre'],
      _count: { _all: true },
      orderBy: { _count: { genre: 'desc' } },
    });

    const genreDistribution = genreGroups
      .filter((g) => g.genre)
      .map((g) => ({ genre: g.genre!, count: g._count._all }));

    // ── 10. OVERDUE ITEMS (Actionable list) ─────────────────────────────────
    const overdueDetail = await prisma.loan.findMany({
      where: { status: 'OVERDUE' },
      include: {
        user: true,
        copy: { include: { book: true } },
        fines: true,
      },
      orderBy: { dueDate: 'asc' },
      take: 20,
    });

    const overdueItems = overdueDetail.map((l) => {
      const daysOverdue = Math.max(
        1,
        Math.ceil((now.getTime() - new Date(l.dueDate).getTime()) / (1000 * 60 * 60 * 24))
      );
      const pendingFine = l.fines
        .filter((f) => f.status === 'UNPAID' || f.status === 'PARTIALLY_PAID')
        .reduce((s, f) => s + (f.amount - f.paidAmount), 0);
      return {
        id: l.id,
        patronName: l.user.name,
        patronBarcode: l.user.barcode,
        patronPhone: l.user.phone || '—',
        patronIsVip: l.user.isVip,
        bookTitle: l.copy.book.title,
        copyBarcode: l.copy.barcode,
        dueDate: l.dueDate.toISOString(),
        daysOverdue,
        pendingFine,
      };
    });

    // ── 11. DETAILED DATA FOR TABLES & CSV EXPORT ───────────────────────────
    const detailedLoans = periodLoans.map((l) => ({
      id: l.id,
      bookTitle: l.copy.book.title,
      author: l.copy.book.author,
      isbn: l.copy.book.isbn,
      copyBarcode: l.copy.barcode,
      patronName: l.user.name,
      patronBarcode: l.user.barcode,
      patronEmail: l.user.email,
      patronPhone: l.user.phone || '',
      isVip: l.user.isVip,
      issuedDate: l.issuedDate.toISOString(),
      dueDate: l.dueDate.toISOString(),
      returnedDate: l.returnedDate ? l.returnedDate.toISOString() : null,
      status: l.status,
      renewCount: l.renewCount,
    }));

    const detailedFines = periodFines.map((f) => ({
      id: f.id,
      patronName: f.user.name,
      patronBarcode: f.user.barcode,
      patronPhone: f.user.phone || '',
      isVip: f.user.isVip,
      bookTitle: f.loan?.copy.book.title || 'General Fine',
      amount: f.amount,
      paidAmount: f.paidAmount,
      balance: f.amount - f.paidAmount,
      reason: f.reason,
      status: f.status,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
    }));

    // Top 30 Books for Inventory CSV
    const inventoryBooks = await prisma.book.findMany({
      include: {
        copies: true,
      },
      take: 100,
      orderBy: { createdAt: 'desc' },
    });

    const detailedBooks = inventoryBooks.map((b) => {
      const copiesCount = b.copies.length;
      const avail = b.copies.filter((c) => c.status === 'AVAILABLE').length;
      const onLoan = b.copies.filter((c) => c.status === 'ON_LOAN').length;
      return {
        id: b.id,
        isbn: b.isbn,
        title: b.title,
        author: b.author,
        genre: b.genre || 'General',
        publisher: b.publisher || '',
        totalCopies: copiesCount,
        availableCopies: avail,
        onLoanCopies: onLoan,
        maxRentDays: b.maxRentDays,
        dailyFineRate: b.dailyFineRate || 500,
      };
    });

    // Patrons summary for Patron CSV
    const patronsList = await prisma.user.findMany({
      where: { role: 'PATRON' },
      include: {
        loans: { select: { id: true, status: true } },
        fines: { select: { amount: true, paidAmount: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const detailedPatrons = patronsList.map((p) => {
      const activeLoanCount = p.loans.filter((l) => l.status === 'ISSUED').length;
      const overdueLoanCount = p.loans.filter((l) => l.status === 'OVERDUE').length;
      const outstandingFine = p.fines
        .filter((f) => f.status === 'UNPAID' || f.status === 'PARTIALLY_PAID')
        .reduce((sum, f) => sum + (f.amount - f.paidAmount), 0);

      return {
        id: p.id,
        name: p.name,
        email: p.email,
        barcode: p.barcode,
        phone: p.phone || '',
        isVip: p.isVip,
        isBlocked: p.isBlocked,
        totalLoans: p.loans.length,
        activeLoans: activeLoanCount,
        overdueLoans: overdueLoanCount,
        outstandingFine,
        createdAt: p.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      generatedAt: now.toISOString(),
      filter: {
        preset,
        startDate: startDate.toISOString().slice(0, 10),
        endDate: endDate.toISOString().slice(0, 10),
        diffDays,
      },
      catalog: {
        totalBooks,
        totalCopies,
        totalEResources,
        availableCopies,
        onLoanCopies,
        maintenanceCopies,
        lostCopies,
        utilizationRate:
          totalCopies > 0 ? Math.round((onLoanCopies / totalCopies) * 100) : 0,
      },
      patrons: {
        totalPatrons,
        blockedPatrons,
        activePatrons: totalPatrons - blockedPatrons,
        vipPatrons,
      },
      circulation: {
        totalLoans,
        activeLoans,
        overdueLoans,
        returnedLoans,
        loansLast30Days,
        loansLast7Days,
        periodLoanCount,
        periodActiveLoans,
        periodOverdueLoans,
        periodReturnedLoans,
        returnRate:
          totalLoans > 0 ? Math.round((returnedLoans / totalLoans) * 100) : 0,
        overdueRate:
          totalLoans > 0 ? Math.round((overdueLoans / totalLoans) * 100) : 0,
      },
      fines: {
        totalFineAmount: Math.round(totalFineAmount),
        totalCollected: Math.round(totalCollected),
        totalOutstanding: Math.round(totalOutstanding),
        periodFineAmount: Math.round(periodFineAmount),
        periodCollected: Math.round(periodCollected),
        periodOutstanding: Math.round(periodOutstanding),
        collectionRate:
          totalFineAmount > 0
            ? Math.round((totalCollected / totalFineAmount) * 100)
            : 0,
        unpaidFines,
        paidFines,
        waivedFines,
        finesByReason: finesByReason.map((r) => ({
          reason: r.reason,
          count: r._count._all,
          total: Math.round(r._sum.amount ?? 0),
        })),
      },
      holds: {
        totalHolds,
        pendingHolds,
        fulfilledHolds,
      },
      charts: {
        loanTrend,
        topBooks,
        genreDistribution,
      },
      overdueItems,
      detailedLoans,
      detailedFines,
      detailedBooks,
      detailedPatrons,
    });
  } catch (error: any) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate report' },
      { status: 500 }
    );
  }
}
