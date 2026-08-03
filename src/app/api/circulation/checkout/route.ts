import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patronBarcode, copyBarcode, staffId } = body;

    if (!patronBarcode || !copyBarcode) {
      return NextResponse.json(
        { success: false, error: 'Member barcode and Copy barcode are required.' },
        { status: 400 }
      );
    }

    // Find Member / Patron
    const user = await prisma.user.findUnique({
      where: { barcode: patronBarcode },
      include: { category: true, loans: { where: { status: 'ISSUED' } } },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: `Member with barcode "${patronBarcode}" not found.` },
        { status: 404 }
      );
    }

    if (user.isBlocked) {
      return NextResponse.json(
        {
          success: false,
          error: `Member account is BLOCKED: ${user.blockReason || 'Unresolved issues'}.`,
        },
        { status: 403 }
      );
    }

    const maxLoanCount = user.category?.maxLoanCount ?? 5;
    if (user.loans.length >= maxLoanCount) {
      return NextResponse.json(
        {
          success: false,
          error: `Member has reached maximum loan capacity (${user.loans.length}/${maxLoanCount}).`,
        },
        { status: 400 }
      );
    }

    // Find Book Copy
    const copy = await prisma.bookCopy.findUnique({
      where: { barcode: copyBarcode },
      include: { book: true },
    });

    if (!copy) {
      return NextResponse.json(
        { success: false, error: `Book copy with barcode "${copyBarcode}" not found.` },
        { status: 404 }
      );
    }

    if (copy.status !== 'AVAILABLE') {
      return NextResponse.json(
        { success: false, error: `Copy is currently "${copy.status}" and cannot be issued.` },
        { status: 400 }
      );
    }

    // Calculate Due Date based on Book's Max Rent Days (Default 7 Days)
    const loanDurationDays = copy.book.maxRentDays || user.category?.loanPeriodDays || 7;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + loanDurationDays);

    const [loan, updatedCopy] = await prisma.$transaction([
      prisma.loan.create({
        data: {
          userId: user.id,
          copyId: copy.id,
          issuedDate: new Date(),
          dueDate,
          status: 'ISSUED',
          issuedBy: staffId || 'STAFF-DESK',
        },
        include: {
          user: true,
          copy: { include: { book: true } },
        },
      }),
      prisma.bookCopy.update({
        where: { id: copy.id },
        data: { status: 'ON_LOAN' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Book "${copy.book.title}" checked out to ${user.name} for ${loanDurationDays} days (Due: ${dueDate.toLocaleDateString()}).`,
      loan,
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process checkout' },
      { status: 500 }
    );
  }
}
