import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || '';

    const whereCondition: any = {};
    if (search) {
      whereCondition.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { barcode: { contains: search } },
        { nrcNumber: { contains: search } },
      ];
    }

    const patrons = await prisma.user.findMany({
      where: whereCondition,
      include: {
        category: true,
        loans: { where: { status: 'ISSUED' } },
        fines: { where: { status: 'UNPAID' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, count: patrons.length, patrons });
  } catch (error: any) {
    console.error('Error fetching patrons:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch members' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      password,
      role = 'PATRON',
      barcode,
      phone,
      address, // Current Location
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

    // Check existing email
    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: `Member with email "${email}" already exists.` },
        { status: 409 }
      );
    }

    // Auto-generate barcode if blank
    let finalBarcode = barcode ? barcode.trim() : '';
    if (!finalBarcode) {
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      finalBarcode = `PAT-${randomNum}`;
    }

    // Check existing barcode
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
        barcode: finalBarcode,
        phone: phone || null,
        address: address || null,
        nrcNumber: nrcNumber || null,
        nrcFrontUrl: nrcFrontUrl || null,
        nrcBackUrl: nrcBackUrl || null,
        kycStatus: kycStatus || 'VERIFIED',
        isBlocked: Boolean(isBlocked),
        blockReason: blockReason || null,
      },
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
