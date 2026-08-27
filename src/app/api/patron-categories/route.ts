import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/patron-categories - List all patron borrower categories with circulation rules
export async function GET() {
  try {
    const categories = await prisma.patronCategory.findMany({
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: { code: 'asc' },
    });

    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch patron categories' },
      { status: 500 }
    );
  }
}
