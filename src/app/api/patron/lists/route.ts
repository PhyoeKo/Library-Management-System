import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/patron/lists - List patron's saved virtual lists
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const lists = await prisma.savedList.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, lists });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/patron/lists - Create a new virtual shelf / saved list
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, description } = body;

    if (!userId || !name) {
      return NextResponse.json({ success: false, error: 'User ID and List Name are required' }, { status: 400 });
    }

    const list = await prisma.savedList.create({
      data: {
        userId,
        name: name.trim(),
        description: description || null,
        bookIds: JSON.stringify([]),
      },
    });

    return NextResponse.json({ success: true, list }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/patron/lists - Remove a virtual list
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const listId = searchParams.get('id');

    if (!listId) {
      return NextResponse.json({ success: false, error: 'List ID required' }, { status: 400 });
    }

    await prisma.savedList.delete({
      where: { id: listId },
    });

    return NextResponse.json({ success: true, message: 'Saved list deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
