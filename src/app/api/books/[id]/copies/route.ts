import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { barcode, callNumber, location, condition, price } = body;

    if (!barcode || !callNumber || !location) {
      return NextResponse.json(
        { success: false, error: 'Barcode, Call Number, and Location are required.' },
        { status: 400 }
      );
    }

    const existingCopy = await prisma.bookCopy.findUnique({
      where: { barcode },
    });

    if (existingCopy) {
      return NextResponse.json(
        { success: false, error: `Copy with barcode ${barcode} already exists.` },
        { status: 409 }
      );
    }

    const copy = await prisma.bookCopy.create({
      data: {
        bookId: id,
        barcode,
        callNumber,
        location,
        condition: condition || 'GOOD',
        price: price ? parseFloat(price) : null,
        status: 'AVAILABLE',
      },
    });

    return NextResponse.json({ success: true, copy }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create physical copy' },
      { status: 500 }
    );
  }
}
