import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/course-reserves - List academic course reserves
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q');
    const courseCode = searchParams.get('courseCode');

    const where: any = {};
    if (courseCode) {
      where.courseCode = courseCode;
    }
    if (search) {
      where.OR = [
        { courseCode: { contains: search } },
        { courseName: { contains: search } },
        { instructor: { contains: search } },
        { book: { title: { contains: search } } },
      ];
    }

    const items = await prisma.courseReserveItem.findMany({
      where,
      include: {
        book: {
          include: {
            copies: true,
          },
        },
      },
      orderBy: { courseCode: 'asc' },
    });

    return NextResponse.json({
      success: true,
      count: items.length,
      reserves: items,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/course-reserves - Place book on course reserve
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseCode, courseName, instructor, bookId } = body;

    if (!courseCode || !courseName || !instructor || !bookId) {
      return NextResponse.json(
        { success: false, error: 'Course Code, Course Name, Instructor, and Book ID are required' },
        { status: 400 }
      );
    }

    const reserve = await prisma.courseReserveItem.create({
      data: {
        courseCode: courseCode.toUpperCase().trim(),
        courseName: courseName.trim(),
        instructor: instructor.trim(),
        bookId,
      },
      include: {
        book: true,
      },
    });

    return NextResponse.json({ success: true, reserve }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
