import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Skylark Library demo database...');

  // ── Clean slate ──────────────────────────────────────────
  await prisma.finePayment.deleteMany();
  await prisma.fine.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.hold.deleteMany();
  await prisma.readingLog.deleteMany();
  await prisma.savedList.deleteMany();
  await prisma.iLLRequest.deleteMany();
  await prisma.courseReserveItem.deleteMany();
  await prisma.eResource.deleteMany();
  await prisma.bookCopy.deleteMany();
  await prisma.book.deleteMany();
  await prisma.user.deleteMany();
  await prisma.patronCategory.deleteMany();
  await prisma.circulationRule.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.serialSubscription.deleteMany();

  // ══════════════════════════════════════════════════════════
  // 1. PATRON CATEGORIES
  // ══════════════════════════════════════════════════════════
  const studentCat = await prisma.patronCategory.create({
    data: {
      code: 'STUDENT',
      name: 'Undergraduate Student',
      maxLoanCount: 5,
      loanPeriodDays: 14,
      fineRatePerDay: 500,
      gracePeriodDays: 1,
    },
  });

  const facultyCat = await prisma.patronCategory.create({
    data: {
      code: 'FACULTY',
      name: 'Faculty & Researchers',
      maxLoanCount: 15,
      loanPeriodDays: 30,
      fineRatePerDay: 250,
      gracePeriodDays: 3,
    },
  });

  const generalCat = await prisma.patronCategory.create({
    data: {
      code: 'GENERAL',
      name: 'General Public',
      maxLoanCount: 3,
      loanPeriodDays: 7,
      fineRatePerDay: 1000,
      gracePeriodDays: 0,
    },
  });

  // ══════════════════════════════════════════════════════════
  // 2. USERS (Staff + Patrons)
  // ══════════════════════════════════════════════════════════
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@library.edu',
      name: 'Eleanor Vance (Chief Librarian)',
      role: 'ADMIN',
      barcode: 'STAFF-001',
      phone: '+95-9-555-0192',
      address: 'Central Campus Library Office 101',
    },
  });

  const staffUser = await prisma.user.create({
    data: {
      email: 'staff@library.edu',
      name: 'Marcus Webb',
      role: 'STAFF',
      barcode: 'STAFF-002',
      phone: '+95-9-555-0284',
      address: 'Circulation Desk, Main Library',
    },
  });

  const studentUser = await prisma.user.create({
    data: {
      email: 'alex.rivera@student.edu',
      name: 'Alex Rivera',
      role: 'PATRON',
      barcode: 'PAT-88401',
      categoryId: studentCat.id,
      phone: '+95-9-555-4410',
      address: 'Dormitory B, Room 304',
    },
  });

  const facultyUser = await prisma.user.create({
    data: {
      email: 'dr.chen@university.edu',
      name: 'Dr. Sarah Chen',
      role: 'PATRON',
      barcode: 'PAT-90022',
      categoryId: facultyCat.id,
      phone: '+95-9-555-8822',
      address: 'Department of Computer Science',
    },
  });

  const patron3 = await prisma.user.create({
    data: {
      email: 'kyaw.zin@student.edu',
      name: 'Kyaw Zin Htet',
      role: 'PATRON',
      barcode: 'PAT-88520',
      categoryId: studentCat.id,
      phone: '+95-9-555-6631',
      address: 'Dormitory A, Room 112',
    },
  });

  const patron4 = await prisma.user.create({
    data: {
      email: 'su.myat@student.edu',
      name: 'Su Myat Noe',
      role: 'PATRON',
      barcode: 'PAT-88533',
      categoryId: studentCat.id,
      phone: '+95-9-555-7742',
      address: 'Dormitory C, Room 208',
    },
  });

  const patron5 = await prisma.user.create({
    data: {
      email: 'james.wilson@public.edu',
      name: 'James Wilson',
      role: 'PATRON',
      barcode: 'PAT-92001',
      categoryId: generalCat.id,
      phone: '+95-9-555-1100',
      address: '45 University Avenue, Yangon',
    },
  });

  // ══════════════════════════════════════════════════════════
  // 3. BOOKS — 20 diverse titles
  // ══════════════════════════════════════════════════════════

  // ── Computer Science ─────────────────────────────────────
  const book1 = await prisma.book.create({
    data: {
      isbn: '9780131103627',
      title: 'The C Programming Language',
      author: 'Brian W. Kernighan, Dennis M. Ritchie',
      publisher: 'Prentice Hall',
      publicationYear: 1988,
      genre: 'Computer Science',
      subject: 'Programming / C',
      description: 'The classic authoritative guide to programming in ANSI C, written by the creators of the language.',
      coverUrl: 'https://m.media-amazon.com/images/I/71JN0-CRTFL._SL1500_.jpg',
      language: 'English',
      maxRentDays: 7,
      originalPrice: 35000,
    },
  });

  const book2 = await prisma.book.create({
    data: {
      isbn: '9780262033848',
      title: 'Introduction to Algorithms',
      author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein',
      publisher: 'MIT Press',
      publicationYear: 2009,
      genre: 'Computer Science',
      subject: 'Algorithms & Data Structures',
      description: 'The leading textbook on the design and analysis of computer algorithms, covering a broad range of topics in depth.',
      coverUrl: 'https://m.media-amazon.com/images/I/61ZYjZa7FCL._SL1500_.jpg',
      language: 'English',
      maxRentDays: 14,
      originalPrice: 85000,
    },
  });

  const book3 = await prisma.book.create({
    data: {
      isbn: '9780596517748',
      title: 'JavaScript: The Good Parts',
      author: 'Douglas Crockford',
      publisher: "O'Reilly Media",
      publicationYear: 2008,
      genre: 'Computer Science',
      subject: 'Programming / JavaScript',
      description: 'Unearths the excellence in JavaScript, revealing the truly elegant parts of the language while steering clear of its problematic features.',
      coverUrl: 'https://m.media-amazon.com/images/I/7186YfjgHHL._SL1500_.jpg',
      language: 'English',
      maxRentDays: 7,
      originalPrice: 28000,
    },
  });

  const book4 = await prisma.book.create({
    data: {
      isbn: '9780134685991',
      title: 'Effective Java',
      author: 'Joshua Bloch',
      publisher: 'Addison-Wesley',
      publicationYear: 2018,
      genre: 'Computer Science',
      subject: 'Programming / Java',
      description: 'The definitive guide to Java platform best practices, updated for Java 9, 10, and 11.',
      coverUrl: 'https://m.media-amazon.com/images/I/71JK2xjLyDL._SL1500_.jpg',
      language: 'English',
      maxRentDays: 14,
      originalPrice: 45000,
    },
  });

  const book5 = await prisma.book.create({
    data: {
      isbn: '9780201633610',
      title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
      author: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
      publisher: 'Addison-Wesley',
      publicationYear: 1994,
      genre: 'Computer Science',
      subject: 'Software Engineering',
      description: 'The classic "Gang of Four" book capturing 23 fundamental design patterns for object-oriented software development.',
      coverUrl: 'https://m.media-amazon.com/images/I/51szD9HC9pL._SL1000_.jpg',
      language: 'English',
      maxRentDays: 14,
      originalPrice: 52000,
    },
  });

  // ── Science & Mathematics ────────────────────────────────
  const book6 = await prisma.book.create({
    data: {
      isbn: '9780553380163',
      title: 'A Brief History of Time',
      author: 'Stephen Hawking',
      publisher: 'Bantam Books',
      publicationYear: 1998,
      genre: 'Science',
      subject: 'Physics / Cosmology',
      description: 'Stephen Hawking explores the nature of the universe, from the Big Bang to black holes, in language accessible to all readers.',
      coverUrl: 'https://m.media-amazon.com/images/I/81pOeWnjJLL._SL1500_.jpg',
      language: 'English',
      maxRentDays: 7,
      originalPrice: 18000,
    },
  });

  const book7 = await prisma.book.create({
    data: {
      isbn: '9780393609394',
      title: 'Astrophysics for People in a Hurry',
      author: 'Neil deGrasse Tyson',
      publisher: 'W. W. Norton',
      publicationYear: 2017,
      genre: 'Science',
      subject: 'Physics / Astrophysics',
      description: 'A concise, accessible tour of the universe from one of the most dynamic astrophysicists of our time.',
      coverUrl: 'https://m.media-amazon.com/images/I/71eBQSCH4jL._SL1500_.jpg',
      language: 'English',
      maxRentDays: 7,
      originalPrice: 22000,
    },
  });

  const book8 = await prisma.book.create({
    data: {
      isbn: '9780674979857',
      title: 'The Gene: An Intimate History',
      author: 'Siddhartha Mukherjee',
      publisher: 'Scribner',
      publicationYear: 2016,
      genre: 'Science',
      subject: 'Biology / Genetics',
      description: 'A magnificent history of the gene and a response to the defining question of the future: What becomes of being human when we learn to read and write our own genetic information?',
      coverUrl: 'https://m.media-amazon.com/images/I/81YkxFNNf1L._SL1500_.jpg',
      language: 'English',
      maxRentDays: 14,
      originalPrice: 25000,
    },
  });

  // ── Literature & Fiction ─────────────────────────────────
  const book9 = await prisma.book.create({
    data: {
      isbn: '9780061120084',
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      publisher: 'Harper Perennial',
      publicationYear: 1960,
      genre: 'Fiction',
      subject: 'Literature / American Classics',
      description: 'The unforgettable novel of a childhood in a sleepy Southern town and the crisis of conscience that rocked it.',
      coverUrl: 'https://m.media-amazon.com/images/I/81aY1lxk+9L._SL1500_.jpg',
      language: 'English',
      maxRentDays: 7,
      originalPrice: 15000,
    },
  });

  const book10 = await prisma.book.create({
    data: {
      isbn: '9780451524935',
      title: '1984',
      author: 'George Orwell',
      publisher: 'Signet Classic',
      publicationYear: 1949,
      genre: 'Fiction',
      subject: 'Literature / Dystopian',
      description: 'A startling and haunting novel that creates an imaginary world that is completely convincing — a masterpiece of political satire.',
      coverUrl: 'https://m.media-amazon.com/images/I/71rpa1-kyvL._SL1500_.jpg',
      language: 'English',
      maxRentDays: 7,
      originalPrice: 12000,
    },
  });

  const book11 = await prisma.book.create({
    data: {
      isbn: '9780743273565',
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      publisher: 'Scribner',
      publicationYear: 1925,
      genre: 'Fiction',
      subject: 'Literature / American Classics',
      description: 'The story of the mysteriously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan — a portrait of the Jazz Age in all its decadence.',
      coverUrl: 'https://m.media-amazon.com/images/I/81QuEGw8VPL._SL1500_.jpg',
      language: 'English',
      maxRentDays: 7,
      originalPrice: 13000,
    },
  });

  const book12 = await prisma.book.create({
    data: {
      isbn: '9780141439518',
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      publisher: 'Penguin Classics',
      publicationYear: 1813,
      genre: 'Fiction',
      subject: 'Literature / British Classics',
      description: 'Jane Austen\'s witty comedy of manners follows the Bennet sisters as they navigate love, reputation, and class in Regency-era England.',
      coverUrl: 'https://m.media-amazon.com/images/I/71Q1tPupKjL._SL1500_.jpg',
      language: 'English',
      maxRentDays: 7,
      originalPrice: 11000,
    },
  });

  // ── Business & Economics ─────────────────────────────────
  const book13 = await prisma.book.create({
    data: {
      isbn: '9780062316110',
      title: 'Sapiens: A Brief History of Humankind',
      author: 'Yuval Noah Harari',
      publisher: 'Harper',
      publicationYear: 2015,
      genre: 'Non-Fiction',
      subject: 'History / Anthropology',
      description: 'A groundbreaking narrative of humanity\'s creation and evolution that explores how biology and history have defined us.',
      coverUrl: 'https://m.media-amazon.com/images/I/713jIoMO3UL._SL1500_.jpg',
      language: 'English',
      maxRentDays: 14,
      originalPrice: 28000,
    },
  });

  const book14 = await prisma.book.create({
    data: {
      isbn: '9780307887436',
      title: 'Thinking, Fast and Slow',
      author: 'Daniel Kahneman',
      publisher: 'Farrar, Straus and Giroux',
      publicationYear: 2011,
      genre: 'Non-Fiction',
      subject: 'Psychology / Behavioral Economics',
      description: 'Nobel laureate Daniel Kahneman reveals the two systems that drive the way we think — and how they shape our judgments and decisions.',
      coverUrl: 'https://m.media-amazon.com/images/I/71wvKXWfcML._SL1500_.jpg',
      language: 'English',
      maxRentDays: 14,
      originalPrice: 30000,
    },
  });

  const book15 = await prisma.book.create({
    data: {
      isbn: '9780735211292',
      title: 'Atomic Habits',
      author: 'James Clear',
      publisher: 'Avery',
      publicationYear: 2018,
      genre: 'Non-Fiction',
      subject: 'Self-Help / Productivity',
      description: 'A proven framework for improving every day. Learn how small changes in habits can lead to remarkable results.',
      coverUrl: 'https://m.media-amazon.com/images/I/81ANaVZk5LL._SL1500_.jpg',
      language: 'English',
      maxRentDays: 7,
      originalPrice: 24000,
    },
  });

  // ── Art & Design ─────────────────────────────────────────
  const book16 = await prisma.book.create({
    data: {
      isbn: '9780961392123',
      title: 'The Visual Display of Quantitative Information',
      author: 'Edward R. Tufte',
      publisher: 'Graphics Press',
      publicationYear: 2001,
      genre: 'Art & Design',
      subject: 'Information Design / Data Visualization',
      description: 'The classic book on statistical graphics, charts, tables — theory and practice in the design of data graphics.',
      coverUrl: 'https://m.media-amazon.com/images/I/41b9J5yMYWL._SL1000_.jpg',
      language: 'English',
      maxRentDays: 7,
      originalPrice: 40000,
    },
  });

  // ── Myanmar Studies ──────────────────────────────────────
  const book17 = await prisma.book.create({
    data: {
      isbn: '9780300186529',
      title: 'The River of Lost Footsteps: A Personal History of Burma',
      author: 'Thant Myint-U',
      publisher: 'Farrar, Straus and Giroux',
      publicationYear: 2008,
      genre: 'Non-Fiction',
      subject: 'History / Myanmar Studies',
      description: 'Thant Myint-U weaves a personal narrative through Burma\'s history, from ancient kingdoms to military dictatorship.',
      coverUrl: 'https://m.media-amazon.com/images/I/71r2fVJG2fL._SL1200_.jpg',
      language: 'English',
      maxRentDays: 14,
      originalPrice: 20000,
    },
  });

  const book18 = await prisma.book.create({
    data: {
      isbn: '9780393351361',
      title: 'Where China Meets India: Burma and the New Crossroads of Asia',
      author: 'Thant Myint-U',
      publisher: 'Farrar, Straus and Giroux',
      publicationYear: 2011,
      genre: 'Non-Fiction',
      subject: 'Geopolitics / Southeast Asia',
      description: 'An exploration of the geopolitical frontier where the two Asian giants converge — through Myanmar.',
      coverUrl: 'https://m.media-amazon.com/images/I/81HoSvGr7BL._SL1500_.jpg',
      language: 'English',
      maxRentDays: 14,
      originalPrice: 22000,
    },
  });

  // ── Philosophy ───────────────────────────────────────────
  const book19 = await prisma.book.create({
    data: {
      isbn: '9780140449334',
      title: 'Meditations',
      author: 'Marcus Aurelius (translated by Martin Hammond)',
      publisher: 'Penguin Classics',
      publicationYear: 180,
      genre: 'Philosophy',
      subject: 'Stoicism / Classical Philosophy',
      description: 'The private reflections of the Roman Emperor Marcus Aurelius — a timeless work on duty, virtue, and the nature of existence.',
      coverUrl: 'https://m.media-amazon.com/images/I/71CiiVJPm6L._SL1500_.jpg',
      language: 'English',
      maxRentDays: 7,
      originalPrice: 10000,
    },
  });

  // ── Mathematics ──────────────────────────────────────────
  const book20 = await prisma.book.create({
    data: {
      isbn: '9780521880688',
      title: 'Concrete Mathematics',
      author: 'Ronald L. Graham, Donald E. Knuth, Oren Patashnik',
      publisher: 'Addison-Wesley',
      publicationYear: 1994,
      genre: 'Mathematics',
      subject: 'Discrete Mathematics / Combinatorics',
      description: 'A foundation for computer science that blends continuous and discrete mathematics, co-authored by the legendary Donald Knuth.',
      coverUrl: 'https://m.media-amazon.com/images/I/51HEuOZ5gkL._SL1000_.jpg',
      language: 'English',
      maxRentDays: 14,
      originalPrice: 60000,
    },
  });

  // ── 🇲🇲 Burmese / Myanmar Language Books ─────────────────
  const bookMM1 = await prisma.book.create({
    data: {
      isbn: '9789994400010',
      title: 'သုတ္တနိပါတ် (Sutta Nipāta - မြန်မာဘာသာပြန်)',
      author: 'အရှင်ဇနကာဘိဝံသ',
      publisher: 'ဓမ္မဒါနစာပေတိုက်',
      publicationYear: 2005,
      genre: 'Philosophy',
      subject: 'ဗုဒ္ဓဘာသာ / ပါဠိကျမ်းစာ',
      description: 'ပါဠိတော်မူရင်းနှင့် မြန်မာဘာသာပြန်ဖြင့် ဘုရားရှင်၏ တရားဒေသနာတော်များကို စုစည်းထားသော ကျမ်းစာ။',
      coverUrl: 'https://m.media-amazon.com/images/I/71bNGCxYRBL._SL1200_.jpg',
      language: 'Myanmar',
      maxRentDays: 14,
      originalPrice: 8000,
    },
  });

  const bookMM2 = await prisma.book.create({
    data: {
      isbn: '9789994400027',
      title: 'မြန်မာ့သမိုင်း (History of Myanmar)',
      author: 'ဒေါက်တာ သန်းထွန်း',
      publisher: 'စာရေးဆရာများအသင်း',
      publicationYear: 2012,
      genre: 'Non-Fiction',
      subject: 'သမိုင်း / မြန်မာ့သမိုင်း',
      description: 'ပုဂံခေတ်မှ ယနေ့ခေတ်အထိ မြန်မာနိုင်ငံ၏ သမိုင်းအစဉ်အလာကို အသေးစိတ်ဖော်ပြထားသော စာအုပ်။',
      coverUrl: 'https://m.media-amazon.com/images/I/81iMnSOp-jL._SL1500_.jpg',
      language: 'Myanmar',
      maxRentDays: 14,
      originalPrice: 12000,
    },
  });

  const bookMM3 = await prisma.book.create({
    data: {
      isbn: '9789994400034',
      title: 'ဧရာဝတီမြစ်ကို ချစ်သူများ',
      author: 'မောင်သာယာ (မန္တလေး)',
      publisher: 'ရွှေသံလွင်စာပေ',
      publicationYear: 2018,
      genre: 'Fiction',
      subject: 'မြန်မာဝတ္ထု / စာပေ',
      description: 'ဧရာဝတီမြစ်ကြောင်းတစ်လျှောက် နေထိုင်သူများ၏ ဘဝရုပ်ပုံလွှာကို ဖော်ကျူးထားသော ဝတ္ထုရှည်။',
      coverUrl: 'https://m.media-amazon.com/images/I/71xKfRTcPML._SL1200_.jpg',
      language: 'Myanmar',
      maxRentDays: 7,
      originalPrice: 5000,
    },
  });

  const bookMM4 = await prisma.book.create({
    data: {
      isbn: '9789994400041',
      title: 'စွန့်စားခန်းများ (Adventures in Myanmar)',
      author: 'ဂျာနယ်ကျော်',
      publisher: 'ဝေဇယန္တာ စာအုပ်တိုက်',
      publicationYear: 2015,
      genre: 'Non-Fiction',
      subject: 'ခရီးသွားစာပေ / မြန်မာ',
      description: 'မြန်မာနိုင်ငံအနှံ့ ခရီးသွားမှတ်တမ်းနှင့် ဒေသခံများ၏ ယဉ်ကျေးမှုဓလေ့များကို မှတ်တမ်းတင်ထားခြင်း။',
      coverUrl: 'https://m.media-amazon.com/images/I/81YkxFNNf1L._SL1500_.jpg',
      language: 'Myanmar',
      maxRentDays: 7,
      originalPrice: 6000,
    },
  });

  const bookMM5 = await prisma.book.create({
    data: {
      isbn: '9789994400058',
      title: 'ဇာတိမာန် (National Pride - ကဗျာစုစည်းမှု)',
      author: 'မင်းသု၀ဏ်',
      publisher: 'ပညာရေးဝန်ကြီးဌာန စာပေ',
      publicationYear: 1962,
      genre: 'Poetry',
      subject: 'ကဗျာ / မြန်မာစာပေ',
      description: 'မြန်မာ့လွတ်လပ်ရေးကာလ ကဗျာဆရာကြီး မင်းသု၀ဏ်၏ ဇာတိမာန်ကဗျာများ စုစည်းမှု။',
      coverUrl: 'https://m.media-amazon.com/images/I/71Q1tPupKjL._SL1500_.jpg',
      language: 'Myanmar',
      maxRentDays: 7,
      originalPrice: 3500,
    },
  });

  const bookMM6 = await prisma.book.create({
    data: {
      isbn: '9789994400065',
      title: 'မြန်မာ့ဆေးဖက်ဝင်အပင်များ',
      author: 'ဒေါက်တာ ခင်မောင်ဝင်း',
      publisher: 'ကျန်းမာရေးဝန်ကြီးဌာန',
      publicationYear: 2020,
      genre: 'Science',
      subject: 'ရိုးရာဆေးပညာ / ဆေးဖက်ဝင်အပင်',
      description: 'မြန်မာနိုင်ငံတွင်ပေါက်ရောက်သော ဆေးဖက်ဝင်အပင် ၅၀၀ ကျော်၏ အသုံးပြုနည်းနှင့် ဆေးဖက်ဝင်ပုံများ။',
      coverUrl: 'https://m.media-amazon.com/images/I/81pOeWnjJLL._SL1500_.jpg',
      language: 'Myanmar',
      maxRentDays: 14,
      originalPrice: 15000,
    },
  });

  const bookMM7 = await prisma.book.create({
    data: {
      isbn: '9789994400072',
      title: 'ပင်လုံစာချုပ် နှင့် ပြည်ထောင်စုစိတ်ဓာတ်',
      author: 'သခင်တင်မြ',
      publisher: 'ဂန္ဓမာစာပေ',
      publicationYear: 2010,
      genre: 'Non-Fiction',
      subject: 'နိုင်ငံရေးသမိုင်း / ပြည်ထောင်စု',
      description: '၁၉၄၇ ပင်လုံစာချုပ်၏ သမိုင်းနောက်ခံနှင့် ပြည်ထောင်စုစိတ်ဓာတ်ဖော်ဆောင်မှုကို လေ့လာသုံးသပ်ထားသော စာအုပ်။',
      coverUrl: 'https://m.media-amazon.com/images/I/713jIoMO3UL._SL1500_.jpg',
      language: 'Myanmar',
      maxRentDays: 14,
      originalPrice: 10000,
    },
  });

  const bookMM8 = await prisma.book.create({
    data: {
      isbn: '9789994400089',
      title: 'ကွန်ပျူတာ သိပ္ပံ မိတ်ဆက် (Intro to CS - Myanmar Edition)',
      author: 'ဒေါက်တာ အောင်မြင့်',
      publisher: 'နည်းပညာတက္ကသိုလ် စာပေ',
      publicationYear: 2022,
      genre: 'Computer Science',
      subject: 'ကွန်ပျူတာ သိပ္ပံ / ပရိုဂရမ်းမင်း',
      description: 'မြန်မာဘာသာဖြင့် ရေးသားထားသော ကွန်ပျူတာသိပ္ပံ မိတ်ဆက်စာအုပ်။ Python ပရိုဂရမ်းမင်းလည်း ပါဝင်သည်။',
      coverUrl: 'https://m.media-amazon.com/images/I/51szD9HC9pL._SL1000_.jpg',
      language: 'Myanmar',
      maxRentDays: 14,
      originalPrice: 18000,
    },
  });

  console.log('  ✅ 28 books created (20 English + 8 Myanmar)');

  // ══════════════════════════════════════════════════════════
  // 4. PHYSICAL BOOK COPIES (multiple per book for realism)
  // ══════════════════════════════════════════════════════════
  const allBooks = [book1, book2, book3, book4, book5, book6, book7, book8, book9, book10,
                    book11, book12, book13, book14, book15, book16, book17, book18, book19, book20,
                    bookMM1, bookMM2, bookMM3, bookMM4, bookMM5, bookMM6, bookMM7, bookMM8];

  const locations = [
    'Main Stacks - Floor 1 - Shelf A-01',
    'Main Stacks - Floor 1 - Shelf A-05',
    'Main Stacks - Floor 2 - Shelf B-03',
    'Main Stacks - Floor 2 - Shelf B-12',
    'Main Stacks - Floor 3 - Shelf C-07',
    'Reference Section - Floor 1',
    'Reserve Desk - Floor 1',
    'New Arrivals Display',
    'Reading Room - Floor 2',
    'Special Collections - Floor 3',
  ];

  const conditions: string[] = ['NEW', 'GOOD', 'GOOD', 'GOOD', 'FAIR'];
  const callPrefixes: Record<string, string> = {
    'Computer Science': 'QA76',
    'Science': 'Q',
    'Fiction': 'PS',
    'Non-Fiction': 'HM',
    'Art & Design': 'N',
    'Philosophy': 'B',
    'Mathematics': 'QA',
    'Poetry': 'PR',
  };

  let barcodeCounter = 1001;
  const copyMap: Record<string, any[]> = {};

  for (const book of allBooks) {
    const numCopies = Math.floor(Math.random() * 3) + 1; // 1-3 copies
    const prefix = callPrefixes[book.genre || ''] || 'Z';
    copyMap[book.id] = [];

    for (let i = 0; i < numCopies; i++) {
      const statuses = ['AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'ON_LOAN', 'RESERVED'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const copy = await prisma.bookCopy.create({
        data: {
          bookId: book.id,
          barcode: `BC-${barcodeCounter++}`,
          callNumber: `${prefix}.${Math.floor(Math.random() * 900) + 100}`,
          location: locations[Math.floor(Math.random() * locations.length)],
          status,
          condition: conditions[Math.floor(Math.random() * conditions.length)],
          price: book.originalPrice,
        },
      });
      copyMap[book.id].push(copy);
    }
  }

  console.log('  ✅ Book copies created');

  // ══════════════════════════════════════════════════════════
  // 5. E-RESOURCES
  // ══════════════════════════════════════════════════════════
  const dummyPdf = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

  await prisma.eResource.createMany({
    data: [
      { bookId: book1.id,  title: 'The C Programming Language (Digital Edition)',     author: book1.author,  format: 'PDF',  fileUrl: dummyPdf, isOpenAccess: true },
      { bookId: book6.id,  title: 'A Brief History of Time (Illustrated E-Book)',    author: book6.author,  format: 'EPUB', fileUrl: dummyPdf, isOpenAccess: true },
      { bookId: book9.id,  title: 'To Kill a Mockingbird (Digital Classic)',          author: book9.author,  format: 'PDF',  fileUrl: dummyPdf, isOpenAccess: false, licenseType: 'Multi-User' },
      { bookId: book10.id, title: '1984 (Open Access Edition)',                       author: book10.author, format: 'EPUB', fileUrl: dummyPdf, isOpenAccess: true },
      { bookId: book13.id, title: 'Sapiens: Interactive Digital Edition',             author: book13.author, format: 'PDF',  fileUrl: dummyPdf, isOpenAccess: false, licenseType: 'Perpetual' },
      { bookId: book15.id, title: 'Atomic Habits (Audio Companion PDF)',              author: book15.author, format: 'PDF',  fileUrl: dummyPdf, isOpenAccess: true },
      { bookId: book19.id, title: 'Meditations (Public Domain E-Book)',               author: book19.author, format: 'EPUB', fileUrl: dummyPdf, isOpenAccess: true },
      { bookId: book3.id,  title: 'JavaScript: The Good Parts (Digital Reference)',   author: book3.author,  format: 'PDF',  fileUrl: dummyPdf, isOpenAccess: true },
    ],
  });

  console.log('  ✅ E-Resources created');

  // ══════════════════════════════════════════════════════════
  // 6. LOANS — Active & Returned
  // ══════════════════════════════════════════════════════════

  // Find available copies for loans
  const availableCopies = await prisma.bookCopy.findMany({ where: { status: 'AVAILABLE' }, take: 8 });

  // Active loan — student (overdue)
  const overdueDueDate = new Date();
  overdueDueDate.setDate(overdueDueDate.getDate() - 10);
  if (availableCopies[0]) {
    await prisma.bookCopy.update({ where: { id: availableCopies[0].id }, data: { status: 'ON_LOAN' } });
    const overdueLoan = await prisma.loan.create({
      data: {
        userId: studentUser.id,
        copyId: availableCopies[0].id,
        issuedDate: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000),
        dueDate: overdueDueDate,
        status: 'OVERDUE',
        issuedBy: adminUser.id,
      },
    });

    await prisma.fine.create({
      data: {
        userId: studentUser.id,
        loanId: overdueLoan.id,
        amount: 4500,
        paidAmount: 0,
        reason: 'OVERDUE',
        status: 'UNPAID',
      },
    });
  }

  // Active loan — faculty (due next week)
  if (availableCopies[1]) {
    const dueSoon = new Date();
    dueSoon.setDate(dueSoon.getDate() + 7);
    await prisma.bookCopy.update({ where: { id: availableCopies[1].id }, data: { status: 'ON_LOAN' } });
    await prisma.loan.create({
      data: {
        userId: facultyUser.id,
        copyId: availableCopies[1].id,
        issuedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        dueDate: dueSoon,
        status: 'ISSUED',
        issuedBy: staffUser.id,
      },
    });
  }

  // Active loan — patron3 (due tomorrow)
  if (availableCopies[2]) {
    const dueTomorrow = new Date();
    dueTomorrow.setDate(dueTomorrow.getDate() + 1);
    await prisma.bookCopy.update({ where: { id: availableCopies[2].id }, data: { status: 'ON_LOAN' } });
    await prisma.loan.create({
      data: {
        userId: patron3.id,
        copyId: availableCopies[2].id,
        issuedDate: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
        dueDate: dueTomorrow,
        status: 'ISSUED',
        issuedBy: adminUser.id,
      },
    });
  }

  // Returned loans (history)
  if (availableCopies[3]) {
    await prisma.loan.create({
      data: {
        userId: patron4.id,
        copyId: availableCopies[3].id,
        issuedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000),
        returnedDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
        status: 'RETURNED',
        issuedBy: staffUser.id,
      },
    });
  }

  if (availableCopies[4]) {
    await prisma.loan.create({
      data: {
        userId: patron5.id,
        copyId: availableCopies[4].id,
        issuedDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        returnedDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        status: 'RETURNED',
        issuedBy: adminUser.id,
      },
    });
  }

  console.log('  ✅ Loans & fines created');

  // ══════════════════════════════════════════════════════════
  // 7. HOLDS
  // ══════════════════════════════════════════════════════════
  await prisma.hold.createMany({
    data: [
      { userId: patron3.id, bookId: book2.id, status: 'PENDING' },
      { userId: patron4.id, bookId: book5.id, status: 'PENDING' },
      { userId: studentUser.id, bookId: book13.id, status: 'APPROVED' },
      { userId: patron5.id, bookId: book14.id, status: 'PENDING' },
    ],
  });

  console.log('  ✅ Holds created');

  // ══════════════════════════════════════════════════════════
  // 8. COURSE RESERVES
  // ══════════════════════════════════════════════════════════
  await prisma.courseReserveItem.createMany({
    data: [
      { courseCode: 'CS101', courseName: 'Introduction to Computer Science', instructor: 'Dr. Sarah Chen', bookId: book1.id },
      { courseCode: 'CS101', courseName: 'Introduction to Computer Science', instructor: 'Dr. Sarah Chen', bookId: book3.id },
      { courseCode: 'CS201', courseName: 'Data Structures & Algorithms',    instructor: 'Prof. David Park', bookId: book2.id },
      { courseCode: 'CS301', courseName: 'Software Engineering',            instructor: 'Dr. Lisa Kim',     bookId: book5.id },
      { courseCode: 'LIT110', courseName: 'American Literature Survey',     instructor: 'Prof. Maria Santos', bookId: book9.id },
      { courseCode: 'LIT110', courseName: 'American Literature Survey',     instructor: 'Prof. Maria Santos', bookId: book11.id },
      { courseCode: 'MATH250', courseName: 'Discrete Mathematics',          instructor: 'Dr. Sarah Chen',     bookId: book20.id },
    ],
  });

  console.log('  ✅ Course reserves created');

  // ══════════════════════════════════════════════════════════
  // 9. READING HISTORY
  // ══════════════════════════════════════════════════════════
  await prisma.readingLog.createMany({
    data: [
      { userId: studentUser.id, bookTitle: book1.title,  author: book1.author,  readDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
      { userId: studentUser.id, bookTitle: book3.title,  author: book3.author,  readDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) },
      { userId: studentUser.id, bookTitle: book15.title, author: book15.author, readDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) },
      { userId: facultyUser.id, bookTitle: book2.title,  author: book2.author,  readDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
      { userId: facultyUser.id, bookTitle: book5.title,  author: book5.author,  readDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      { userId: patron3.id,     bookTitle: book9.title,  author: book9.author,  readDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
      { userId: patron4.id,     bookTitle: book10.title, author: book10.author, readDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
    ],
  });

  console.log('  ✅ Reading history created');

  // ══════════════════════════════════════════════════════════
  // 10. VENDORS & PURCHASE ORDERS
  // ══════════════════════════════════════════════════════════
  const vendor1 = await prisma.vendor.create({
    data: {
      name: 'Myanmar Book Centre',
      code: 'MBC-001',
      contactEmail: 'orders@myanmarbooks.com',
      phone: '+95-1-555-2200',
      address: '100 37th Street, Kyauktada, Yangon',
    },
  });

  const vendor2 = await prisma.vendor.create({
    data: {
      name: 'Academic Press International',
      code: 'API-002',
      contactEmail: 'sales@academicpress.com',
      phone: '+1-800-555-0188',
      address: 'New York, NY, USA',
    },
  });

  await prisma.purchaseOrder.createMany({
    data: [
      { orderNumber: 'PO-2025-001', vendorId: vendor1.id, status: 'RECEIVED', totalBudget: 2500000 },
      { orderNumber: 'PO-2025-002', vendorId: vendor2.id, status: 'ORDERED',  totalBudget: 5000000 },
      { orderNumber: 'PO-2025-003', vendorId: vendor1.id, status: 'DRAFT',    totalBudget: 1200000 },
    ],
  });

  console.log('  ✅ Vendors & purchase orders created');

  // ══════════════════════════════════════════════════════════
  // 11. SERIAL SUBSCRIPTIONS
  // ══════════════════════════════════════════════════════════
  await prisma.serialSubscription.createMany({
    data: [
      { title: 'IEEE Transactions on Software Engineering', issn: '0098-5589', frequency: 'MONTHLY', publisher: 'IEEE', active: true },
      { title: 'Nature',                                    issn: '0028-0836', frequency: 'WEEKLY',   publisher: 'Springer Nature', active: true },
      { title: 'The Economist',                             issn: '0013-0613', frequency: 'WEEKLY',   publisher: 'Economist Group', active: true },
      { title: 'ACM Computing Surveys',                     issn: '0360-0300', frequency: 'QUARTERLY', publisher: 'ACM', active: true },
    ],
  });

  console.log('  ✅ Serial subscriptions created');

  // ══════════════════════════════════════════════════════════
  // 12. CIRCULATION RULES
  // ══════════════════════════════════════════════════════════
  await prisma.circulationRule.createMany({
    data: [
      { patronCategory: 'STUDENT', itemType: 'BOOK', maxLoans: 5,  loanDurationDays: 14, finePerDay: 500,  maxFineAmount: 25000, gracePeriodDays: 1 },
      { patronCategory: 'FACULTY', itemType: 'BOOK', maxLoans: 15, loanDurationDays: 30, finePerDay: 250,  maxFineAmount: 15000, gracePeriodDays: 3 },
      { patronCategory: 'GENERAL', itemType: 'BOOK', maxLoans: 3,  loanDurationDays: 7,  finePerDay: 1000, maxFineAmount: 50000, gracePeriodDays: 0 },
    ],
  });

  console.log('  ✅ Circulation rules created');

  // ══════════════════════════════════════════════════════════
  // 13. ILL REQUESTS
  // ══════════════════════════════════════════════════════════
  await prisma.iLLRequest.createMany({
    data: [
      { userId: facultyUser.id, partnerLibrary: 'University of Mandalay Library', bookTitle: 'Advanced Quantum Computing', author: 'John Preskill', status: 'IN_TRANSIT' },
      { userId: studentUser.id, partnerLibrary: 'National Library of Myanmar',     bookTitle: 'Myanmar Traditional Arts',   author: 'U Khin Maung', status: 'PENDING' },
    ],
  });

  console.log('  ✅ ILL requests created');

  // ══════════════════════════════════════════════════════════
  // 14. SAVED LISTS
  // ══════════════════════════════════════════════════════════
  await prisma.savedList.createMany({
    data: [
      { userId: studentUser.id, name: 'CS Semester Reading',  description: 'Essential books for this semester', bookIds: JSON.stringify([book1.id, book2.id, book3.id, book4.id, book5.id]) },
      { userId: facultyUser.id, name: 'Research References',  description: 'Key references for my research',   bookIds: JSON.stringify([book2.id, book5.id, book20.id]) },
      { userId: patron3.id,     name: 'Weekend Reads',        description: 'Fun books for the weekend',         bookIds: JSON.stringify([book9.id, book10.id, book15.id]) },
    ],
  });

  console.log('  ✅ Saved lists created');

  console.log('\n🎉 Skylark Library demo seed complete!');
  console.log('   📚 28 books (20 English + 8 Myanmar) across 9 genres');
  console.log('   👥 7 users (2 staff + 5 patrons)');
  console.log('   📋 Loans, fines, holds, reserves, and more');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
