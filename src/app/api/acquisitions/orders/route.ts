import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/acquisitions/orders - List purchase orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const vendorId = searchParams.get('vendorId');
    const search = searchParams.get('q');

    const where: any = {};
    if (status && status !== 'ALL') where.status = status;
    if (vendorId) where.vendorId = vendorId;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { vendor: { name: { contains: search } } },
      ];
    }

    const orders = await prisma.purchaseOrder.findMany({
      where,
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            code: true,
            contactEmail: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalBudgetSum = orders.reduce((sum, o) => sum + o.totalBudget, 0);
    const statusCounts = {
      DRAFT: orders.filter((o) => o.status === 'DRAFT').length,
      ORDERED: orders.filter((o) => o.status === 'ORDERED').length,
      RECEIVED: orders.filter((o) => o.status === 'RECEIVED').length,
      CANCELLED: orders.filter((o) => o.status === 'CANCELLED').length,
    };

    return NextResponse.json({
      success: true,
      count: orders.length,
      totalBudget: totalBudgetSum,
      statusCounts,
      orders,
    });
  } catch (error: any) {
    console.error('Failed to fetch purchase orders:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch purchase orders' },
      { status: 500 }
    );
  }
}

// POST /api/acquisitions/orders - Create a new purchase order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorId, totalBudget, orderNumber, status } = body;

    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: 'Vendor is required for purchase orders' },
        { status: 400 }
      );
    }

    if (totalBudget === undefined || totalBudget < 0) {
      return NextResponse.json(
        { success: false, error: 'Valid total budget/cost is required' },
        { status: 400 }
      );
    }

    // Auto-generate PO number if not supplied
    let poNumber = orderNumber;
    if (!poNumber) {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const count = await prisma.purchaseOrder.count();
      poNumber = `PO-${dateStr}-${String(count + 1).padStart(3, '0')}`;
    }

    const order = await prisma.purchaseOrder.create({
      data: {
        orderNumber: poNumber,
        vendorId,
        totalBudget: parseFloat(totalBudget.toString()),
        status: status || 'DRAFT',
      },
      include: {
        vendor: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Purchase order created',
      order,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create purchase order:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create purchase order' },
      { status: 500 }
    );
  }
}
