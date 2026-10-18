const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = path.join(__dirname, '../docs/screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const adminUser = {
  id: "cmsdhejt30002werhxvzh2eae",
  name: "Eleanor Vance (Chief Librarian)",
  role: "ADMIN",
  barcode: "STAFF-001",
  email: "admin@library.edu",
  isVip: false
};

const patronUser = {
  id: "cmvdkacgl00017ue02ncrnf76",
  name: "U Thein Win (VIP Member)",
  role: "PATRON",
  barcode: "PAT-VIP-001",
  email: "theinwin.vip@mocht.gov.mm",
  isVip: true
};

async function run() {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,850'],
    defaultViewport: { width: 1280, height: 850 }
  });

  const page = await browser.newPage();

  async function setSession(user, lang = 'my') {
    await page.evaluateOnNewDocument((u, l) => {
      localStorage.setItem('lms_lang', l);
      if (u) {
        localStorage.setItem('lms_user', JSON.stringify(u));
      } else {
        localStorage.removeItem('lms_user');
      }
    }, user, lang);
  }

  // 1. OPAC Homepage
  console.log('Capturing 01_opac_homepage.png...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    localStorage.setItem('lms_lang', 'my');
    localStorage.removeItem('lms_user');
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_opac_homepage.png') });

  // 2. E-Book PDF Reader Modal
  console.log('Capturing 02_ebook_pdf_reader.png...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, a'));
    const target = btns.find(b => b.textContent && (b.textContent.includes('PDF') || b.textContent.includes('E-Book')));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_ebook_pdf_reader.png') });

  // 3. Login Screen
  console.log('Capturing 03_login_screen.png...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_login_screen.png') });

  // 4. Patron Portal
  console.log('Capturing 04_patron_self_service.png...');
  await page.evaluate((u) => {
    localStorage.setItem('lms_user', JSON.stringify(u));
    localStorage.setItem('lms_lang', 'my');
  }, patronUser);
  await page.goto('http://localhost:3000/patron', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_patron_self_service.png') });

  // Set Admin session for administrative screens
  await page.evaluate((u) => {
    localStorage.setItem('lms_user', JSON.stringify(u));
    localStorage.setItem('lms_lang', 'my');
  }, adminUser);

  // 5. Admin Dashboard
  console.log('Capturing 05_admin_dashboard.png...');
  await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_admin_dashboard.png') });

  // 6. Catalog Management
  console.log('Capturing 06_catalog_management.png...');
  await page.goto('http://localhost:3000/admin/catalog', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_catalog_management.png') });

  // 7. Add Book Modal
  console.log('Capturing 07_add_book_modal.png...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find(b => b.textContent.includes('စာအုပ်အသစ်ထည့်ရန်') || b.textContent.includes('Add New Book'));
    if (addBtn) addBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_add_book_modal.png') });

  // 8. Book Categories CRUD
  console.log('Capturing 08_book_categories_crud.png...');
  await page.goto('http://localhost:3000/admin/categories', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_book_categories_crud.png') });

  // 9. Circulation Desk & Checkout
  console.log('Capturing 09_circulation_checkout.png...');
  await page.goto('http://localhost:3000/admin/circulation', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  // Type VIP member barcode into patron input if available
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    if (inputs.length > 0) {
      inputs[0].value = 'PAT-VIP-001';
      inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_circulation_checkout.png') });

  // 10. Holds Queue
  console.log('Capturing 10_priority_holds_queue.png...');
  await page.goto('http://localhost:3000/admin/holds', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_priority_holds_queue.png') });

  // 11. Patron Directory & KYC
  console.log('Capturing 11_patron_directory_kyc.png...');
  await page.goto('http://localhost:3000/admin/patrons', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_patron_directory_kyc.png') });

  // 12. VIP Member Card Modal
  console.log('Capturing 12_vip_member_card.png...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const viewCardBtn = btns.find(b => b.textContent.includes('ကတ်ကြည့်ရန်') || b.textContent.includes('View Card'));
    if (viewCardBtn) viewCardBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_vip_member_card.png') });

  // 13. Fines Ledger
  console.log('Capturing 13_fines_ledger.png...');
  await page.goto('http://localhost:3000/admin/fines', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13_fines_ledger.png') });

  // 14. Reports Overview
  console.log('Capturing 14_reports_executive_overview.png...');
  await page.goto('http://localhost:3000/admin/reports', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  // Open CSV export dropdown to showcase export menu in screenshot
  await page.evaluate(() => {
    const exportBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('CSV ဒေါင်းလုဒ်') || b.textContent.includes('Export CSV'));
    if (exportBtn) exportBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '14_reports_executive_overview.png') });

  // 15. Reports Circulation Tab
  console.log('Capturing 15_reports_circulation_tab.png...');
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button'));
    const circTab = tabs.find(b => b.textContent.includes('ငှားရမ်းမှုမှတ်တမ်း (Loans'));
    if (circTab) circTab.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '15_reports_circulation_tab.png') });

  // 16. Reports Fines Tab
  console.log('Capturing 16_reports_fines_tab.png...');
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button'));
    const fineTab = tabs.find(b => b.textContent.includes('ဒဏ်ကြေးစာရင်း (Fines'));
    if (fineTab) fineTab.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '16_reports_fines_tab.png') });

  // 17. Reports Inventory Tab
  console.log('Capturing 17_reports_inventory_tab.png...');
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button'));
    const invTab = tabs.find(b => b.textContent.includes('စာအုပ်စာရင်း (Catalog'));
    if (invTab) invTab.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '17_reports_inventory_tab.png') });

  // 18. Reports Patrons Tab
  console.log('Capturing 18_reports_patrons_tab.png...');
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button'));
    const patronTab = tabs.find(b => b.textContent.includes('အသင်းဝင်များ (Members'));
    if (patronTab) patronTab.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '18_reports_patrons_tab.png') });

  // 19. Reports Overdue Tab
  console.log('Capturing 19_reports_overdue_tab.png...');
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button'));
    const overdueTab = tabs.find(b => b.textContent.includes('ရက်ကျော်စာရင်း (Overdue'));
    if (overdueTab) overdueTab.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '19_reports_overdue_tab.png') });

  // 20. Koha Acquisitions
  console.log('Capturing 20_koha_acquisitions.png...');
  await page.goto('http://localhost:3000/admin/acquisitions', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '20_koha_acquisitions.png') });

  // 21. Koha Serials
  console.log('Capturing 21_koha_serials.png...');
  await page.goto('http://localhost:3000/admin/serials', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '21_koha_serials.png') });

  // 22. Koha ILL
  console.log('Capturing 22_koha_ill.png...');
  await page.goto('http://localhost:3000/admin/ill', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '22_koha_ill.png') });

  // 23. Koha Course Reserves
  console.log('Capturing 23_koha_course_reserves.png...');
  await page.goto('http://localhost:3000/admin/course-reserves', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '23_koha_course_reserves.png') });

  console.log('All screenshots captured successfully!');
  await browser.close();
}

run().catch(err => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
