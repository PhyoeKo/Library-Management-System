import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/circulation — Desk stats and recent circulation activity
export async function GET() {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const now = new Date();

    const [
      activeLoansCount,
      overdueLoansCount,
      todayCheckoutsCount,
      todayCheckinsCount,
      pendingHoldsCount,
      recentLoans,
      recentBooks,
    ] = await Promise.all([
      prisma.loan.count({
        where: { status: { in: ['ISSUED', 'OVERDUE'] } },
      }),
      prisma.loan.count({
        where: {
          OR: [
            { status: 'OVERDUE' },
            { status: 'ISSUED', dueDate: { lt: now } },
          ],
        },
      }),
      prisma.loan.count({
        where: { issuedDate: { gte: todayStart } },
      }),
      prisma.loan.count({
        where: { returnedDate: { gte: todayStart } },
      }),
      prisma.hold.count({
        where: { status: 'PENDING' },
      }),
      prisma.loan.findMany({
        take: 8,
        orderBy: { issuedDate: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, barcode: true, email: true },
          },
          copy: {
            include: {
              book: {
                select: { id: true, title: true, author: true, isbn: true, coverUrl: true },
              },
            },
          },
        },
      }),
      prisma.book.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          copies: { select: { barcode: true, status: true } },
        },
      }),
    ]);

    // Quick suggestions for fast scanning / demo
    const sampleItems = recentBooks.map((b) => {
      const availableCopy = b.copies.find((c) => c.status === 'AVAILABLE') || b.copies[0];
      return {
        title: b.title,
        isbn: b.isbn,
        copyBarcode: availableCopy?.barcode || 'BC-1001',
      };
    });

    return NextResponse.json({
      success: true,
      stats: {
        activeLoansCount,
        overdueLoansCount,
        todayCheckoutsCount,
        todayCheckinsCount,
        pendingHoldsCount,
      },
      recentLoans: recentLoans.map((l) => ({
        id: l.id,
        status: l.status,
        issuedDate: l.issuedDate,
        dueDate: l.dueDate,
        returnedDate: l.returnedDate,
        borrowerName: l.user.name,
        borrowerBarcode: l.user.barcode,
        bookTitle: l.copy.book.title,
        bookAuthor: l.copy.book.author,
        bookIsbn: l.copy.book.isbn,
        bookCoverUrl: l.copy.book.coverUrl,
        copyBarcode: l.copy.barcode,
      })),
      sampleItems,
    });
  } catch (error: any) {
    console.error('Error fetching circulation stats:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch circulation metrics' },
      { status: 500 }
    );
  }
}
