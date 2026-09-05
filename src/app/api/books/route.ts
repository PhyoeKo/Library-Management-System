import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || '';
    const genre = searchParams.get('genre') || '';
    const format = searchParams.get('format') || '';

    const whereCondition: any = {};

    if (search) {
      whereCondition.OR = [
        { title: { contains: search } },
        { author: { contains: search } },
        { isbn: { contains: search } },
        { subject: { contains: search } },
      ];
    }

    if (genre) {
      whereCondition.genre = genre;
    }

    if (format === 'ebook') {
      whereCondition.eResources = { some: {} };
    } else if (format === 'physical') {
      whereCondition.copies = { some: {} };
    }

    const rawBooks = await prisma.book.findMany({
      where: whereCondition,
      include: {
        copies: {
          include: {
            loans: {
              where: { status: { in: ['ISSUED', 'OVERDUE'] } },
              select: { dueDate: true, status: true, userId: true },
            },
          },
        },
        eResources: true,
        holds: {
          where: { status: { in: ['PENDING', 'APPROVED'] } },
          orderBy: { requestDate: 'asc' },
          select: { id: true, userId: true, bookId: true, requestDate: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const books = rawBooks.map((book) => {
      let earliestDueDate: string | null = null;
      for (const copy of book.copies) {
        for (const loan of copy.loans) {
          if (!earliestDueDate || new Date(loan.dueDate) < new Date(earliestDueDate)) {
            earliestDueDate = loan.dueDate.toISOString();
          }
        }
      }

      return {
        ...book,
        earliestDueDate,
        pendingHoldsCount: book.holds.filter((h) => h.status === 'PENDING').length,
      };
    });

    return NextResponse.json({ success: true, count: books.length, books });
  } catch (error: any) {
    console.error('Error fetching books:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch books' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      isbn,
      title,
      author,
      publisher,
      publicationYear,
      genre,
      subject,
      description,
      coverUrl,
      language,
      maxRentDays = 7,
      originalPrice, // Optional original book replacement price in MMK
      dailyFineRate = 500, // Daily Overdue Fine in MMK (calculates for all overdue days)
      bookType, // 'physical' or 'ebook'
      numberOfCopies = 1,
      callNumber = 'QA76.73',
      location = 'Main Floor - Shelf CS-01',
      pdfUrl,
      ebookFormat = 'PDF',
    } = body;

    if (!isbn || !title || !author) {
      return NextResponse.json(
        { success: false, error: 'ISBN, Title, and Author are required fields.' },
        { status: 400 }
      );
    }

    // Check existing ISBN
    const existingBook = await prisma.book.findUnique({
      where: { isbn: isbn.trim() },
    });

    if (existingBook) {
      return NextResponse.json(
        { success: false, error: `Book with ISBN ${isbn} already exists.` },
        { status: 409 }
      );
    }

    const priceVal = originalPrice ? parseFloat(String(originalPrice)) : null;
    const fineRateVal = dailyFineRate !== undefined && dailyFineRate !== '' ? parseFloat(String(dailyFineRate)) : 500;

    const newBook = await prisma.book.create({
      data: {
        isbn: isbn.trim(),
        title,
        author,
        publisher: publisher || null,
        publicationYear: publicationYear ? parseInt(publicationYear) : null,
        genre: genre || null,
        subject: subject || null,
        description: description || null,
        coverUrl: coverUrl || null,
        language: language || 'English',
        maxRentDays: maxRentDays ? parseInt(String(maxRentDays)) : 7,
        originalPrice: priceVal,
        dailyFineRate: isNaN(fineRateVal) ? 500 : fineRateVal,
      },
    });

    // Create physical copies or E-Book asset based on type
    if (bookType === 'physical' || !bookType) {
      const copiesToCreate = Math.max(1, parseInt(String(numberOfCopies)) || 1);
      const copyData = [];
      const baseNum = Math.floor(1000 + Math.random() * 9000);

      for (let i = 0; i < copiesToCreate; i++) {
        copyData.push({
          bookId: newBook.id,
          barcode: `BC-${baseNum + i}`,
          callNumber: `${callNumber} c.${i + 1}`,
          location: location || 'Main Floor - Shelf CS-01',
          status: 'AVAILABLE',
          condition: 'NEW',
          price: priceVal,
        });
      }

      await prisma.bookCopy.createMany({
        data: copyData,
      });
    }

    if (bookType === 'ebook') {
      await prisma.eResource.create({
        data: {
          bookId: newBook.id,
          title: `${title} (Digital Version)`,
          author,
          format: ebookFormat || 'PDF',
          fileUrl: pdfUrl || '',
          isOpenAccess: true,
        },
      });
    }

    const fullBook = await prisma.book.findUnique({
      where: { id: newBook.id },
      include: { copies: true, eResources: true },
    });

    return NextResponse.json({ success: true, book: fullBook }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating book:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create book record' },
      { status: 500 }
    );
  }
}
