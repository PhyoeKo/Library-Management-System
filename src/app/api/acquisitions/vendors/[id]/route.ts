import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/acquisitions/vendors/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        purchaseOrders: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!vendor) {
      return NextResponse.json({ success: false, error: 'Vendor not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, vendor });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH /api/acquisitions/vendors/[id] - Update vendor details
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, code, contactEmail, phone, address, accountNumber } = body;

    const vendor = await prisma.vendor.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(code && { code: code.toUpperCase().trim() }),
        ...(contactEmail !== undefined && { contactEmail }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(accountNumber !== undefined && { accountNumber }),
      },
    });

    return NextResponse.json({ success: true, vendor });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/acquisitions/vendors/[id] - Delete vendor if no received POs
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check if vendor has purchase orders
    const poCount = await prisma.purchaseOrder.count({
      where: { vendorId: id },
    });

    if (poCount > 0) {
      // Delete draft/cancelled POs or prevent if active
      const activePOs = await prisma.purchaseOrder.count({
        where: { vendorId: id, status: { in: ['ORDERED', 'RECEIVED'] } },
      });

      if (activePOs > 0) {
        return NextResponse.json({
          success: false,
          error: 'Cannot delete vendor with active or received purchase orders. Cancel orders first.',
        }, { status: 400 });
      }

      await prisma.purchaseOrder.deleteMany({ where: { vendorId: id } });
    }

    await prisma.vendor.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Vendor deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
