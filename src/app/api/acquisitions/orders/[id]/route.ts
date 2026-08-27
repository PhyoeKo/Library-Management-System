import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/acquisitions/orders/[id] - Update PO status (e.g. DRAFT -> ORDERED -> RECEIVED -> CANCELLED)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, totalBudget, orderNumber } = body;

    const validStatuses = ['DRAFT', 'ORDERED', 'RECEIVED', 'CANCELLED'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const order = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(totalBudget !== undefined && { totalBudget: parseFloat(totalBudget.toString()) }),
        ...(orderNumber && { orderNumber }),
      },
      include: {
        vendor: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Purchase order updated to ${order.status}`,
      order,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/acquisitions/orders/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await prisma.purchaseOrder.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Purchase order deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
