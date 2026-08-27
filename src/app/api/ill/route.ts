import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/ill - List interlibrary loan requests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('q');

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { bookTitle: { contains: search } },
        { author: { contains: search } },
        { partnerLibrary: { contains: search } },
        { user: { name: { contains: search } } },
        { user: { barcode: { contains: search } } },
      ];
    }

    const requests = await prisma.iLLRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            barcode: true,
            phone: true,
          },
        },
      },
      orderBy: { id: 'desc' },
    });

    return NextResponse.json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/ill - Create ILL request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, partnerLibrary, bookTitle, author, status = 'PENDING' } = body;

    if (!userId || !partnerLibrary || !bookTitle || !author) {
      return NextResponse.json(
        { success: false, error: 'Patron, Partner Library, Book Title, and Author are required fields' },
        { status: 400 }
      );
    }

    const ill = await prisma.iLLRequest.create({
      data: {
        userId,
        partnerLibrary: partnerLibrary.trim(),
        bookTitle: bookTitle.trim(),
        author: author.trim(),
        status,
      },
      include: { user: true },
    });

    return NextResponse.json({ success: true, request: ill }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
