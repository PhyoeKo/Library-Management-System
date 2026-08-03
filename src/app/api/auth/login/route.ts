import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emailOrBarcode, password, targetRole } = body;

    if (!emailOrBarcode) {
      return NextResponse.json(
        { success: false, error: 'Email or Barcode is required.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrBarcode.trim() },
          { barcode: emailOrBarcode.trim() },
        ],
      },
      include: { category: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials. User not found in system database.' },
        { status: 401 }
      );
    }

    // Role validation check
    if (targetRole === 'STAFF' && user.role === 'PATRON') {
      return NextResponse.json(
        { success: false, error: 'Access Denied: Patron accounts cannot access Staff Portal.' },
        { status: 403 }
      );
    }

    if (user.isBlocked) {
      return NextResponse.json(
        { success: false, error: `Account BLOCKED: ${user.blockReason || 'Suspended'}` },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        barcode: user.barcode,
        role: user.role,
        category: user.category?.name || 'Standard User',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Authentication error' },
      { status: 500 }
    );
  }
}
