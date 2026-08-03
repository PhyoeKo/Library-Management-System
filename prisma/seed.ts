import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Koha LMS database with MMK currency unit...');

  // 1. Patron Categories (fineRatePerDay in MMK)
  const studentCategory = await prisma.patronCategory.upsert({
    where: { code: 'STUDENT' },
    update: { fineRatePerDay: 500 },
    create: {
      code: 'STUDENT',
      name: 'Undergraduate Student',
      maxLoanCount: 5,
      loanPeriodDays: 14,
      fineRatePerDay: 500, // 500 MMK per day
      gracePeriodDays: 1,
    },
  });

  const facultyCategory = await prisma.patronCategory.upsert({
    where: { code: 'FACULTY' },
    update: { fineRatePerDay: 250 },
    create: {
      code: 'FACULTY',
      name: 'Faculty & Researchers',
      maxLoanCount: 15,
      loanPeriodDays: 30,
      fineRatePerDay: 250, // 250 MMK per day
      gracePeriodDays: 3,
    },
  });

  // 2. Users / Patrons & Staff
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@library.edu' },
    update: {},
    create: {
      email: 'admin@library.edu',
      name: 'Eleanor Vance (Chief Librarian)',
      role: 'ADMIN',
      barcode: 'STAFF-001',
      phone: '+95-9-555-0192',
      address: 'Central Campus Library Office 101',
    },
  });

  const studentUser = await prisma.user.upsert({
    where: { email: 'alex.rivera@student.edu' },
    update: {},
    create: {
      email: 'alex.rivera@student.edu',
      name: 'Alex Rivera',
      role: 'PATRON',
      barcode: 'PAT-88401',
      categoryId: studentCategory.id,
      phone: '+95-9-555-4410',
      address: 'Dormitory B, Room 304',
    },
  });

  const facultyUser = await prisma.user.upsert({
    where: { email: 'dr.chen@university.edu' },
    update: {},
    create: {
      email: 'dr.chen@university.edu',
      name: 'Dr. Sarah Chen',
      role: 'PATRON',
      barcode: 'PAT-90022',
      categoryId: facultyCategory.id,
      phone: '+95-9-555-8822',
      address: 'Department of Computer Science',
    },
  });

  // 3. Books & Bibliographic Records
  const book1 = await prisma.book.upsert({
    where: { isbn: '9780131103627' },
    update: {},
    create: {
      isbn: '9780131103627',
      title: 'The C Programming Language',
      author: 'Brian W. Kernighan, Dennis M. Ritchie',
      publisher: 'Prentice Hall',
      publicationYear: 1988,
      genre: 'Computer Science',
      subject: 'Programming / C',
      description: 'The classic authoritative guide to programming in ANSI C.',
      coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80',
      language: 'English',
    },
  });

  const book2 = await prisma.book.upsert({
    where: { isbn: '9780262033848' },
    update: {},
    create: {
      isbn: '9780262033848',
      title: 'Introduction to Algorithms',
      author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest',
      publisher: 'MIT Press',
      publicationYear: 2009,
      genre: 'Computer Science',
      subject: 'Algorithms & Data Structures',
      description: 'Comprehensive textbook on design and analysis of computer algorithms.',
      coverUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&q=80',
      language: 'English',
    },
  });

  // 4. Physical Book Copies
  const copy1 = await prisma.bookCopy.upsert({
    where: { barcode: 'BC-1001' },
    update: {},
    create: {
      bookId: book1.id,
      barcode: 'BC-1001',
      callNumber: 'QA76.73.C15 K47',
      location: 'Main Stacks - Floor 2 - Shelf CS-01',
      status: 'AVAILABLE',
      condition: 'GOOD',
    },
  });

  const copy2 = await prisma.bookCopy.upsert({
    where: { barcode: 'BC-1002' },
    update: {},
    create: {
      bookId: book1.id,
      barcode: 'BC-1002',
      callNumber: 'QA76.73.C15 K47 c.2',
      location: 'Reserve Desk - Floor 1',
      status: 'ON_LOAN',
      condition: 'NEW',
    },
  });

  // 5. E-Resources
  await prisma.eResource.create({
    data: {
      bookId: book1.id,
      title: 'The C Programming Language (Digital Reference Guide)',
      author: 'Brian W. Kernighan',
      format: 'PDF',
      fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      isOpenAccess: true,
    },
  });

  // 6. Active Overdue Loan & Fine in MMK
  const overdueDueDate = new Date();
  overdueDueDate.setDate(overdueDueDate.getDate() - 10); // 10 days ago

  const overdueLoan = await prisma.loan.create({
    data: {
      userId: studentUser.id,
      copyId: copy2.id,
      issuedDate: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000),
      dueDate: overdueDueDate,
      status: 'OVERDUE',
      issuedBy: adminUser.id,
    },
  });

  // Update existing fine records to MMK
  await prisma.fine.deleteMany({ where: { userId: studentUser.id } });

  await prisma.fine.create({
    data: {
      userId: studentUser.id,
      loanId: overdueLoan.id,
      amount: 4500, // (10 days - 1 grace day) * 500 MMK = 4,500 MMK
      paidAmount: 0,
      reason: 'OVERDUE',
      status: 'UNPAID',
    },
  });

  console.log('Seed with MMK currency completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
