import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isbn = searchParams.get('isbn')?.replace(/[^0-9X]/gi, '') || '';

    if (!isbn) {
      return NextResponse.json(
        { success: false, error: 'Valid ISBN is required.' },
        { status: 400 }
      );
    }

    const openLibraryUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
    const res = await fetch(openLibraryUrl);

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: 'OpenLibrary service unavailable.' },
        { status: 502 }
      );
    }

    const data = await res.json();
    const bookData = data[`ISBN:${isbn}`];

    if (!bookData) {
      return NextResponse.json(
        { success: false, error: `No metadata found for ISBN ${isbn}.` },
        { status: 404 }
      );
    }

    const title = bookData.title || '';
    const author = bookData.authors ? bookData.authors.map((a: any) => a.name).join(', ') : 'Unknown Author';
    const publisher = bookData.publishers ? bookData.publishers.map((p: any) => p.name).join(', ') : '';
    const publicationYear = bookData.publish_date ? parseInt(bookData.publish_date.match(/\d{4}/)?.[0] || '0') : null;
    const coverUrl = bookData.cover?.large || bookData.cover?.medium || '';
    const subject = bookData.subjects ? bookData.subjects.slice(0, 3).map((s: any) => s.name).join(', ') : '';

    return NextResponse.json({
      success: true,
      metadata: {
        isbn,
        title,
        author,
        publisher,
        publicationYear,
        coverUrl,
        subject,
        genre: subject ? subject.split(',')[0] : 'General',
        language: 'English',
        marcMetadata: {
          leader: '00000nam a2200000 a 4500',
          fields: [
            { tag: '020', subfields: { a: isbn } },
            { tag: '100', subfields: { a: author } },
            { tag: '245', subfields: { a: title } },
            { tag: '260', subfields: { b: publisher, c: String(publicationYear || '') } },
          ],
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'ISBN lookup failed' },
      { status: 500 }
    );
  }
}
