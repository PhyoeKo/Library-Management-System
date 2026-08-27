import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/patrons - List patrons with Koha borrower metrics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || '';
    const categoryId = searchParams.get('categoryId');
    const status = searchParams.get('status');

    const whereCondition: any = {};
    if (search) {
      whereCondition.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { barcode: { contains: search } },
        { nrcNumber: { contains: search } },
        { phone: { contains: search } },
      ];
    }
    if (categoryId) {
      whereCondition.categoryId = categoryId;
    }
    if (status === 'ACTIVE') {
      whereCondition.isBlocked = false;
    } else if (status === 'SUSPENDED') {
      whereCondition.isBlocked = true;
    }

    const patrons = await prisma.user.findMany({
      where: whereCondition,
      include: {
        category: true,
        loans: {
          where: { status: { in: ['ISSUED', 'OVERDUE'] } },
          include: {
            copy: { include: { book: true } },
          },
        },
        fines: {
          where: { status: { in: ['UNPAID', 'PARTIALLY_PAID'] } },
        },
        holds: {
          where: { status: { in: ['PENDING', 'APPROVED'] } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const enriched = patrons.map((p) => {
      const activeLoanCount = p.loans.length;
      const overdueLoanCount = p.loans.filter((l) => new Date(l.dueDate) < now).length;
      const unpaidFineTotal = p.fines.reduce((sum, f) => sum + (f.amount - f.paidAmount), 0);
      const activeHoldCount = p.holds.length;

      return {
        ...p,
        activeLoanCount,
        overdueLoanCount,
        unpaidFineTotal,
        activeHoldCount,
      };
    });

    return NextResponse.json({
      success: true,
      count: enriched.length,
      patrons: enriched,
    });
  } catch (error: any) {
    console.error('Error fetching patrons:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch members' },
      { status: 500 }
    );
  }
}

// POST /api/patrons - Create patron with category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      password,
      role = 'PATRON',
      categoryId,
      barcode,
      phone,
      address,
      nrcNumber,
      nrcFrontUrl,
      nrcBackUrl,
      kycStatus = 'VERIFIED',
      isBlocked = false,
      blockReason,
    } = body;

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'Full Name and Email Address are required fields.' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: `Member with email "${email}" already exists.` },
        { status: 409 }
      );
    }

    let finalBarcode = barcode ? barcode.trim() : '';
    if (!finalBarcode) {
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      finalBarcode = `PAT-${randomNum}`;
    }

    const existingBarcode = await prisma.user.findUnique({
      where: { barcode: finalBarcode },
    });

    if (existingBarcode) {
      return NextResponse.json(
        { success: false, error: `Member with barcode "${finalBarcode}" already exists.` },
        { status: 409 }
      );
    }

    const patron = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        passwordHash: password || 'pbkdf2_hash_placeholder',
        role: role || 'PATRON',
        categoryId: categoryId || null,
        barcode: finalBarcode,
        phone: phone || null,
        address: address || null,
        nrcNumber: nrcNumber || null,
        nrcFrontUrl: nrcFrontUrl || null,
        nrcBackUrl: nrcBackUrl || null,
        kycStatus: kycStatus || 'VERIFIED',
        isBlocked: Boolean(isBlocked),
        blockReason: isBlocked ? (blockReason || 'Suspended by staff') : null,
      },
      include: { category: true },
    });

    return NextResponse.json({ success: true, patron }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating member:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create member record' },
      { status: 500 }
    );
  }
}
