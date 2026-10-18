import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || '';
    const genre = searchParams.get('genre') || '';
    const format = searchParams.get('format') || '';
    const collection = searchParams.get('collection') || 'all';
    const sortBy = searchParams.get('sort') || '';

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
              select: { id: true, dueDate: true, status: true, userId: true },
            },
          },
        },
        eResources: true,
        holds: {
          orderBy: { requestDate: 'asc' },
          select: { id: true, userId: true, bookId: true, requestDate: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const scoredBooks = rawBooks.map((book) => {
      let earliestDueDate: string | null = null;
      let activeLoansCount = 0;
      let totalLoansCount = 0;

      for (const copy of book.copies) {
        totalLoansCount += copy.loans.length;
        for (const loan of copy.loans) {
          if (loan.status === 'ISSUED' || loan.status === 'OVERDUE') {
            activeLoansCount++;
            if (!earliestDueDate || new Date(loan.dueDate) < new Date(earliestDueDate)) {
              earliestDueDate = loan.dueDate.toISOString();
            }
          }
        }
      }

      const activeHolds = book.holds.filter(
        (h) => h.status === 'PENDING' || h.status === 'APPROVED'
      );
      const pendingHoldsCount = activeHolds.length;
      const totalHoldsCount = book.holds.length;

      const isClassicIcon = [
        'မြသန်းတင့်',
        'ချစ်ဦးညို',
        'ဂျာနယ်ကျော်မမလေး',
        'မောင်ထင်',
        'ရွှေဥဒေါင်း',
        'ဒဂုန်တာရာ',
        'မင်းသုဝဏ်',
      ].some((a) => book.author && book.author.includes(a));

      const popularityScore =
        pendingHoldsCount * 25 +
        totalHoldsCount * 12 +
        totalLoansCount * 15 +
        activeLoansCount * 10 +
        (isClassicIcon ? 15 : 0) +
        (book.eResources.length > 0 ? 5 : 0);

      const year = book.publicationYear || 0;
      const isLatest = year >= 2004;

      return {
        ...book,
        earliestDueDate,
        pendingHoldsCount,
        totalHoldsCount,
        totalLoansCount,
        activeLoansCount,
        popularityScore,
        isLatest,
      };
    });

    // Rank top trending books
    const sortedForTrending = [...scoredBooks].sort(
      (a, b) => b.popularityScore - a.popularityScore
    );
    const trendingSet = new Set(sortedForTrending.slice(0, 15).map((b) => b.id));
    const trendingRankMap = new Map(
      sortedForTrending.slice(0, 15).map((b, idx) => [b.id, idx + 1])
    );

    let books = scoredBooks.map((b) => ({
      ...b,
      isTrending: trendingSet.has(b.id) || b.pendingHoldsCount > 0 || b.totalLoansCount > 0,
      trendingRank: trendingRankMap.get(b.id) || null,
    }));

    // Apply collection filter
    if (collection === 'trending') {
      books = books
        .filter((b) => b.isTrending)
        .sort((a, b) => b.popularityScore - a.popularityScore);
    } else if (collection === 'latest') {
      books = books
        .filter((b) => b.isLatest)
        .sort((a, b) => (b.publicationYear || 0) - (a.publicationYear || 0));
    } else if (collection === 'most_borrowed') {
      books = books
        .filter((b) => b.totalLoansCount > 0)
        .sort((a, b) => b.totalLoansCount - a.totalLoansCount);
    } else if (collection === 'myanmar_classics') {
      books = books.filter((b) => {
        const g = (b.genre || '').toLowerCase();
        return (
          b.language === 'Burmese' ||
          g.includes('classic') ||
          g.includes('historical') ||
          g.includes('heritage') ||
          g.includes('poetry') ||
          g.includes('myanmar') ||
          g.includes('buddhist')
        );
      });
    } else if (collection === 'tech') {
      books = books.filter((b) => {
        const g = (b.genre || '').toLowerCase();
        return (
          g.includes('computer') ||
          g.includes('software') ||
          g.includes('algorithm') ||
          g.includes('tech')
        );
      });
    }

    // Apply sorting
    if (sortBy === 'trending') {
      books.sort((a, b) => b.popularityScore - a.popularityScore);
    } else if (sortBy === 'latest') {
      books.sort((a, b) => (b.publicationYear || 0) - (a.publicationYear || 0));
    } else if (sortBy === 'oldest') {
      books.sort((a, b) => (a.publicationYear || 9999) - (b.publicationYear || 9999));
    } else if (sortBy === 'title_asc') {
      books.sort((a, b) => a.title.localeCompare(b.title));
    }

    const allGenres = Array.from(
      new Set(rawBooks.map((b) => b.genre).filter(Boolean))
    ).sort();

    const collectionCounts = {
      all: scoredBooks.length,
      trending: scoredBooks.filter(
        (b) => trendingSet.has(b.id) || b.pendingHoldsCount > 0 || b.totalLoansCount > 0
      ).length,
      latest: scoredBooks.filter((b) => b.isLatest).length,
      most_borrowed: scoredBooks.filter((b) => b.totalLoansCount > 0).length,
      myanmar_classics: scoredBooks.filter((b) => {
        const g = (b.genre || '').toLowerCase();
        return (
          b.language === 'Burmese' ||
          g.includes('classic') ||
          g.includes('historical') ||
          g.includes('heritage') ||
          g.includes('poetry') ||
          g.includes('myanmar') ||
          g.includes('buddhist')
        );
      }).length,
      tech: scoredBooks.filter((b) => {
        const g = (b.genre || '').toLowerCase();
        return (
          g.includes('computer') ||
          g.includes('software') ||
          g.includes('algorithm') ||
          g.includes('tech')
        );
      }).length,
    };

    return NextResponse.json({
      success: true,
      count: books.length,
      totalCatalogCount: rawBooks.length,
      collectionCounts,
      genres: allGenres,
      books,
    });
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
