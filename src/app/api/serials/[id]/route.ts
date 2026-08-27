import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/serials/[id] - Update subscription details or toggle active status
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, issn, frequency, publisher, active } = body;

    const serial = await prisma.serialSubscription.update({
      where: { id },
      data: {
        ...(title && { title: title.trim() }),
        ...(issn !== undefined && { issn: issn ? issn.trim() : null }),
        ...(frequency && { frequency }),
        ...(publisher !== undefined && { publisher: publisher ? publisher.trim() : null }),
        ...(active !== undefined && { active: Boolean(active) }),
      },
    });

    return NextResponse.json({ success: true, serial });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/serials/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await prisma.serialSubscription.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Subscription removed' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
