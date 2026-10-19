const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const DOCS_DIR = path.join(__dirname, '../docs');
const MD_PATH = path.join(DOCS_DIR, 'MOCHT_LMS_User_Training_Guide.md');
const NETLIFY_DIR = path.join(DOCS_DIR, 'netlify-site');
const OUTPUT_HTML = path.join(NETLIFY_DIR, 'index.html');

function buildNetlifySite() {
  console.log('Building Netlify documentation site...');
  const md = fs.readFileSync(MD_PATH, 'utf-8');

  // Configure marked renderer
  const renderer = new marked.Renderer();

  // Rewrite image paths to images/... and add lightbox triggers
  renderer.image = function ({ href, title, text }) {
    const filename = path.basename(href);
    const imgSrc = `images/${filename}`;

    return `
      <figure class="feature-image-figure">
        <div class="image-card" onclick="openLightbox('${imgSrc}', '${text ? text.replace(/'/g, "\\'") : ''}')" title="Click to view full image">
          <img src="${imgSrc}" alt="${text || ''}" loading="lazy" />
          <div class="image-overlay">
            <span class="zoom-badge">🔍 ပုံကြီးချဲ့ကြည့်ရန် (Click to Zoom)</span>
          </div>
        </div>
        ${text ? `<figcaption class="image-caption">${text}</figcaption>` : ''}
      </figure>
    `;
  };

  // Add IDs and anchors to headings for scrollspy & sidebar linking
  let sectionIdx = 0;
  renderer.heading = function ({ text, depth }) {
    sectionIdx++;
    let id = `section-${sectionIdx}`;

    // Detect feature numbers
    const featMatch = text.match(/လုပ်ဆောင်ချက်\s+([၀-၉0-9]+)/);
    if (featMatch) {
      const numMap = { '၁': 1, '၂': 2, '၃': 3, '၄': 4, '၅': 5, '၆': 6, '၇': 7, '၈': 8, '၉': 9, '၁၀': 10, '၁၁': 11, '၁၂': 12, '၁၃': 13, '၁၄': 14, '၁၅': 15, '၁၆': 16, '၁၇': 17, '၁၈': 18, '၁၉': 19, '၂၀': 20, '၂၁': 21, '၂၂': 22, '၂၃': 23 };
      const n = numMap[featMatch[1]] || featMatch[1];
      id = `feature-${n}`;
    } else if (text.includes('အပိုင်း (၁)')) {
      id = 'part-1';
    } else if (text.includes('အပိုင်း (၂)')) {
      id = 'part-2';
    } else if (text.includes('အပိုင်း (၃)')) {
      id = 'part-3';
    } else if (text.includes('အပိုင်း (၄)')) {
      id = 'part-4';
    } else if (text.includes('အပိုင်း (၅)')) {
      id = 'part-5';
    } else if (text.includes('မာတိကာ')) {
      id = 'toc-section';
    } else if (text.includes('စနစ်ဆိုင်ရာ အချက်အလက်များ')) {
      id = 'overview-section';
    }

    if (depth === 1) {
      return `<h1 id="${id}" class="guide-h1">${text}</h1>`;
    } else if (depth === 2) {
      return `<h2 id="${id}" class="guide-h2">${text}</h2>`;
    } else if (depth === 3) {
      return `<h3 id="${id}" class="guide-h3"><span class="h3-anchor"></span>${text}</h3>`;
    } else {
      return `<h${depth} id="${id}" class="guide-h${depth}">${text}</h${depth}>`;
    }
  };

  marked.setOptions({ renderer });
  let htmlContent = marked.parse(md);

  // Replace <hr> with dividers
  htmlContent = htmlContent.replace(/<hr>/g, '<div class="content-divider"></div>');

  // Sidebar navigation data
  const navItems = [
    {
      group: 'စနစ်မိတ်ဆက် (Introduction)',
      items: [
        { id: 'overview-section', label: 'စနစ်ဆိုင်ရာ အချက်အလက်များ' },
        { id: 'toc-section', label: 'မာတိကာ' },
      ],
    },
    {
      group: 'အပိုင်း (၁) - အများပြည်သူနှင့် စာဖတ်သူ (Patron)',
      items: [
        { id: 'feature-1', label: '၁။ အများပြည်သူသုံး စာအုပ်ရှာဖွေရေး' },
        { id: 'feature-2', label: '၂။ ဝဘ်ဘရောင်ဇာတွင်း E-Book ဖတ်စနစ်' },
        { id: 'feature-3', label: '၃။ စနစ်သို့ အကောင့်ဝင်ရောက်ခြင်း' },
        { id: 'feature-4', label: '၄။ စာဖတ်သူ အသင်းဝင် ပေါ်တယ်' },
      ],
    },
    {
      group: 'အပိုင်း (၂) - စာကြည့်တိုက်မှူးနှင့် ဝန်ထမ်း (Staff)',
      items: [
        { id: 'feature-5', label: '၅။ စာကြည့်တိုက် ကွပ်ကဲမှု ဒက်ရှ်ဘုတ်' },
        { id: 'feature-6', label: '၆။ စာအုပ်စာရင်းနှင့် ကတ်တလောက်' },
        { id: 'feature-7', label: '၇။ စာအုပ်အသစ်နှင့် ဒဏ်ကြေးနှုန်း' },
        { id: 'feature-8', label: '၈။ စာအုပ်ကဏ္ဍခွဲများ (Categories)' },
        { id: 'feature-9', label: '၉။ စာအုပ်ငှား/ပြန်ကောင်တာ (VIP +7d)' },
        { id: 'feature-10', label: '၁၀။ ဦးစားပေး ကြိုတင်မှာယူမှု (Holds)' },
        { id: 'feature-11', label: '၁၁။ အသင်းဝင်များနှင့် မှတ်ပုံတင် (NRC)' },
        { id: 'feature-12', label: '၁၂။ VIP အသင်းဝင်ကတ်ပြား (PNG Export)' },
        { id: 'feature-13', label: '၁၃။ ဒဏ်ကြေးစာရင်းနှင့် ကောက်ခံခြင်း' },
      ],
    },
    {
      group: 'အပိုင်း (၃) - အစီရင်ခံစာနှင့် စာရင်းဇယား (Reports)',
      items: [
        { id: 'feature-14', label: '၁၄။ စွမ်းဆောင်ရည် အနှစ်ချုပ် & Filter' },
        { id: 'feature-15', label: '၁၅။ ငှားရမ်းမှုမှတ်တမ်း CSV' },
        { id: 'feature-16', label: '၁၆။ ဒဏ်ကြေးငွေစာရင်း CSV' },
        { id: 'feature-17', label: '၁၇။ စာအုပ်လက်ကျန်စာရင်း CSV' },
        { id: 'feature-18', label: '၁၈။ အသင်းဝင်များနှင့် VIP စာရင်း CSV' },
        { id: 'feature-19', label: '၁၉။ ရက်ကျော်လွန်စာအုပ်များ CSV' },
      ],
    },
    {
      group: 'အပိုင်း (၄) - အဆင့်မြင့် စာကြည့်တိုက် ဝန်ဆောင်မှုများ (Enterprise)',
      items: [
        { id: 'feature-20', label: '၂၀။ စာအုပ်ဝယ်ယူမှု (Acquisitions)' },
        { id: 'feature-21', label: '၂၁။ ဂျာနယ်နှင့် မဂ္ဂဇင်း (Serials)' },
        { id: 'feature-22', label: '၂၂။ စာကြည့်တိုက်ချင်း ချိတ်ဆက်မှု (ILL)' },
        { id: 'feature-23', label: '၂၃။ သင်ရိုးညွှန်းတမ်း (Course Reserves)' },
      ],
    },
    {
      group: 'အပိုင်း (၅) - လုပ်ငန်းလမ်းညွှန်နှင့် မေးခွန်းများ',
      items: [
        { id: 'part-5', label: 'နေ့စဉ် လုပ်ငန်းလမ်းညွှန် (SOP) & FAQ' },
      ],
    },
  ];

  // Render Sidebar HTML
  const sidebarHtml = navItems
    .map(
      (grp) => `
    <div class="nav-group">
      <div class="nav-group-title">${grp.group}</div>
      <div class="nav-group-items">
        ${grp.items
          .map(
            (it) => `
          <a href="#${it.id}" class="nav-item-link" data-target="${it.id}">
            <span class="nav-dot"></span>
            <span class="nav-text">${it.label}</span>
          </a>
        `
          )
          .join('')}
      </div>
    </div>
  `
    )
    .join('');

  // Complete HTML template
  const fullHtml = `<!DOCTYPE html>
<html lang="my" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ဟိုတယ်နှင့်ခရီးသွားလာရေးဝန်ကြီးဌာန (MOCHT) · အမျိုးသား ဒစ်ဂျစ်တယ် စာကြည့်တိုက် စီမံခန့်ခွဲမှုစနစ် (LMS) - အသုံးပြုသူ လမ်းညွှန်</title>
  <link rel="icon" type="image/png" href="images/mocht-logo.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Myanmar:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">

  <style>
    :root {
      --primary: #047857;
      --primary-dark: #065f46;
      --primary-light: #10b981;
      --primary-subtle: #f0fdf4;
      --accent: #d97706;
      --accent-light: #fef3c7;
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --sidebar-bg: #ffffff;
      --text: #0f172a;
      --text-muted: #64748b;
      --border: #e2e8f0;
      --code-bg: #f1f5f9;
      --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
      --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04);
      --font-body: 'Noto Sans Myanmar', 'Pyidaungsu', 'Plus Jakarta Sans', system-ui, sans-serif;
    }

    [data-theme="dark"] {
      --primary: #10b981;
      --primary-dark: #059669;
      --primary-light: #34d399;
      --primary-subtle: #064e3b33;
      --accent: #f59e0b;
      --accent-light: #78350f33;
      --bg: #090d16;
      --card-bg: #111827;
      --sidebar-bg: #0f172a;
      --text: #f1f5f9;
      --text-muted: #94a3b8;
      --border: #1e293b;
      --code-bg: #1e293b;
      --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
      --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.4);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html {
      scroll-behavior: smooth;
      font-size: 15px;
    }

    body {
      font-family: var(--font-body);
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.85;
      -webkit-font-smoothing: antialiased;
      transition: background-color 0.25s ease, color 0.25s ease;
    }

    /* ── Sticky Top Header ── */
    .top-header {
      position: sticky;
      top: 0;
      z-index: 50;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 64px;
      padding: 0 24px;
      background: var(--card-bg);
      border-bottom: 1px solid var(--border);
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      backdrop-filter: blur(12px);
    }

    .header-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: var(--text);
    }

    .header-logo {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 2px solid var(--accent);
      object-fit: cover;
      background: #ffffff;
    }

    .header-title-box {
      display: flex;
      flex-direction: column;
    }

    .header-maintitle {
      font-size: 1.05rem;
      font-weight: 800;
      color: var(--primary);
      letter-spacing: -0.2px;
      line-height: 1.2;
    }

    .header-subtitle {
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--text-muted);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .search-box {
      position: relative;
      display: none;
    }
    @media (min-width: 768px) {
      .search-box {
        display: block;
      }
    }

    .search-input {
      width: 220px;
      height: 36px;
      padding: 0 12px 0 34px;
      background: var(--code-bg);
      border: 1px solid var(--border);
      border-radius: 10px;
      font-size: 0.8rem;
      color: var(--text);
      outline: none;
      transition: all 0.2s ease;
    }
    .search-input:focus {
      width: 280px;
      border-color: var(--primary);
      background: var(--card-bg);
      box-shadow: 0 0 0 3px var(--primary-subtle);
    }

    .search-icon {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .btn-pdf {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 16px;
      background: var(--primary);
      color: #ffffff;
      font-size: 0.82rem;
      font-weight: 700;
      border-radius: 10px;
      text-decoration: none;
      box-shadow: 0 2px 6px rgba(4, 120, 87, 0.25);
      transition: all 0.2s ease;
    }
    .btn-pdf:hover {
      background: var(--primary-dark);
      transform: translateY(-1px);
      box-shadow: 0 4px 10px rgba(4, 120, 87, 0.35);
    }

    .btn-live {
      display: none;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      background: var(--code-bg);
      border: 1px solid var(--border);
      color: var(--text);
      font-size: 0.82rem;
      font-weight: 700;
      border-radius: 10px;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    @media (min-width: 640px) {
      .btn-live {
        display: inline-flex;
      }
    }
    .btn-live:hover {
      border-color: var(--primary);
      color: var(--primary);
    }

    .theme-toggle-btn {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      border: 1px solid var(--border);
      background: var(--code-bg);
      color: var(--text);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      transition: all 0.2s ease;
    }
    .theme-toggle-btn:hover {
      border-color: var(--primary);
    }

    .menu-toggle-btn {
      display: flex;
      width: 36px;
      height: 36px;
      border-radius: 10px;
      border: 1px solid var(--border);
      background: var(--code-bg);
      color: var(--text);
      cursor: pointer;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
    }
    @media (min-width: 1024px) {
      .menu-toggle-btn {
        display: none;
      }
    }

    /* ── Main Layout (Sidebar + Content) ── */
    .app-layout {
      display: flex;
      max-width: 1520px;
      margin: 0 auto;
      min-height: calc(100vh - 64px);
    }

    /* ── Sidebar ── */
    .sidebar {
      position: sticky;
      top: 64px;
      width: 310px;
      height: calc(100vh - 64px);
      overflow-y: auto;
      background: var(--sidebar-bg);
      border-right: 1px solid var(--border);
      padding: 24px 16px 40px 16px;
      flex-shrink: 0;
      transition: transform 0.3s ease;
    }

    @media (max-width: 1023px) {
      .sidebar {
        position: fixed;
        left: 0;
        top: 64px;
        bottom: 0;
        z-index: 45;
        transform: translateX(-100%);
        box-shadow: 10px 0 25px rgba(0, 0, 0, 0.15);
      }
      .sidebar.open {
        transform: translateX(0);
      }
    }

    .sidebar-overlay {
      display: none;
      position: fixed;
      inset: 0;
      top: 64px;
      background: rgba(0, 0, 0, 0.4);
      z-index: 40;
      backdrop-filter: blur(2px);
    }
    .sidebar-overlay.active {
      display: block;
    }

    .nav-group {
      margin-bottom: 20px;
    }

    .nav-group-title {
      font-size: 0.72rem;
      font-weight: 800;
      color: var(--primary);
      text-transform: uppercase;
      letter-spacing: 0.6px;
      margin-bottom: 8px;
      padding: 0 10px;
    }

    .nav-group-items {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .nav-item-link {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 7px 10px;
      border-radius: 8px;
      font-size: 0.84rem;
      font-weight: 600;
      color: var(--text-muted);
      text-decoration: none;
      transition: all 0.15s ease;
      line-height: 1.4;
    }

    .nav-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--border);
      flex-shrink: 0;
      transition: all 0.15s ease;
    }

    .nav-item-link:hover {
      color: var(--text);
      background: var(--code-bg);
    }

    .nav-item-link.active {
      color: var(--primary);
      background: var(--primary-subtle);
      font-weight: 700;
    }
    .nav-item-link.active .nav-dot {
      background: var(--primary);
      transform: scale(1.3);
    }

    /* ── Main Content Area ── */
    .content-area {
      flex: 1;
      min-width: 0;
      padding: 32px 24px 80px 24px;
      max-width: 980px;
      margin: 0 auto;
    }
    @media (min-width: 768px) {
      .content-area {
        padding: 40px 48px 100px 48px;
      }
    }

    /* ── Hero Banner ── */
    .hero-banner {
      background: linear-gradient(135deg, var(--card-bg) 0%, var(--primary-subtle) 100%);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 36px 28px;
      margin-bottom: 40px;
      box-shadow: var(--shadow);
      text-align: center;
      position: relative;
      overflow: hidden;
    }

    .hero-seal {
      width: 88px;
      height: 88px;
      border-radius: 50%;
      border: 3px solid var(--accent);
      margin-bottom: 16px;
      box-shadow: 0 6px 16px rgba(217, 119, 6, 0.2);
      object-fit: cover;
      background: #ffffff;
    }

    .hero-country {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--primary-dark);
      margin-bottom: 4px;
    }

    .hero-ministry {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--primary);
      margin-bottom: 14px;
    }

    .hero-title {
      font-size: 1.95rem;
      font-weight: 900;
      color: var(--text);
      line-height: 1.35;
      margin-bottom: 12px;
      letter-spacing: -0.5px;
    }
    @media (min-width: 768px) {
      .hero-title {
        font-size: 2.35rem;
      }
    }

    .hero-desc {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-muted);
      max-width: 680px;
      margin: 0 auto 24px auto;
      line-height: 1.6;
    }

    .hero-chips {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
      margin-bottom: 24px;
    }

    .chip {
      padding: 4px 12px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 9999px;
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--text-muted);
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    }
    .chip.highlight {
      background: var(--primary);
      border-color: var(--primary);
      color: #ffffff;
    }

    .hero-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 12px;
    }

    .btn-hero-primary {
      padding: 10px 22px;
      background: var(--primary);
      color: #ffffff;
      font-size: 0.9rem;
      font-weight: 800;
      border-radius: 12px;
      text-decoration: none;
      box-shadow: 0 4px 12px rgba(4, 120, 87, 0.3);
      transition: all 0.2s ease;
    }
    .btn-hero-primary:hover {
      background: var(--primary-dark);
      transform: translateY(-2px);
    }

    .btn-hero-outline {
      padding: 10px 20px;
      background: var(--card-bg);
      border: 1.5px solid var(--border);
      color: var(--text);
      font-size: 0.9rem;
      font-weight: 700;
      border-radius: 12px;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    .btn-hero-outline:hover {
      border-color: var(--primary);
      color: var(--primary);
    }

    /* ── Typography & Content ── */
    .guide-h1 {
      font-size: 1.65rem;
      font-weight: 850;
      color: var(--primary);
      border-left: 5px solid var(--primary);
      padding-left: 14px;
      margin: 48px 0 20px 0;
      line-height: 1.35;
    }

    .guide-h2 {
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--text);
      margin: 36px 0 16px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid var(--border);
    }

    .guide-h3 {
      font-size: 1.18rem;
      font-weight: 800;
      color: var(--primary-dark);
      margin: 32px 0 12px 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .h3-anchor {
      display: inline-block;
      width: 4px;
      height: 16px;
      border-radius: 2px;
      background: var(--primary);
    }

    .guide-h4 {
      font-size: 0.98rem;
      font-weight: 750;
      color: var(--text);
      margin: 20px 0 10px 0;
    }

    p {
      margin-bottom: 14px;
      font-size: 0.98rem;
      color: var(--text);
    }

    ul, ol {
      margin-bottom: 16px;
      padding-left: 26px;
    }

    li {
      margin-bottom: 8px;
      font-size: 0.96rem;
    }

    strong {
      font-weight: 750;
      color: var(--text);
    }

    code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.86rem;
      background: var(--code-bg);
      color: var(--primary);
      padding: 2px 6px;
      border-radius: 6px;
      border: 1px solid var(--border);
    }

    .content-divider {
      height: 1px;
      background: var(--border);
      margin: 40px 0;
    }

    /* ── Table Styling ── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 0.88rem;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: var(--shadow);
    }

    th {
      background: var(--primary);
      color: #ffffff;
      font-weight: 750;
      padding: 10px 14px;
      text-align: left;
    }

    td {
      padding: 10px 14px;
      border-top: 1px solid var(--border);
      color: var(--text);
    }

    tr:nth-child(even) td {
      background: var(--code-bg);
    }

    /* ── Image & Lightbox ── */
    .feature-image-figure {
      margin: 24px 0 32px 0;
    }

    .image-card {
      position: relative;
      background: var(--card-bg);
      border: 1.5px solid var(--border);
      border-radius: 14px;
      padding: 8px;
      box-shadow: var(--shadow-lg);
      overflow: hidden;
      cursor: zoom-in;
      transition: all 0.25s ease;
    }

    .image-card:hover {
      border-color: var(--primary);
      transform: translateY(-2px);
      box-shadow: 0 14px 25px -4px rgba(0, 0, 0, 0.12);
    }

    .image-card img {
      width: 100%;
      height: auto;
      max-height: 520px;
      object-fit: contain;
      border-radius: 8px;
      display: block;
    }

    .image-overlay {
      position: absolute;
      inset: 8px;
      background: rgba(4, 120, 87, 0.45);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    .image-card:hover .image-overlay {
      opacity: 1;
    }

    .zoom-badge {
      background: #ffffff;
      color: var(--primary-dark);
      font-size: 0.82rem;
      font-weight: 800;
      padding: 6px 16px;
      border-radius: 9999px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }

    .image-caption {
      text-align: center;
      font-size: 0.84rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-top: 8px;
      font-style: italic;
    }

    /* ── Lightbox Modal ── */
    .lightbox-modal {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 100;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(8px);
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .lightbox-modal.active {
      display: flex;
    }

    .lightbox-content {
      max-width: 95vw;
      max-height: 90vh;
      position: relative;
    }

    .lightbox-img {
      max-width: 100%;
      max-height: 85vh;
      object-fit: contain;
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
    }

    .lightbox-caption {
      color: #ffffff;
      text-align: center;
      font-size: 0.9rem;
      font-weight: 600;
      margin-top: 10px;
    }

    .lightbox-close {
      position: absolute;
      top: -42px;
      right: 0;
      color: #ffffff;
      font-size: 1.8rem;
      font-weight: 700;
      cursor: pointer;
      background: rgba(255, 255, 255, 0.15);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s ease;
    }
    .lightbox-close:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    /* ── Floating Back to Top ── */
    .back-to-top {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--primary);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      cursor: pointer;
      border: none;
      box-shadow: var(--shadow-lg);
      opacity: 0;
      visibility: hidden;
      transition: all 0.25s ease;
      z-index: 30;
    }
    .back-to-top.visible {
      opacity: 1;
      visibility: visible;
    }
    .back-to-top:hover {
      background: var(--primary-dark);
      transform: translateY(-3px);
    }

    /* ── Footer ── */
    .site-footer {
      border-top: 1px solid var(--border);
      background: var(--card-bg);
      padding: 30px 24px;
      text-align: center;
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-top: 60px;
    }
  </style>
</head>
<body>

  <!-- Sticky Top Header -->
  <header class="top-header">
    <div style="display: flex; align-items: center; gap: 10px;">
      <button class="menu-toggle-btn" id="menuToggle" aria-label="Toggle navigation">☰</button>
      <a href="#" class="header-brand">
        <img src="images/mocht-logo.png" alt="MOCHT National Seal" class="header-logo" />
        <div class="header-title-box">
          <span class="header-maintitle">MOCHT National LMS</span>
          <span class="header-subtitle">အသုံးပြုသူ လမ်းညွှန်လက်စွဲ</span>
        </div>
      </a>
    </div>

    <div class="header-actions">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input type="text" class="search-input" id="topicSearch" placeholder="အကြောင်းအရာ ရှာပါ..." />
      </div>

      <a href="MOCHT_LMS_User_Training_Guide.pdf" class="btn-pdf" download="MOCHT_LMS_User_Training_Guide.pdf">
        <span>📥 PDF ဒေါင်းလုဒ် (31 Pages)</span>
      </a>

      <a href="http://206.189.47.42:3000" target="_blank" rel="noopener noreferrer" class="btn-live">
        <span>🌐 Live စနစ် ဖွင့်ရန်</span>
      </a>

      <button class="theme-toggle-btn" id="themeToggle" title="Toggle dark/light theme">🌙</button>
    </div>
  </header>

  <div class="app-layout">
    <!-- Sidebar Overlay for mobile -->
    <div class="sidebar-overlay" id="sidebarOverlay"></div>

    <!-- Sidebar Navigation -->
    <aside class="sidebar" id="sidebar">
      ${sidebarHtml}
    </aside>

    <!-- Main Content Area -->
    <main class="content-area">
      <!-- Hero Banner -->
      <section class="hero-banner">
        <img src="images/mocht-logo.png" alt="MOCHT National Seal" class="hero-seal" />
        <div class="hero-country">ပြည်ထောင်စုသမ္မတမြန်မာနိုင်ငံတော်</div>
        <div class="hero-ministry">ဟိုတယ်နှင့်ခရီးသွားလာရေးဝန်ကြီးဌာန</div>
        <h1 class="hero-title">အမျိုးသား ဒစ်ဂျစ်တယ် စာကြည့်တိုက် စီမံခန့်ခွဲမှုစနစ် (LMS)</h1>
        <p class="hero-desc">
          အသုံးပြုသူ လေ့ကျင့်ရေးနှင့် စနစ်အသုံးပြုနည်း ပြည့်စုံသော လက်စွဲလမ်းညွှန်စာအုပ် — အများပြည်သူသုံး OPAC မှသည် စာကြည့်တိုက်မှူးများအတွက် အဆင့်မြင့် စာကြည့်တိုက် ဝန်ဆောင်မှုများနှင့် စာရင်းဇယားများအထိ အပြည့်အစုံ။
        </p>

        <div class="hero-chips">
          <span class="chip highlight">Version 2.4 Enterprise</span>
          <span class="chip">International Standards</span>
          <span class="chip">မြန်မာဘာသာ (Unicode)</span>
          <span class="chip">Live Production Ready</span>
          <span class="chip">31-Page PDF Included</span>
        </div>

        <div class="hero-actions">
          <a href="#feature-1" class="btn-hero-primary">📚 စတင်လေ့လာမည်</a>
          <a href="MOCHT_LMS_User_Training_Guide.pdf" class="btn-hero-outline" download="MOCHT_LMS_User_Training_Guide.pdf">📥 PDF ဖိုင် ဒေါင်းလုဒ်ယူမည် (6 MB)</a>
        </div>
      </section>

      <!-- Markdown Parsed Content -->
      <article class="guide-body">
        ${htmlContent}
      </article>

      <!-- Footer -->
      <footer class="site-footer">
        <p><strong>ဟိုတယ်နှင့်ခရီးသွားလာရေးဝန်ကြီးဌာန (MOCHT)</strong> · အမျိုးသား ဒစ်ဂျစ်တယ် စာကြည့်တိုက် စီမံခန့်ခွဲမှုစနစ်</p>
        <p style="margin-top: 6px; font-size: 0.78rem;">National Library Management System · Comprehensive User Training Guide</p>
      </footer>
    </main>
  </div>

  <!-- Lightbox Modal -->
  <div class="lightbox-modal" id="lightboxModal" onclick="closeLightbox(event)">
    <div class="lightbox-content">
      <span class="lightbox-close" onclick="closeLightbox(event)">&times;</span>
      <img src="" alt="" class="lightbox-img" id="lightboxImg" />
      <div class="lightbox-caption" id="lightboxCaption"></div>
    </div>
  </div>

  <!-- Back to Top Button -->
  <button class="back-to-top" id="backToTop" title="Back to top">↑</button>

  <script>
    // Theme toggle (Dark / Light)
    const themeToggle = document.getElementById('themeToggle');
    const htmlElem = document.documentElement;
    const savedTheme = localStorage.getItem('mocht_doc_theme') || 'light';
    htmlElem.setAttribute('data-theme', savedTheme);
    themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

    themeToggle.addEventListener('click', () => {
      const current = htmlElem.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      htmlElem.setAttribute('data-theme', next);
      localStorage.setItem('mocht_doc_theme', next);
      themeToggle.textContent = next === 'dark' ? '☀️' : '🌙';
    });

    // Mobile sidebar toggle
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    function toggleSidebar() {
      sidebar.classList.toggle('open');
      sidebarOverlay.classList.toggle('active');
    }

    menuToggle.addEventListener('click', toggleSidebar);
    sidebarOverlay.addEventListener('click', toggleSidebar);

    // Lightbox functions
    const lightboxModal = document.getElementById('lightboxModal');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxCaption = document.getElementById('lightboxCaption');

    function openLightbox(src, caption) {
      lightboxImg.src = src;
      lightboxCaption.textContent = caption || '';
      lightboxModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox(e) {
      if (e.target === lightboxModal || e.target.classList.contains('lightbox-close')) {
        lightboxModal.classList.remove('active');
        document.body.style.overflow = '';
      }
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightboxModal.classList.contains('active')) {
        lightboxModal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });

    // Scrollspy navigation
    const navLinks = document.querySelectorAll('.nav-item-link');
    const sections = Array.from(navLinks).map(link => {
      const id = link.getAttribute('data-target');
      return document.getElementById(id);
    }).filter(Boolean);

    window.addEventListener('scroll', () => {
      const scrollPos = window.scrollY + 100;
      let currentSection = sections[0];

      for (let s of sections) {
        if (s.offsetTop <= scrollPos) {
          currentSection = s;
        }
      }

      if (currentSection) {
        navLinks.forEach(l => {
          if (l.getAttribute('data-target') === currentSection.id) {
            l.classList.add('active');
          } else {
            l.classList.remove('active');
          }
        });
      }

      // Back to top visibility
      const backToTop = document.getElementById('backToTop');
      if (window.scrollY > 400) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    });

    document.getElementById('backToTop').addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Client-side quick filter
    const topicSearch = document.getElementById('topicSearch');
    topicSearch.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const allLinks = document.querySelectorAll('.nav-item-link');
      allLinks.forEach(link => {
        const text = link.textContent.toLowerCase();
        if (!q || text.includes(q)) {
          link.style.display = 'flex';
        } else {
          link.style.display = 'none';
        }
      });
    });

    // Close sidebar on mobile when nav link clicked
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth < 1024) {
          sidebar.classList.remove('open');
          sidebarOverlay.classList.remove('active');
        }
      });
    });
  </script>
</body>
</html>`;

  fs.writeFileSync(OUTPUT_HTML, fullHtml, 'utf-8');
  console.log(`✅ Netlify site built successfully at: ${OUTPUT_HTML}`);

  // Sync screenshots to netlify-site/images
  const SCREENSHOTS_DIR = path.join(DOCS_DIR, 'screenshots');
  const IMAGES_DIR = path.join(NETLIFY_DIR, 'images');
  if (fs.existsSync(SCREENSHOTS_DIR)) {
    const files = fs.readdirSync(SCREENSHOTS_DIR);
    for (const f of files) {
      if (f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg')) {
        fs.copyFileSync(path.join(SCREENSHOTS_DIR, f), path.join(IMAGES_DIR, f));
      }
    }
  }

  // Remove obsolete koha screenshots from netlify-site/images
  const obsoleteKohaFiles = [
    '20_koha_acquisitions.png',
    '21_koha_serials.png',
    '22_koha_ill.png',
    '23_koha_course_reserves.png'
  ];
  for (const obsolete of obsoleteKohaFiles) {
    const p = path.join(IMAGES_DIR, obsolete);
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
    }
  }

  // Copy fresh PDF to netlify-site
  const PDF_SOURCE = path.join(DOCS_DIR, 'MOCHT_LMS_User_Training_Guide.pdf');
  const PDF_DEST = path.join(NETLIFY_DIR, 'MOCHT_LMS_User_Training_Guide.pdf');
  if (fs.existsSync(PDF_SOURCE)) {
    fs.copyFileSync(PDF_SOURCE, PDF_DEST);
    console.log(`✅ Copied latest PDF to Netlify site: ${PDF_DEST}`);
  }
}

buildNetlifySite();
