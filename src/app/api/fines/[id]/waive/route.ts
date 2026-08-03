import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const fine = await prisma.fine.findUnique({
      where: { id },
    });

    if (!fine) {
      return NextResponse.json(
        { success: false, error: 'Fine record not found' },
        { status: 404 }
      );
    }

    const updatedFine = await prisma.fine.update({
      where: { id },
      data: {
        status: 'WAIVED',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Fine waived successfully.',
      fine: updatedFine,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to waive fine' },
      { status: 500 }
    );
  }
}
