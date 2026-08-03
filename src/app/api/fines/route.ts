import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');

    const where: any = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;

    const fines = await prisma.fine.findMany({
      where,
      include: {
        user: {
          include: { category: true },
        },
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
    });

    const totalOutstanding = fines
      .filter((f) => f.status === 'UNPAID' || f.status === 'PARTIALLY_PAID')
      .reduce((sum, f) => sum + (f.amount - f.paidAmount), 0);

    return NextResponse.json({
      success: true,
      count: fines.length,
      totalOutstanding: parseFloat(totalOutstanding.toFixed(2)),
      fines,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch fines' },
      { status: 500 }
    );
  }
}
