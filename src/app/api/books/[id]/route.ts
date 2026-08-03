import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        copies: {
          include: {
            loans: {
              where: { status: 'ISSUED' },
              include: { user: true },
            },
          },
        },
        eResources: true,
        holds: {
          include: { user: true },
        },
      },
    });

    if (!book) {
      return NextResponse.json(
        { success: false, error: 'Book not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, book });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error fetching book' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      marcMetadata,
    } = body;

    const updatedBook = await prisma.book.update({
      where: { id },
      data: {
        isbn,
        title,
        author,
        publisher,
        publicationYear: publicationYear ? parseInt(publicationYear) : undefined,
        genre,
        subject,
        description,
        coverUrl,
        language,
        marcMetadata: marcMetadata ? JSON.stringify(marcMetadata) : undefined,
      },
      include: { copies: true },
    });

    return NextResponse.json({ success: true, book: updatedBook });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error updating book' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.book.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Book and associated copies successfully deleted.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error deleting book' },
      { status: 500 }
    );
  }
}
