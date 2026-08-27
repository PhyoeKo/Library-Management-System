import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/reports/summary
// Returns all KPI aggregates needed for the analytics dashboard in a single request
export async function GET() {
  try {
    const now = new Date();
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
    const [totalPatrons, patronsByRole, patronsByCategory, blockedPatrons] = await Promise.all([
      prisma.user.count({ where: { role: 'PATRON' } }),
      prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
      prisma.user.groupBy({ by: ['categoryId'], _count: { _all: true } }),
      prisma.user.count({ where: { role: 'PATRON', isBlocked: true } }),
    ]);

    // ── 3. CIRCULATION KPIs ────────────────────────────────────────────────
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

    // ── 4. FINES KPIs ──────────────────────────────────────────────────────
    const allFines = await prisma.fine.findMany({
      include: { payments: true },
    });

    const totalFineAmount = allFines.reduce((s, f) => s + f.amount, 0);
    const totalCollected = allFines.reduce((s, f) => s + f.paidAmount, 0);
    const totalOutstanding = totalFineAmount - totalCollected;
    const unpaidFines = allFines.filter((f) => f.status === 'UNPAID').length;
    const paidFines = allFines.filter((f) => f.status === 'PAID').length;
    const waivedFines = allFines.filter((f) => f.status === 'WAIVED').length;

    // ── 5. HOLDS KPIs ──────────────────────────────────────────────────────
    const [totalHolds, pendingHolds, fulfilledHolds] = await Promise.all([
      prisma.hold.count(),
      prisma.hold.count({ where: { status: 'PENDING' } }),
      prisma.hold.count({ where: { status: 'FULFILLED' } }),
    ]);

    // ── 6. TOP 5 MOST BORROWED BOOKS ───────────────────────────────────────
    const topBooksRaw = await prisma.loan.groupBy({
      by: ['copyId'],
      _count: { _all: true },
      orderBy: { _count: { copyId: 'desc' } },
      take: 10,
    });

    const copyIds = topBooksRaw.map((r) => r.copyId);
    const copies = await prisma.bookCopy.findMany({
      where: { id: { in: copyIds } },
      include: { book: true },
    });

    // Merge and deduplicate by book title, sum loan counts
    const bookLoanMap: Record<string, { title: string; author: string; loanCount: number }> = {};
    for (const row of topBooksRaw) {
      const copy = copies.find((c) => c.id === row.copyId);
      if (!copy) continue;
      const key = copy.bookId;
      if (!bookLoanMap[key]) {
        bookLoanMap[key] = {
          title: copy.book.title,
          author: copy.book.author,
          loanCount: 0,
        };
      }
      bookLoanMap[key].loanCount += row._count._all;
    }

    const topBooks = Object.values(bookLoanMap)
      .sort((a, b) => b.loanCount - a.loanCount)
      .slice(0, 5);

    // ── 7. LOANS BY DAY (last 14 days for sparkline) ───────────────────────
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);

    const recentLoans = await prisma.loan.findMany({
      where: { issuedDate: { gte: fourteenDaysAgo } },
      select: { issuedDate: true },
    });

    const loansByDay: Record<string, number> = {};
    for (let i = 0; i < 14; i++) {
      const d = new Date(fourteenDaysAgo);
      d.setDate(d.getDate() + i);
      loansByDay[d.toISOString().slice(0, 10)] = 0;
    }
    for (const loan of recentLoans) {
      const key = loan.issuedDate.toISOString().slice(0, 10);
      if (key in loansByDay) loansByDay[key]++;
    }

    const loanTrend = Object.entries(loansByDay).map(([date, count]) => ({ date, count }));

    // ── 8. FINES BY REASON ─────────────────────────────────────────────────
    const finesByReason = await prisma.fine.groupBy({
      by: ['reason'],
      _count: { _all: true },
      _sum: { amount: true },
    });

    // ── 9. GENRE DISTRIBUTION ──────────────────────────────────────────────
    const genreGroups = await prisma.book.groupBy({
      by: ['genre'],
      _count: { _all: true },
      orderBy: { _count: { genre: 'desc' } },
    });

    const genreDistribution = genreGroups
      .filter((g) => g.genre)
      .map((g) => ({ genre: g.genre!, count: g._count._all }));

    // ── 10. OVERDUE DETAIL (top 5 most overdue) ───────────────────────────
    const overdueDetail = await prisma.loan.findMany({
      where: { status: 'OVERDUE' },
      include: {
        user: true,
        copy: { include: { book: true } },
        fines: true,
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
    });

    const overdueItems = overdueDetail.map((l) => {
      const daysOverdue = Math.ceil(
        (now.getTime() - new Date(l.dueDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      const pendingFine = l.fines
        .filter((f) => f.status === 'UNPAID' || f.status === 'PARTIALLY_PAID')
        .reduce((s, f) => s + (f.amount - f.paidAmount), 0);
      return {
        patronName: l.user.name,
        patronBarcode: l.user.barcode,
        bookTitle: l.copy.book.title,
        copyBarcode: l.copy.barcode,
        dueDate: l.dueDate,
        daysOverdue,
        pendingFine,
      };
    });

    return NextResponse.json({
      success: true,
      generatedAt: now.toISOString(),
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
      },
      circulation: {
        totalLoans,
        activeLoans,
        overdueLoans,
        returnedLoans,
        loansLast30Days,
        loansLast7Days,
        returnRate:
          totalLoans > 0 ? Math.round((returnedLoans / totalLoans) * 100) : 0,
        overdueRate:
          totalLoans > 0 ? Math.round((overdueLoans / totalLoans) * 100) : 0,
      },
      fines: {
        totalFineAmount: Math.round(totalFineAmount),
        totalCollected: Math.round(totalCollected),
        totalOutstanding: Math.round(totalOutstanding),
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
    });
  } catch (error: any) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate report' },
      { status: 500 }
    );
  }
}
