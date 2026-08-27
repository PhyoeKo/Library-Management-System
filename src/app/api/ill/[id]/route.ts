import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/ill/[id] - Update ILL workflow state: PENDING -> REQUESTED -> IN_TRANSIT -> RECEIVED -> COMPLETED / CANCELLED
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, partnerLibrary, bookTitle, author } = body;

    const ill = await prisma.iLLRequest.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(partnerLibrary && { partnerLibrary }),
        ...(bookTitle && { bookTitle }),
        ...(author && { author }),
      },
      include: { user: true },
    });

    return NextResponse.json({ success: true, request: ill });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/ill/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await prisma.iLLRequest.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'ILL request removed' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
