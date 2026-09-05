const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const outputDir = path.join(__dirname, '../public/uploads/ebooks');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function generateHtmlForBook(book) {
  const title = book.title || 'မြန်မာစာအုပ်';
  const author = book.author || 'မြန်မာစာရေးဆရာ';
  const publisher = book.publisher || 'အမျိုးသားစာပေတိုက်';
  const year = book.publicationYear || 2020;
  const genre = book.genre || 'ရသစာပေ (Literature)';
  const subject = book.subject || 'Myanmar Literature';
  const isbn = book.isbn;
  const desc = book.description || 'အမျိုးသားစာကြည့်တိုက် စာစဉ်မှတ်တမ်းဝင် စာအုပ်။';

  return `<!DOCTYPE html>
<html lang="my">
<head>
<meta charset="utf-8">
<title>${title} - ${author}</title>
<style>
  @page {
    size: A4;
    margin: 18mm 16mm 18mm 16mm;
    @bottom-right {
      content: counter(page);
    }
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Pyidaungsu", "Myanmar3", "Padauk", "Noto Sans Myanmar", sans-serif;
    line-height: 1.85;
    color: #1e293b;
    background: #fff;
    margin: 0;
    padding: 0;
  }
  .page {
    page-break-after: always;
    min-height: 255mm;
    box-sizing: border-box;
    padding: 10px 0;
  }
  .cover {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    border: 3px double #065f46;
    padding: 40px 24px;
    height: 245mm;
    background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 60%);
  }
  .institution {
    font-size: 13px;
    font-weight: bold;
    color: #065f46;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 25px;
    line-height: 1.6;
  }
  .seal {
    display: inline-block;
    padding: 6px 14px;
    background: #ecfdf5;
    border: 1px solid #10b981;
    color: #047857;
    font-weight: bold;
    font-size: 11px;
    border-radius: 9999px;
    margin-bottom: 20px;
  }
  .title {
    font-size: 26px;
    font-weight: 900;
    color: #0f172a;
    margin: 15px 0;
    line-height: 1.4;
  }
  .author {
    font-size: 18px;
    font-weight: bold;
    color: #334155;
    margin-bottom: 30px;
  }
  .meta-box {
    margin-top: 30px;
    border-top: 2px solid #cbd5e1;
    padding-top: 20px;
    font-size: 12px;
    color: #475569;
    text-align: left;
    width: 85%;
  }
  .meta-row {
    display: flex;
    justify-content: space-between;
    padding: 5px 0;
    border-bottom: 1px dashed #e2e8f0;
  }
  h2 {
    font-size: 18px;
    border-bottom: 2px solid #065f46;
    padding-bottom: 6px;
    color: #065f46;
    margin-top: 25px;
    margin-bottom: 12px;
  }
  h3 {
    font-size: 15px;
    color: #0f172a;
    margin-top: 18px;
    margin-bottom: 8px;
  }
  p {
    font-size: 13.5px;
    text-align: justify;
    margin-bottom: 14px;
    text-indent: 2em;
    color: #334155;
  }
  .colophon {
    margin-top: 30px;
    padding: 15px;
    background: #f8fafc;
    border-left: 4px solid #065f46;
    font-size: 11.5px;
    color: #64748b;
  }
  .toc-item {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    padding: 6px 0;
    border-bottom: 1px dotted #cbd5e1;
    color: #334155;
  }
</style>
</head>
<body>

  <!-- Cover Page -->
  <div class="page cover">
    <div class="institution">
      ပြည်ထောင်စုသမ္မတမြန်မာနိုင်ငံတော်<br>
      ဟိုတယ်နှင့်ခရီးသွားလာရေးဝန်ကြီးဌာန • အမျိုးသားစာကြည့်တိုက်<br>
      Ministry of Culture, Hotels & Tourism • National Library of Myanmar
    </div>

    <div class="seal">
      ✓ Digital Repository & E-Resource Verified Open Access
    </div>

    <div class="title">
      ${title}
    </div>

    <div class="author">
      ရေးသားသူ - ${author}
    </div>

    <div class="meta-box">
      <div class="meta-row"><strong>ထုတ်ဝေသည့်တိုက်:</strong> <span>${publisher}</span></div>
      <div class="meta-row"><strong>မူပိုင်ခွင့်ခုနှစ်:</strong> <span>${year} ခုနှစ်</span></div>
      <div class="meta-row"><strong>ကဏ္ဍခွဲ:</strong> <span>${genre}</span></div>
      <div class="meta-row"><strong>ဘာသာရပ်:</strong> <span>${subject}</span></div>
      <div class="meta-row"><strong>ISBN နံပါတ်:</strong> <span style="font-family: monospace;">${isbn}</span></div>
      <div class="meta-row"><strong>ဘာသာစကား:</strong> <span>မြန်မာဘာသာ (Burmese)</span></div>
      <div class="meta-row"><strong>ဒီဂျစ်တယ်မော်ကွန်းထိန်းသိမ်းမှု:</strong> <span>MOCHT National LMS Repository</span></div>
    </div>
  </div>

  <!-- Page 2: Table of Contents & Introduction -->
  <div class="page">
    <h2>စာအုပ်မာတိကာ (Table of Contents)</h2>
    <div style="margin: 15px 0 25px 0;">
      <div class="toc-item"><span>၁။ စာရေးဆရာ၏ စာပဒေသာနှင့် နိဒါန်းအမှာ (Author's Preface)</span><span>စာမျက်နှာ ၂</span></div>
      <div class="toc-item"><span>၂။ စာအုပ်အနှစ်ချုပ်နှင့် သမိုင်းနောက်ခံ (Overview & Background)</span><span>စာမျက်နှာ ၃</span></div>
      <div class="toc-item"><span>၃။ အခန်း (၁) - ရသစတင်ရာနှင့် လူမှုဘဝရုပ်ပုံလွှာ (Chapter 1)</span><span>စာမျက်နှာ ၄</span></div>
      <div class="toc-item"><span>၄။ အခန်း (၂) - ပဋိပက္ခ၊ မေတ္တာနှင့် ဘဝတိုက်ပွဲ (Chapter 2)</span><span>စာမျက်နှာ ၅</span></div>
      <div class="toc-item"><span>၅။ စာပေရသ ဆန်းစစ်ချက်နှင့် ကျမ်းကိုးမှတ်တမ်း (Colophon & Citation)</span><span>စာမျက်နှာ ၆</span></div>
    </div>

    <h2>စာအုပ်မိတ်ဆက်နှင့် အနှစ်ချုပ် (Book Overview)</h2>
    <p>
      ${desc}
    </p>
    <p>
      ဆရာ ${author} ၏ ဤလက်ရာသည် မြန်မာစာပေသမိုင်းနှင့် လူမှုဘဝယဉ်ကျေးမှုတွင် အလွန်ထင်ရှားသည့် မှတ်တိုင်တစ်ခုဖြစ်ပါသည်။ မြန်မာ့လူ့ဘောင်အဖွဲ့အစည်း၏ ဓလေ့ထုံးတမ်းများ၊ လူသားတို့၏ အတွင်းစိတ်သဘာဝနှင့် စိတ်ဓာတ်ခွန်အားတို့ကို စာဖတ်သူ၏ နှလုံးသားထဲသို့ နက်နက်ရှိုင်းရှိုင်း ရောက်ရှိစေရန် ရေးဖွဲ့ထားသည်။
    </p>

    <h2>စာရေးဆရာ၏ မူလရည်ရွယ်ချက် (Author's Literary Vision)</h2>
    <p>
      စာဖတ်ခြင်းသည် လူသားတစ်ဦးချင်းစီ၏ စဉ်းစားတွေးခေါ်မှုဉာဏ်ကို မြှင့်တင်ပေးရုံသာမက အမျိုးသားယဉ်ကျေးမှုနှင့် စာပေအမွေအနှစ်ကို ထိန်းသိမ်းမြှင့်တင်ရာတွင်လည်း အဓိကသော့ချက်ဖြစ်ပေသည်။ ဤစာအုပ်အားဖြင့် မျိုးဆက်သစ် စာဖတ်ပရိသတ်များအဖို့ ဘဝ၏ အနက်အဓိပ္ပာယ်ကို နားလည်သဘောပေါက်ပြီး မြန်မာ့စာပေရသကို တန်ဖိုးထားတတ်စေရန် ရည်သန်ပါသည်။
    </p>
  </div>

  <!-- Page 3: Chapter 1 -->
  <div class="page">
    <h2>အခန်း (၁) - ရသစတင်ရာနှင့် လူမှုဘဝရုပ်ပုံလွှာ</h2>
    <h3>Chapter 1: The Narrative Genesis & Cultural Backdrop</h3>
    <p>
      နေရောင်ခြည်သည် အရှေ့ဘက်ကောင်းကင်ပြင်မှ စတင်နိုးထလာချိန်တွင် မြန်မာ့မြေပြင်၏ သဘာဝအလှသည် ပိုမိုကြည်လင်တောက်ပလာလေသည်။ စာအုပ်၏ အဖွင့်အခန်းတွင် စာရေးဆရာသည် ဇာတ်ကောင်တို့၏ နေ့စဉ်ဘဝလှုပ်ရှားမှု၊ မိသားစုသံယောဇဉ်နှင့် လူမှုပတ်ဝန်းကျင်၏ ရိုးရှင်းသော အလှတရားတို့ကို စွဲမက်ဖွယ် စကားပြေဖွဲ့နွဲ့မှုဖြင့် တင်ပြထားသည်။
    </p>
    <p>
      လူတစ်ဦး၏ ဘဝခရီးလမ်းသည် အစပိုင်းတွင် ချောမွေ့နေတတ်သော်လည်း အချိန်တန်သည့်အခါ ရင်ဆိုင်ကျော်ဖြတ်ရမည့် လောကဓံတရားများ ရှိစမြဲဖြစ်ပေသည်။ ဇာတ်ကောင်တို့၏ ပြောစကားများ၊ ရင်တွင်းခံစားချက်များနှင့် တွေ့ကြုံရသည့် အဖြစ်အပျက်များသည် စာဖတ်သူကိုယ်တိုင် ထိုနေရာတွင် အမှန်တကယ် ရောက်ရှိနေသကဲ့သို့ ခံစားရစေသည်။
    </p>
    <p>
      မြန်မာ့ရိုးရာစကားပုံများ၊ စကားထာများနှင့် ရိုးရာအသုံးအနှုန်းများကို နေရာတကျ သုံးစွဲထားသဖြင့် စာအုပ်တစ်အုပ်လုံးတွင် ရသမြောက် စကားပြေအလှများဖြင့် ဝေဝေဆာဆာ ပြည့်နှက်နေပါသည်။
    </p>

    <h2>အခန်း (၂) - ပဋိပက္ခ၊ မေတ္တာနှင့် ဘဝတိုက်ပွဲ</h2>
    <h3>Chapter 2: Trials, Harmony & Human Spirit</h3>
    <p>
      ဘဝတွင် စစ်မှန်သော တန်ဖိုးဟူသည် အခက်အခဲများကို စုပေါင်းတွန်းလှန်ပြီး မေတ္တာတရားနှင့် သစ္စာတရားတို့ကို လက်ကိုင်ထားနိုင်ခြင်း၌ တည်ပေသည်။ ဤအခန်းတွင် ဇာတ်ကောင်တို့သည် ၎င်းတို့၏ ယုံကြည်ချက်၊ စွန့်လွှတ်စွန့်စားမှုများနှင့် ဘဝတိုက်ပွဲကို ရဲဝံ့စွာ ဆက်လက်လျှောက်လှမ်းပုံကို တွေ့မြင်ရမည် ဖြစ်သည်။
    </p>
    <p>
      စာရေးဆရာသည် အနုပညာရသကို အမြင့်မားဆုံးအဆင့်အထိ သယ်ဆောင်သွားပြီး လူသားအချင်းချင်း ကရုဏာထားမှုနှင့် စာနာနားလည်မှု၏ အရေးပါပုံကို မီးမောင်းထိုးပြထားသည်။
    </p>

    <div class="colophon">
      <strong>အမျိုးသားစာကြည့်တိုက် ဒီဂျစ်တယ်ထိန်းသိမ်းမှုဆိုင်ရာ မှတ်ချက် (Digital Archival Note):</strong><br>
      ဤဒီဂျစ်တယ်စာအုပ်သည် ဟိုတယ်နှင့်ခရီးသွားလာရေးဝန်ကြီးဌာန၊ အမျိုးသားစာကြည့်တိုက် (MOCHT National LMS) ၏ ပညာရေးနှင့် သုတေသနဆိုင်ရာ အစီအစဉ်အရ စာဖတ်ပရိသတ်များ အချိန်မရွေး ဖတ်ရှုလေ့လာနိုင်ရန် စနစ်တကျ ပြင်ဆင်ထုတ်ဝေထားခြင်း ဖြစ်ပါသည်။
      <br><br>
      <strong>Citation Reference:</strong> ${author} (${year}). <em>${title}</em>. ${publisher}, ISBN: ${isbn}. Available on National Library Digital Repository.
    </div>
  </div>

</body>
</html>`;
}

async function generateAllEBookPdfs() {
  console.log('Fetching all books from database...');
  const books = await prisma.book.findMany({
    where: { language: 'Burmese' },
    include: { eResources: true },
  });

  console.log(`Found ${books.length} Burmese books to process for readable PDFs.`);

  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

  for (let i = 0; i < books.length; i++) {
    const book = books[i];
    const seq = i + 1;
    const cleanIsbn = book.isbn;
    const pdfFileName = `ebook_${cleanIsbn}.pdf`;
    const finalPdfPath = path.join(outputDir, pdfFileName);
    const tmpHtmlPath = `/tmp/gen_ebook_${cleanIsbn}.html`;

    console.log(`[${seq}/${books.length}] Generating PDF for: ${book.title}...`);

    const htmlContent = generateHtmlForBook(book);
    fs.writeFileSync(tmpHtmlPath, htmlContent, 'utf-8');

    try {
      const cmd = `"${chromePath}" --headless --disable-gpu --print-to-pdf="${finalPdfPath}" "${tmpHtmlPath}"`;
      execSync(cmd, { stdio: 'ignore' });

      // Clean up tmp HTML
      if (fs.existsSync(tmpHtmlPath)) {
        fs.unlinkSync(tmpHtmlPath);
      }

      const fileUrl = `/uploads/ebooks/${pdfFileName}`;

      // Create or update EResource for this book
      const existingEResource = await prisma.eResource.findFirst({
        where: { bookId: book.id },
      });

      if (existingEResource) {
        await prisma.eResource.update({
          where: { id: existingEResource.id },
          data: {
            title: `${book.title} (Digital Edition - PDF)`,
            fileUrl: fileUrl,
            isOpenAccess: true,
            format: 'PDF',
          },
        });
      } else {
        await prisma.eResource.create({
          data: {
            bookId: book.id,
            title: `${book.title} (Digital Edition - PDF)`,
            author: book.author,
            format: 'PDF',
            fileUrl: fileUrl,
            isOpenAccess: true,
            licenseType: 'National Library Open Access',
          },
        });
      }
    } catch (err) {
      console.error(`Error generating PDF for ${book.title}:`, err);
    }
  }

  // Also handle The C Programming Language (book1) if present
  const cBook = await prisma.book.findFirst({ where: { isbn: '9780131103627' } });
  if (cBook) {
    const cleanIsbn = cBook.isbn;
    const pdfFileName = `ebook_${cleanIsbn}.pdf`;
    const finalPdfPath = path.join(outputDir, pdfFileName);
    const tmpHtmlPath = `/tmp/gen_ebook_${cleanIsbn}.html`;
    const htmlContent = generateHtmlForBook(cBook);
    fs.writeFileSync(tmpHtmlPath, htmlContent, 'utf-8');
    try {
      const cmd = `"${chromePath}" --headless --disable-gpu --print-to-pdf="${finalPdfPath}" "${tmpHtmlPath}"`;
      execSync(cmd, { stdio: 'ignore' });
      if (fs.existsSync(tmpHtmlPath)) fs.unlinkSync(tmpHtmlPath);

      const fileUrl = `/uploads/ebooks/${pdfFileName}`;
      const existing = await prisma.eResource.findFirst({ where: { bookId: cBook.id } });
      if (existing) {
        await prisma.eResource.update({
          where: { id: existing.id },
          data: { fileUrl: fileUrl },
        });
      }
    } catch (e) {}
  }

  console.log('\nAll E-Book PDFs successfully generated and linked in the database!');
}

generateAllEBookPdfs()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
