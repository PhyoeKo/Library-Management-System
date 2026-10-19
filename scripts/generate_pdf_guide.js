const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const puppeteer = require('puppeteer-core');

const DOCS_DIR = path.join(__dirname, '../docs');
const MD_PATH = path.join(DOCS_DIR, 'MOCHT_LMS_User_Training_Guide.md');
const PDF_PATH = path.join(DOCS_DIR, 'MOCHT_LMS_User_Training_Guide.pdf');
const LOGO_PATH = path.join(__dirname, '../public/mocht-logo.png');

async function generatePdf() {
  console.log('Reading Markdown guide from:', MD_PATH);
  const mdContent = fs.readFileSync(MD_PATH, 'utf-8');

  // Convert logo to base64
  let logoBase64 = '';
  if (fs.existsSync(LOGO_PATH)) {
    logoBase64 = `data:image/png;base64,${fs.readFileSync(LOGO_PATH).toString('base64')}`;
  }

  // Configure marked renderer
  const renderer = new marked.Renderer();

  // Transform images to base64 with clean figure cards
  renderer.image = function ({ href, title, text }) {
    let imgSrc = href;
    const cleanHref = href.replace(/^(\.\/|\/)/, '');
    const localImgPath = path.join(DOCS_DIR, cleanHref);

    if (fs.existsSync(localImgPath)) {
      const ext = path.extname(localImgPath).toLowerCase().replace('.', '') || 'png';
      const b64 = fs.readFileSync(localImgPath).toString('base64');
      imgSrc = `data:image/${ext};base64,${b64}`;
    } else {
      console.warn(`Warning: Image not found at ${localImgPath}`);
    }

    return `
      <div class="image-figure">
        <div class="image-wrapper">
          <img src="${imgSrc}" alt="${text || ''}" />
        </div>
        ${text ? `<div class="image-caption">${text}</div>` : ''}
      </div>
    `;
  };

  marked.setOptions({ renderer });
  let htmlBody = marked.parse(mdContent);

  // Replace <hr> with styled section breaks
  htmlBody = htmlBody.replace(/<hr>/g, '<div class="section-divider"></div>');

  // Build the complete styled HTML
  const fullHtml = `<!DOCTYPE html>
<html lang="my">
<head>
  <meta charset="UTF-8">
  <title>MOCHT National Library Management System - User Training Guide</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Myanmar:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

    @page {
      size: A4 portrait;
      margin: 16mm 14mm 16mm 14mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Noto Sans Myanmar', 'Pyidaungsu', 'Myanmar3', 'Padauk', 'Plus Jakarta Sans', system-ui, sans-serif;
      font-size: 10pt;
      line-height: 1.75;
      color: #1e293b;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }

    /* ── Cover Page (Strictly fits 1 single A4 page) ── */
    .cover-page {
      page-break-after: always;
      break-after: page;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 252mm;
      max-height: 252mm;
      text-align: center;
      padding: 20px 24px;
      border: 3px double #047857;
      border-radius: 14px;
      background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 50%, #f8fafc 100%);
      overflow: hidden;
    }

    .cover-logo {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      border: 2.5px solid #d97706;
      box-shadow: 0 8px 20px -4px rgba(217, 119, 6, 0.25);
      margin-bottom: 16px;
      object-fit: cover;
      background: #ffffff;
    }

    .cover-country {
      font-size: 11pt;
      font-weight: 700;
      color: #065f46;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .cover-ministry {
      font-size: 13pt;
      font-weight: 800;
      color: #047857;
      margin-bottom: 16px;
    }

    .cover-title {
      font-size: 20pt;
      font-weight: 900;
      color: #0f172a;
      line-height: 1.35;
      margin: 0 0 8px 0;
      padding: 0 10px;
      border: none !important;
      padding-left: 0 !important;
    }

    .cover-subtitle {
      font-size: 11.5pt;
      font-weight: 600;
      color: #334155;
      max-width: 540px;
      margin: 0 auto 18px auto;
      line-height: 1.5;
    }

    .cover-badge {
      display: inline-block;
      padding: 5px 16px;
      border-radius: 9999px;
      background-color: #047857;
      color: #ffffff;
      font-size: 9pt;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 20px;
      box-shadow: 0 3px 8px rgba(4, 120, 87, 0.2);
    }

    .cover-meta-box {
      width: 100%;
      max-width: 480px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 12px 18px;
      text-align: left;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.04);
    }

    .cover-meta-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 8.5pt;
      border-bottom: 1px dashed #e2e8f0;
    }
    .cover-meta-row:last-child {
      border-bottom: none;
    }
    .cover-meta-label {
      color: #64748b;
      font-weight: 600;
    }
    .cover-meta-val {
      color: #0f172a;
      font-weight: 700;
    }

    /* ── Document Structure ── */
    h1 {
      font-size: 16pt;
      font-weight: 800;
      color: #065f46;
      border-left: 5px solid #047857;
      padding-left: 10px;
      margin-top: 30px;
      margin-bottom: 14px;
      page-break-before: always;
      break-before: page;
    }

    h2 {
      font-size: 13pt;
      font-weight: 800;
      color: #0f172a;
      margin-top: 24px;
      margin-bottom: 10px;
      border-bottom: 1.5px solid #e2e8f0;
      padding-bottom: 4px;
      page-break-after: avoid;
      break-after: avoid;
    }

    h3 {
      font-size: 12pt;
      font-weight: 800;
      color: #047857;
      margin-top: 22px;
      margin-bottom: 8px;
      page-break-after: avoid;
      break-after: avoid;
    }

    h4 {
      font-size: 10pt;
      font-weight: 700;
      color: #334155;
      margin-top: 14px;
      margin-bottom: 6px;
      page-break-after: avoid;
      break-after: avoid;
    }

    p {
      margin-top: 0;
      margin-bottom: 8px;
      orphans: 3;
      widows: 3;
    }

    ul, ol {
      margin-top: 0;
      margin-bottom: 10px;
      padding-left: 22px;
    }

    li {
      margin-bottom: 4px;
    }

    strong {
      font-weight: 700;
      color: #0f172a;
    }

    em {
      color: #475569;
      font-style: italic;
    }

    code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9pt;
      background: #f1f5f9;
      color: #047857;
      padding: 1px 4px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }

    /* ── Tables ── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 9pt;
      page-break-inside: avoid;
      break-inside: avoid;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      overflow: hidden;
    }

    th {
      background: #047857;
      color: #ffffff;
      font-weight: 700;
      padding: 7px 10px;
      text-align: left;
      border: 1px solid #065f46;
    }

    td {
      padding: 7px 10px;
      border: 1px solid #e2e8f0;
      vertical-align: top;
    }

    tr:nth-child(even) td {
      background: #f8fafc;
    }

    /* ── Images & Figures (Zero broken design) ── */
    .image-figure {
      page-break-inside: avoid;
      break-inside: avoid;
      margin: 12px 0 20px 0;
      text-align: center;
    }

    .image-wrapper {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 5px;
      box-shadow: 0 2px 8px -2px rgba(0, 0, 0, 0.08);
      display: inline-block;
      width: 100%;
    }

    .image-wrapper img {
      width: 100%;
      height: auto;
      max-height: 420px;
      object-fit: contain;
      border-radius: 5px;
      display: block;
    }

    .image-caption {
      font-size: 8.5pt;
      font-weight: 600;
      color: #64748b;
      margin-top: 5px;
      font-style: italic;
    }

    .section-divider {
      height: 1px;
      background: #e2e8f0;
      margin: 20px 0;
      border: none;
    }

    /* Callout Card */
    blockquote {
      margin: 12px 0;
      padding: 8px 14px;
      background: #f0fdf4;
      border-left: 4px solid #10b981;
      border-radius: 0 6px 6px 0;
      color: #065f46;
      font-size: 9.5pt;
      page-break-inside: avoid;
      break-inside: avoid;
    }
  </style>
</head>
<body>

  <!-- Cover Page -->
  <div class="cover-page">
    ${logoBase64 ? `<img src="${logoBase64}" class="cover-logo" alt="MOCHT National Seal" />` : ''}
    <div class="cover-country">ပြည်ထောင်စုသမ္မတမြန်မာနိုင်ငံတော်</div>
    <div class="cover-ministry">ဟိုတယ်နှင့်ခရီးသွားလာရေးဝန်ကြီးဌာန</div>
    <h1 class="cover-title">အမျိုးသား ဒစ်ဂျစ်တယ် စာကြည့်တိုက် စီမံခန့်ခွဲမှုစနစ် (LMS)</h1>
    <div class="cover-subtitle">
      အသုံးပြုသူ လေ့ကျင့်ရေးနှင့် လုပ်ငန်းဆောင်ရွက်မှု အဆင့်ဆင့် လက်စွဲလမ်းညွှန်စာအုပ်
    </div>
    <div class="cover-badge">Official User & Administrator Training Manual</div>

    <div class="cover-meta-box">
      <div class="cover-meta-row">
        <span class="cover-meta-label">စနစ်အဆင့် (System Version):</span>
        <span class="cover-meta-val">Version 2.4 (Enterprise Edition)</span>
      </div>
      <div class="cover-meta-row">
        <span class="cover-meta-label">တရားဝင် လွှင့်တင်ထားသော လိပ်စာ:</span>
        <span class="cover-meta-val">http://206.189.47.42:3000</span>
      </div>
      <div class="cover-meta-row">
        <span class="cover-meta-label">အပြည်ပြည်ဆိုင်ရာ စံနှုန်း:</span>
        <span class="cover-meta-val">International Library / MARC21 Standards</span>
      </div>
      <div class="cover-meta-row">
        <span class="cover-meta-label">ဘာသာစကား (Languages):</span>
        <span class="cover-meta-val">မြန်မာဘာသာ (Unicode) & English</span>
      </div>
      <div class="cover-meta-row">
        <span class="cover-meta-label">ထုတ်ဝေသည့် ရက်စွဲ:</span>
        <span class="cover-meta-val">${new Date().toLocaleDateString('my-MM', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>
    </div>
  </div>

  <!-- Content Body -->
  <div class="content">
    ${htmlBody}
  </div>

</body>
</html>`;

  const HTML_PATH = path.join(DOCS_DIR, 'MOCHT_LMS_User_Training_Guide.html');
  fs.writeFileSync(HTML_PATH, fullHtml, 'utf-8');
  console.log(`Saved HTML preview: ${HTML_PATH}`);

  console.log('Launching browser to generate PDF...');
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900']
  });

  const page = await browser.newPage();
  await page.setContent(fullHtml, { waitUntil: 'networkidle0', timeout: 60000 });

  // Ensure all Myanmar Unicode fonts are loaded before printing
  await page.evaluateHandle('document.fonts.ready');

  console.log('Rendering print PDF...');
  await page.pdf({
    path: PDF_PATH,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '16mm',
      bottom: '16mm',
      left: '14mm',
      right: '14mm'
    },
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="font-family: 'Noto Sans Myanmar', sans-serif; font-size: 7.5pt; color: #94a3b8; width: 100%; text-align: right; padding-right: 14mm;">
        MOCHT National Library Management System · အသုံးပြုသူ လမ်းညွှန်
      </div>
    `,
    footerTemplate: `
      <div style="font-family: 'Noto Sans Myanmar', sans-serif; font-size: 7.5pt; color: #94a3b8; width: 100%; display: flex; justify-content: space-between; padding-left: 14mm; padding-right: 14mm;">
        <span>ဟိုတယ်နှင့်ခရီးသွားလာရေးဝန်ကြီးဌာန (MOCHT)</span>
        <span>စာမျက်နှာ <span class="pageNumber"></span> / <span class="totalPages"></span></span>
      </div>
    `
  });

  await browser.close();

  const stats = fs.statSync(PDF_PATH);
  console.log(`✅ PDF successfully generated: ${PDF_PATH} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
}

generatePdf().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
