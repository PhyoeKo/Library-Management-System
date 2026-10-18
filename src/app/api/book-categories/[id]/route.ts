import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/book-categories/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const category = await prisma.bookCategory.findUnique({
      where: { id },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    const count = await prisma.book.count({
      where: { genre: category.name },
    });

    return NextResponse.json({
      success: true,
      category: { ...category, bookCount: count },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error fetching category' },
      { status: 500 }
    );
  }
}

// PUT /api/book-categories/[id] - Update/rename category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, code, description, icon } = body;

    const existingCategory = await prisma.bookCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    const oldName = existingCategory.name;
    const newName = name ? name.trim() : oldName;

    // Check duplicate if name is changing
    if (newName !== oldName) {
      const duplicate = await prisma.bookCategory.findUnique({
        where: { name: newName },
      });
      if (duplicate && duplicate.id !== id) {
        return NextResponse.json(
          { success: false, error: `Category "${newName}" already exists.` },
          { status: 409 }
        );
      }
    }

    const updatedCategory = await prisma.bookCategory.update({
      where: { id },
      data: {
        name: newName,
        code: code !== undefined ? (code ? code.trim().toUpperCase() : null) : existingCategory.code,
        description: description !== undefined ? description?.trim() : existingCategory.description,
        icon: icon || existingCategory.icon,
      },
    });

    // If category name was renamed, update all books with the old category name!
    if (newName !== oldName) {
      await prisma.book.updateMany({
        where: { genre: oldName },
        data: { genre: newName },
      });
    }

    const count = await prisma.book.count({
      where: { genre: newName },
    });

    return NextResponse.json({
      success: true,
      category: { ...updatedCategory, bookCount: count },
    });
  } catch (error: any) {
    console.error('Error updating book category:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE /api/book-categories/[id] - Delete category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existingCategory = await prisma.bookCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if books are using this category
    const bookCount = await prisma.book.count({
      where: { genre: existingCategory.name },
    });

    // If books are using it, optionally null out their genre or reassign
    if (bookCount > 0) {
      await prisma.book.updateMany({
        where: { genre: existingCategory.name },
        data: { genre: 'General' },
      });
    }

    await prisma.bookCategory.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Category "${existingCategory.name}" removed successfully. (${bookCount} books set to General)`,
    });
  } catch (error: any) {
    console.error('Error deleting book category:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete category' },
      { status: 500 }
    );
  }
}
