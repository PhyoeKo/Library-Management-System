import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/acquisitions/vendors - List all vendors with purchase order counts & total spend
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || '';

    const vendors = await prisma.vendor.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search } },
              { code: { contains: search } },
              { contactEmail: { contains: search } },
            ],
          }
        : undefined,
      include: {
        purchaseOrders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalBudget: true,
            createdAt: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const enrichedVendors = vendors.map((v) => {
      const activePOs = v.purchaseOrders.filter((po) => po.status === 'ORDERED' || po.status === 'DRAFT').length;
      const totalSpend = v.purchaseOrders
        .filter((po) => po.status === 'RECEIVED')
        .reduce((sum, po) => sum + po.totalBudget, 0);

      return {
        ...v,
        poCount: v.purchaseOrders.length,
        activePOs,
        totalSpend,
      };
    });

    return NextResponse.json({
      success: true,
      count: enrichedVendors.length,
      vendors: enrichedVendors,
    });
  } catch (error: any) {
    console.error('Failed to fetch vendors:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch vendors' },
      { status: 500 }
    );
  }
}

// POST /api/acquisitions/vendors - Create a new vendor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, contactEmail, phone, address, accountNumber } = body;

    if (!name || !code) {
      return NextResponse.json(
        { success: false, error: 'Vendor name and unique vendor code are required' },
        { status: 400 }
      );
    }

    const existing = await prisma.vendor.findUnique({
      where: { code },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Vendor with code "${code}" already exists` },
        { status: 409 }
      );
    }

    const vendor = await prisma.vendor.create({
      data: {
        name,
        code: code.toUpperCase().trim(),
        contactEmail: contactEmail || null,
        phone: phone || null,
        address: address || null,
        accountNumber: accountNumber || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Vendor successfully created',
      vendor,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create vendor:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create vendor' },
      { status: 500 }
    );
  }
}
