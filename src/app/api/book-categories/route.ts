import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/book-categories - List all categories with associated book counts
export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.bookCategory.findMany({
      orderBy: { name: 'asc' },
    });

    // Count books for each category
    const books = await prisma.book.findMany({
      select: { genre: true },
    });

    const countsMap: Record<string, number> = {};
    for (const b of books) {
      if (b.genre) {
        countsMap[b.genre] = (countsMap[b.genre] || 0) + 1;
      }
    }

    const categoriesWithCount = categories.map((c) => ({
      ...c,
      bookCount: countsMap[c.name] || 0,
    }));

    return NextResponse.json({
      success: true,
      categories: categoriesWithCount,
      totalCount: categories.length,
    });
  } catch (error: any) {
    console.error('Error fetching book categories:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST /api/book-categories - Create a new book category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, description, icon } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Category name is required.' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    // Check duplicate
    const existing = await prisma.bookCategory.findUnique({
      where: { name: trimmedName },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Category "${trimmedName}" already exists.` },
        { status: 409 }
      );
    }

    const generatedCode =
      code && code.trim()
        ? code.trim().toUpperCase()
        : trimmedName.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 20);

    const newCategory = await prisma.bookCategory.create({
      data: {
        name: trimmedName,
        code: generatedCode,
        description: description ? description.trim() : null,
        icon: icon || 'BookOpen',
      },
    });

    return NextResponse.json(
      { success: true, category: { ...newCategory, bookCount: 0 } },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating book category:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create category' },
      { status: 500 }
    );
  }
}
