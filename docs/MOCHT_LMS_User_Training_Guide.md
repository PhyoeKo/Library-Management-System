# MOCHT Digital Library Access & Management System (LMS)
## Comprehensive User Training & System Walkthrough Guide
**Optimized for NotebookLM Presentation, Audio Briefing, and Study Guide Generation**

---

## 📌 Document Overview & NotebookLM Metadata

- **System Name:** Ministry of Culture, Hotels and Tourism (MOCHT) National Library Management System / ဒစ်ဂျစ်တယ် စာကြည့်တိုက် စနစ်
- **Live Production URL:** [http://206.189.47.42:3000](http://206.189.47.42:3000) (Alternative Nginx Gateway: [http://206.189.47.42:8080](http://206.189.47.42:8080))
- **Primary Technology Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Prisma ORM, SQLite DB, Canvas 2D Barcode Engine.
- **Core Purpose:** To provide a state-of-the-art, Koha-aligned national digital and physical library platform that bridges public readers (Members/Renters) with enterprise library administrators (Staff/Librarians). It integrates a searchable Online Public Access Catalog (OPAC), in-browser readable e-book PDFs, barcode circulation, customizable per-book overdue fines in Myanmar Kyats (MMK), priority hold queues, and official high-resolution Member ID card issuance with image export.
- **Target Audiences:**
  1. **General Members / Patrons (စာကြည့်တိုက် အသင်းဝင်များ):** Citizens, researchers, students, and guests accessing the OPAC, borrowing books, reading digital e-books, checking loan deadlines, and self-managing holds.
  2. **Library Officers & Administrators (စာကြည့်တိုက်မှူးများနှင့် ဝန်ထမ်းများ):** Professional library officers responsible for cataloging bibliographic records, barcode inventory management, circulation desk counter operations, KYC patron verification, fine collection, and strategic reporting.

---

# 📑 Table of Contents

- [Part 1: Member & Public Patron Portal Showcase](#part-1-member--public-patron-portal-showcase)
  - [Slide 1: Public Catalog (OPAC) Search & Multi-Genre Filters](#slide-1-public-catalog-opac-search--multi-genre-filters)
  - [Slide 2: Instant E-Book Reading in Browser (Full PDF Viewer)](#slide-2-instant-e-book-reading-in-browser-full-pdf-viewer)
  - [Slide 3: Physical Book Hold & Reservation Request](#slide-3-physical-book-hold--reservation-request)
  - [Slide 4: Member Authentication & Secure Login](#slide-4-member-authentication--secure-login)
  - [Slide 5: Member Self-Service Portal – Active Loans & Self-Renewal](#slide-5-member-self-service-portal--active-loans--self-renewal)
  - [Slide 6: Hold Tracking, Reading History & Saved Virtual Lists](#slide-6-hold-tracking-reading-history--saved-virtual-lists)
  - [Slide 7: Dual-Language Toggle (English / မြန်မာဘာသာ)](#slide-7-dual-language-toggle-english--မြန်မာဘာသာ)
- [Part 2: Staff & Administration Control Panel Showcase](#part-2-staff--administration-control-panel-showcase)
  - [Slide 8: Staff Command Center & Dashboard Overview](#slide-8-staff-command-center--dashboard-overview)
  - [Slide 9: Cataloging Module – Adding Books & Custom Overdue Fine Rates (MMK/Day)](#slide-9-cataloging-module--adding-books--custom-overdue-fine-rates-mmkday)
  - [Slide 10: Inventory Control – Barcodes, Physical Copies & Shelf Locations](#slide-10-inventory-control--barcodes-physical-copies--shelf-locations)
  - [Slide 11: Circulation Desk – Fast Check-Out (Loan Issuance)](#slide-11-circulation-desk--fast-check-out-loan-issuance)
  - [Slide 12: Circulation Desk – Fast Check-In & Automated Dynamic Fine Calculation](#slide-12-circulation-desk--fast-check-in--automated-dynamic-fine-calculation)
  - [Slide 13: Priority Hold Queue Management – Approval & Fulfillment](#slide-13-priority-hold-queue-management--approval--fulfillment)
  - [Slide 14: Member Management & Myanmar KYC Verification (NRC)](#slide-14-member-management--myanmar-kyc-verification-nrc)
  - [Slide 15: Member ID Card Generation & High-Resolution PNG Image Export](#slide-15-member-id-card-generation--high-resolution-png-image-export)
  - [Slide 16: Fine Ledger & POS Cashier Payment Collection](#slide-16-fine-ledger--pos-cashier-payment-collection)
  - [Slide 17: Reports & Analytics – Loan Velocity, Utilization Gauges & Overdue Alert Table](#slide-17-reports--analytics--loan-velocity-utilization-gauges--overdue-alert-table)
  - [Slide 18: Koha Enterprise Services – Acquisitions, Serials & Interlibrary Loan (ILL)](#slide-18-koha-enterprise-services--acquisitions-serials--interlibrary-loan-ill)
  - [Slide 19: Comprehensive Standard Operating Procedures (SOP) & FAQ](#slide-19-comprehensive-standard-operating-procedures-sop--faq)

---

# PART 1: Member & Public Patron Portal Showcase

---

### Slide 1: Public Catalog (OPAC) Search & Multi-Genre Filters

**Objective:** Teach general users and members how to search, discover, and filter books across authentic Burmese literature, history, fiction, and open-access resources.

#### Key Talking Points:
1. **Unified Search Engine:** Real-time search across Title, Author, Publisher, or ISBN.
2. **Category Badges & Format Badges:** Filter by format (`Hardcopy` vs. `E-Book`) and genre (`History`, `Literature`, `Fiction`, `Dhamma`, `Biography`, `Technology`, etc.).
3. **Availability Indicator:** Instant visual cue showing whether physical copies are available on shelf or currently on loan.

#### Step-by-Step User Instructions:
1. Navigate to the homepage at `http://206.189.47.42:3000/`.
2. Enter a keyword in the central search bar (e.g., "ချစ်ဦးညို" or "မွန်ဘုရင်မကြီး ရှင်စောပု").
3. Click any Genre pill to filter down to specific collections.
4. Review book cards displaying Author, Genre, Publication Year, and Availability status.

```
+-----------------------------------------------------------------------------------+
| 📷 SCREENSHOT PLACEHOLDER 01: OPAC Public Catalog Homepage                        |
| Recommended View: http://206.189.47.42:3000/                                     |
| Caption: "Public Catalog Homepage displaying MOCHT national banner, search bar,   |
| genre filters, and 50 authentic Burmese books with format badges."                |
+-----------------------------------------------------------------------------------+
```

---

### Slide 2: Instant E-Book Reading in Browser (Full PDF Viewer)

**Objective:** Demonstrate how readers can immediately open and read digital e-books in the browser without installing external software.

#### Key Talking Points:
1. **Zero-Friction Access:** Digital editions feature a bright "Read E-Book" (စာအုပ်ဖတ်မည်) button.
2. **Integrated High-Performance PDF Reader:** Opens a distraction-free modal dialog with full pagination, zoom, responsive fit, and download controls.
3. **50 Authentic E-Book Titles:** Pre-loaded with official digital editions spanning classical literature to modern technology guides.

#### Step-by-Step User Instructions:
1. In the Catalog, locate any title with the **E-Book (Digital Edition)** badge.
2. Click the green **"Read E-Book" (စာအုပ်ဖတ်မည်)** button.
3. Use the in-browser viewer controls to read, navigate through pages, zoom in on text, or download for offline reading.
4. Click the "✕" button or press Escape to return to the catalog.

```
+-----------------------------------------------------------------------------------+
| 📷 SCREENSHOT PLACEHOLDER 02: In-Browser E-Book PDF Viewer Modal                 |
| Recommended View: Modal active over http://206.189.47.42:3000/                    |
| Caption: "In-browser E-Book reader modal displaying high-definition Burmese PDF    |
| literature with header navigation, page counter, and zoom controls."              |
+-----------------------------------------------------------------------------------+
```

---

### Slide 3: Physical Book Hold & Reservation Request

**Objective:** Explain how patrons can reserve physical hardcopy books when they plan to visit the branch or when a popular title is currently checked out.

#### Key Talking Points:
1. **Hold Queue Placement:** Reserves a copy in the Koha-standard priority queue.
2. **Real-time Status Validation:** Available books are marked for desk pickup; borrowed books place the patron next in line upon return.
3. **Guest Protection:** Unauthenticated users are gracefully prompted to log in before confirming a reservation.

#### Step-by-Step User Instructions:
1. For any physical title, click the **"Hold / Reserve" (ကြိုတင်မှာယူရန်)** button.
2. If already logged in, the reservation confirms instantly with queue position assignment.
3. If not logged in, click "Login as Member" from the notification to authenticate.

```
+-----------------------------------------------------------------------------------+
| 📷 SCREENSHOT PLACEHOLDER 03: Physical Book Reservation & Hold Queue Feedback    |
| Recommended View: Book card with active Hold interaction on http://206.189.47.42:3000/ |
| Caption: "Hold/Reservation prompt illustrating instant queue feedback for physical |
| book copies with queue rank confirmation."                                         |
+-----------------------------------------------------------------------------------+
```

---

### Slide 4: Member Authentication & Secure Login

**Objective:** Guide users through accessing personal library member accounts and switching between Patron and Administrative roles.

#### Key Talking Points:
1. **Quick-Access Demo Credentials:** One-click demo buttons for quick training demonstration (`Staff Librarian` vs. `Patron Member`).
2. **Barcode or Email Identification:** Patrons can log in using their registered Email or unique Member Barcode (e.g., `PAT-90022`).
3. **Session Persistence:** Remembers user role across tabs and enables access to the customized Member Portal.

#### Step-by-Step User Instructions:
1. Click the **"Login" (အကောင့်ဝင်ရန်)** link in the top navigation bar.
2. Choose **"Login as Member / Patron"** or enter `dr.chen@university.edu`.
3. Enter password and click **"Sign In"**.
4. The navigation bar immediately reflects your membership status and unlocks the **"Member Portal" (အသင်းဝင် ပေါ်တယ်)** tab.

```
+-----------------------------------------------------------------------------------+
| 📷 SCREENSHOT PLACEHOLDER 04: Login Screen with Role Switcher                     |
| Recommended View: http://206.189.47.42:3000/login                                |
| Caption: "Authentication portal with quick demo login buttons for Librarian staff  |
| and Patron members, highlighting secure session entry."                           |
+-----------------------------------------------------------------------------------+
```

---

### Slide 5: Member Self-Service Portal – Active Loans & Self-Renewal

**Objective:** Train patrons on tracking borrowed books, watching return due dates, and self-renewing loans online before fines accrue.

#### Key Talking Points:
1. **Live Checkouts Ribbon:** Displays all books currently in the patron's possession with checkout dates and strict due dates.
2. **Overdue Warning Alerts:** Highlights loans nearing due date in yellow and overdue items in red with accumulated fine totals.
3. **One-Click Self-Renewal:** Extends due date by standard policy loan period directly from the portal, provided no other patron has placed a hold.

#### Step-by-Step User Instructions:
1. Click **"Member Portal" (အသင်းဝင် ပေါ်တယ်)** in the top navigation.
2. View the **"Current Checkouts" (လက်ရှိငှားရမ်းထားသော စာအုပ်များ)** section.
3. Inspect the return due date for each book.
4. Click **"Renew Loan" (သက်တမ်းတိုးရန်)** next to eligible titles to immediately extend borrowing time.

```
+-----------------------------------------------------------------------------------+
| 📷 SCREENSHOT PLACEHOLDER 05: Member Portal – Active Loans & Self-Renewals        |
| Recommended View: http://206.189.47.42:3000/patron                               |
| Caption: "Member Self-Service Dashboard displaying active borrowed items, return   |
| due date countdown, and one-click loan renewal button."                           |
+-----------------------------------------------------------------------------------+
```

---

### Slide 6: Hold Tracking, Reading History & Saved Virtual Lists

**Objective:** Demonstrate patron self-service features for tracking reserved items and maintaining personal reading bibliographies.

#### Key Talking Points:
1. **Active Holds Status:** Shows whether a reserved book is `Waiting in Queue` or `Ready for Desk Pickup`.
2. **Borrowing History Log:** Complete archival record of previously borrowed and returned books.
3. **Personal Saved Lists:** Curate virtual reading lists (e.g., "Myanmar Historical Novels", "Research References").

#### Step-by-Step User Instructions:
1. In the Member Portal, scroll to **"My Reservations / Holds" (ကြိုတင်မှာယူမှုများ)** to verify your pickup readiness.
2. Switch tabs to **"Reading History" (ငှားရမ်းမှု မှတ်တမ်း)** to review past reading accomplishments.
3. Use **"Saved Lists"** to organize future reading goals.

```
+-----------------------------------------------------------------------------------+
| 📷 SCREENSHOT PLACEHOLDER 06: Member Portal – Holds Queue & History Tabs          |
| Recommended View: http://206.189.47.42:3000/patron (Scrolled to Holds & Lists)   |
| Caption: "Member Portal showing active hold queue priority ranking, reading       |
| history timeline, and personal book lists."                                       |
+-----------------------------------------------------------------------------------+
```

---

### Slide 7: Dual-Language Toggle (English / မြန်မာဘာသာ)

**Objective:** Showcase seamless internationalization allowing any user to toggle between English and authentic Myanmar Unicode translations instantly.

#### Key Talking Points:
1. **Instant Language Switching:** Toggle button directly accessible in the top navigation header at all times.
2. **Contextual Burmese Terminology:** Authentic library science terminology used across all buttons, status badges, forms, and alerts (e.g., "Circulation Desk" ➔ "စာအုပ် ငှား/ပြန် ကောင်တာ").
3. **Persistent Language State:** The user's preference is remembered across all pages and sessions.

#### Step-by-Step User Instructions:
1. Click the **"MY"** button in the top right corner of the navigation bar.
2. Observe all navigation menus, catalog badges, table headers, and modal text instantly switch to Myanmar script.
3. Click **"EN"** to toggle back to English at any point.

```
+-----------------------------------------------------------------------------------+
| 📷 SCREENSHOT PLACEHOLDER 07: Dual Language Navigation Switcher                   |
| Recommended View: Top Navbar on http://206.189.47.42:3000/ (Focused on EN/MY toggle)|
| Caption: "Top navigation bar highlighting the dual-language switcher toggle with   |
| translated Burmese library navigation terms."                                     |
+-----------------------------------------------------------------------------------+
```

---

# PART 2: Staff & Administration Control Panel Showcase

---

### Slide 8: Staff Command Center & Dashboard Overview

**Objective:** Introduce library officers to the central administrative hub, displaying real-time circulation metrics and direct shortcuts to daily workflow modules.

#### Key Talking Points:
1. **Real-Time Live KPI Cards:** Total Catalog Titles, Active Loans, Registered Members, Pending Holds, and Today's Circulation Count.
2. **Modular 5-Column Grid:** Clean access to Cataloging, Circulation Desk, Member Registry, Fines Ledger, and Reports.
3. **Recent Activity Stream:** Live chronological feed of checkouts, returns, and hold requests.

#### Step-by-Step Officer Instructions:
1. Log in with an Admin/Staff account (`admin@library.gov.mm`).
2. Click **"Dashboard" (ဒက်ရှ်ဘုတ်)** in the top navigation.
3. Review KPI cards for immediate situational awareness of branch operations.
4. Click any module card to begin daily operations.

```
+-----------------------------------------------------------------------------------+
| 📷 SCREENSHOT PLACEHOLDER 08: Staff Administrative Command Center                 |
| Recommended View: http://206.189.47.42:3000/admin                                |
| Caption: "Administrative Dashboard overview showing real-time circulation KPIs,   |
| operational shortcut cards, and system status feed."                             |
+-----------------------------------------------------------------------------------+
```

---

### Slide 9: Cataloging Module – Adding Books & Custom Overdue Fine Rates (MMK/Day)

**Objective:** Train catalogers on registering new titles, attaching e-book PDFs, and setting individual overdue fine rates in MMK/day under the Book Type section.

#### Key Talking Points:
1. **Bibliographic Metadata Entry:** Title, Author, ISBN, Publisher, Year, Genre, and Shelf Classification.
2. **Book Type Selection (Physical vs. E-Book):**
   - Choosing **E-Book** displays digital PDF upload / link fields.
   - Choosing **Physical Hardcopy** reveals the dedicated **Overdue Fine Amount in MMK** input field.
3. **Flexible Per-Book Fine Rates:** Standard books can be set to 500 MMK/day, rare collections to 2,000 MMK/day, and reference materials to 5,000 MMK/day.

#### Step-by-Step Officer Instructions:
1. Navigate to **"Cataloging" (စာရင်းသွင်းခြင်း)** at `/admin/catalog`.
2. Click **"+ Add New Book" (+ စာအုပ်အသစ်ထည့်မည်)**.
3. Fill in Title, Author, ISBN, Genre, and Publisher.
4. Under **"Type of Book"**, select **"Hardcopy" (ပုံနှိပ်စာအုပ်)**.
5. In the revealed **"Overdue Fine (ရက်လွန်ကြေးနှုန်းထား)"** input, enter the daily fine rate (e.g., `500` MMK / day).
6. Click **"Save Title" (စာအုပ်သိမ်းဆည်းမည်)**.

```
+-----------------------------------------------------------------------------------+
| 📷 SCREENSHOT PLACEHOLDER 09: Cataloging Form with MMK Overdue Fine Field         |
| Recommended View: http://206.189.47.42:3000/admin/catalog (Modal open)           |
| Caption: "Book Cataloging form displaying Type of Book selector with custom daily  |
| overdue fine input addon styled in Myanmar Kyats (MMK / day)."                    |
+-----------------------------------------------------------------------------------+
```

---

### Slide 10: Inventory Control – Barcodes, Physical Copies & Shelf Locations

**Objective:** Explain how physical copies are tracked with individual barcodes, call numbers, and shelf availability states.

#### Key Talking Points:
1. **One Title to Multiple Copies:** A single bibliographic entry can have 1 to 50+ distinct physical copies.
2. **Unique Barcode Identity:** Each physical copy has a scannable barcode (e.g., `BC-10001-1`).
3. **Real-time Inventory Status:** Tracks copies across states: `Available` (ရရှိနိုင်), `On Loan` (ငှားရမ်းထား), `In Maintenance` (ပြင်ဆင်ဆဲ), or `Lost` (ပျောက်ဆုံး).

#### Step-by-Step Officer Instructions:
1. In the Cataloging table, click **"Manage Copies" (မိတ္တူများ စီမံရန်)** on any title.
2. View existing copies, their barcodes, and current statuses.
3. Click **"+ Add Copy"** to enter a new barcode and shelf call number.
4. Update condition notes as physical wear occurs.

```
+-----------------------------------------------------------------------------------+
| 📷 SCREENSHOT PLACEHOLDER 10: Physical Copies & Barcode Inventory Drawer          |
| Recommended View: http://206.189.47.42:3000/admin/catalog (Manage Copies view)   |
| Caption: "Physical Copy Inventory drawer showing unique barcodes, shelf locations,|
| and real-time copy circulation status badges."                                    |
+-----------------------------------------------------------------------------------+
```

---

### Slide 11: Circulation Desk – Fast Check-Out (Loan Issuance)

**Objective:** Train circulation counter officers to issue loans in under 10 seconds using barcode scanning.

#### Key Talking Points:
1. **Prominent Front Navigation:** "Circulation Desk" is placed prominently on the top bar for quick access during heavy desk queues.
2. **Automated Borrower Verification:** Scanning Member ID verifies eligibility, checks max loan limits, and flags outstanding fines.
3. **Due Date Calculation:** Automatically sets return deadline based on patron category loan rules (e.g., 14 days for General Members, 30 days for Faculty).

#### Step-by-Step Officer Instructions:
1. Click **"Circulation Desk" (ငှား/ပြန် ကောင်တာ)** in the main navbar (`/admin/circulation`).
2. In the **"Check-Out"** tab, scan or type the **Patron Barcode** (e.g., `PAT-90022`).
3. Scan or enter the **Book Copy Barcode** (e.g., `BC-10001-1`).
4. Click **"Issue Loan" (စာအုပ်ထုတ်ပေးရန်)**.
5. A green confirmation banner displays the loan confirmation and exact due date.

```
+-----------------------------------------------------------------------------------+
| 📷 SCREENSHOT PLACEHOLDER 11: Circulation Desk – Fast Check-Out Screen            |
| Recommended View: http://206.189.47.42:3000/admin/circulation                    |
| Caption: "Circulation Desk check-out terminal showing Member Barcode scan, Book    |
| Copy selection, and instant loan issuance workflow."                              |
+-----------------------------------------------------------------------------------+
```

---

### Slide 12: Circulation Desk – Fast Check-In & Automated Dynamic Fine Calculation

**Objective:** Demonstrate book returns, immediate copy status restoration to "Available", and dynamic automated overdue fine calculations based on the specific book's MMK rate.

#### Key Talking Points:
1. **Rapid Return Processing:** Scanning a returned book immediately marks the loan as completed and restores the copy to shelf-ready status.
2. **Dynamic Overdue Formula:**
   $$\text{Total Fine (MMK)} = \text{Days Overdue} \times \text{Book's Custom Fine Rate (MMK/Day)}$$
3. **Instant Fine Billing:** If returned late, the fine record is generated automatically in the POS ledger and linked to the patron's balance.

#### Step-by-Step Officer Instructions:
1. On the Circulation Desk page, click the **"Check-In / Return" (စာအုပ်ပြန်လက်ခံခြင်း)** tab.
2. Scan the barcode of the physical book handed back by the patron.
3. Click **"Process Return" (ပြန်လည်လက်ခံမည်)**.
4. If on time: Copy status switches to `Available` with zero fee.
5. If overdue: An amber alert displays the days overdue and calculated MMK fine amount, with a direct button to collect payment.

```
+-----------------------------------------------------------------------------------+
| 📷 SCREENSHOT PLACEHOLDER 12: Circulation Desk – Check-In with Overdue Fine Alert |
| Recommended View: http://206.189.47.42:3000/admin/circulation (Check-in tab)     |
| Caption: "Check-in terminal calculating overdue days and applying the book's      |
| specific MMK daily rate to generate an instant penalty record."                   |
+-----------------------------------------------------------------------------------+
```

---

### Slide 13: Priority Hold Queue Management – Approval & Fulfillment

**Objective:** Explain how staff manage patron reservations, prioritize fulfillment, and prepare books for pickup.

#### Key Talking Points:
1. **FIFO/Priority Queue:** Manages holds based on reservation timestamp and membership priority.
2. **Hold Lifecycle Workflow:** `PENDING` ➔ `APPROVED / WAITING PICKUP` ➔ `FULFILLED` or `CANCELLED`.
3. **Pickup Notification & Shelf Hold:** Automatically reserves returned copies for waiting patrons before shelving.

#### Step-by-Step Officer Instructions:
1. Click **"More (နောက်ထပ်) ▾"** in the navbar and select **"Holds & Reservations"** (`/admin/holds`).
2. Review the pending reservation queue sorted by request date.
3. When a copy is returned, click **"Fulfill / Ready for Pickup" (စာအုပ်ထုတ်ပေးရန် အဆင်သင့်ဖြစ်ပြီ)**.
4. Hand the reserved book to the patron when they arrive at the circulation desk.

```
+-----------------------------------------------------------------------------------+
| 📷 SCREENSHOT PLACEHOLDER 13: Holds & Reservations Management Queue               |
| Recommended View: http://206.189.47.42:3000/admin/holds                          |
| Caption: "Koha-standard Holds Queue dashboard showing priority ranking, patron     |
| reservation status, and fulfillment approval actions."                            |
+-----------------------------------------------------------------------------------+
```

---

### Slide 14: Member Management & Myanmar KYC Verification (NRC)

**Objective:** Train staff on registering new library members, recording Myanmar National Registration Card (NRC) numbers, and managing borrower categories.

#### Key Talking Points:
1. **Myanmar KYC Compliance:** Dedicated fields for Full Name, Phone, Email, Physical Address, and Myanmar NRC Number (e.g., `12/KAMAYA(N)90022`).
2. **Borrower Categories:** Classifies members into Student, General Public, Faculty, or Institutional categories with customized borrowing limits.
3. **Member Search & Filter:** Instantly filter members by Name, Barcode, Phone, or NRC number.

#### Step-by-Step Officer Instructions:
1. Click **"Members" (အသင်းဝင်များ)** in the top navigation (`/admin/patrons`).
2. Click **"+ Register New Member" (+ အသင်းဝင်အသစ် စာရင်းသွင်းမည်)**.
3. Enter Full Name, NRC Number, Phone, Email, and Address.
4. Select the **Membership Category** (e.g., General Adult, Student, Researcher).
5. Click **"Save Member"**; a unique barcode is automatically generated.

```
+-----------------------------------------------------------------------------------+
| 📷 SCREENSHOT PLACEHOLDER 14: Member Directory & KYC Registration Form            |
| Recommended View: http://206.189.47.42:3000/admin/patrons (Registration open)     |
| Caption: "Member Directory with KYC registration modal showing Myanmar NRC format, |
| borrower categorization, and contact details."                                    |
+-----------------------------------------------------------------------------------+
```

---

### Slide 15: Member ID Card Generation & High-Resolution PNG Image Export

**Objective:** Showcase the built-in digital Member Card generator, including scannable barcode rendering and one-click high-resolution PNG image download for printing.

#### Key Talking Points:
1. **Interactive Member Pass Modal:** Click **"View Card" (ကတ်ကြည့်ရန်)** on any member row to open the official MOCHT National Library pass.
2. **Official Government Aesthetic:** Designed with deep emerald tones, gold seal insignia, member barcode, NRC number, and issue date.
3. **HTML5 Canvas 2D Engine:** Renders a crisp $1050 \times 660$ pixel image with crisp typography and standard code-128 barcode simulation.
4. **"Export as Image" (PNG ပုံထုတ်ယူရန်):** Downloads an immediate PNG file ready for physical PVC card printing or digital distribution.

#### Step-by-Step Officer Instructions:
1. In the Member table (`/admin/patrons`), find the desired member row.
2. Click the green **"View Card" (ကတ်ကြည့်ရန်)** button.
3. The official MOCHT Member Pass modal opens, showing the front card preview.
4. Click **"Export as Image (PNG ပုံထုတ်ယူရန်)"**.
5. The high-resolution PNG file (`Member_Card_PAT-xxxxx.png`) downloads immediately to your computer.

```
+-----------------------------------------------------------------------------------+
| 📷 SCREENSHOT PLACEHOLDER 15: Member ID Card Preview & PNG Image Export           |
| Recommended View: http://206.189.47.42:3000/admin/patrons (Member Card modal open)|
| Caption: "Official MOCHT Library Member Card modal displaying government seal,     |
| barcode, NRC details, and Export as Image (PNG) action button."                   |
+-----------------------------------------------------------------------------------+
```

---

### Slide 16: Fine Ledger & POS Cashier Payment Collection

**Objective:** Instruct library accountants and desk officers on reviewing outstanding fines, recording cash/Kpay collections, and generating itemized payment receipts.

#### Key Talking Points:
1. **Consolidated Fine Ledger:** Itemized list of all penalties categorized by reason (`Overdue Return`, `Damaged Book`, `Lost Item`).
2. **Partial or Full Payment:** Officers can collect exact amounts or full outstanding balances in MMK.
3. **Fee Waiving Privileges:** Authorized supervisors can waive fines with recorded administrative notes.

#### Step-by-Step Officer Instructions:
1. Click **"More (နောက်ထပ်) ▾"** and navigate to **"Fines & POS"** (`/admin/fines`).
2. Search for the patron by Barcode or Name.
3. Review the itemized fine breakdown and total balance due in MMK.
4. Click **"Collect Payment" (ငွေလက်ခံမည်)**.
5. Select payment method (Cash, Kpay, CB Pay) and enter the collected amount.
6. Click **"Submit Receipt"**; the balance updates to `PAID` with audit timestamp.

```
+-----------------------------------------------------------------------------------+
| 📷 SCREENSHOT PLACEHOLDER 16: Fines & POS Cashier Payment Terminal               |
| Recommended View: http://206.189.47.42:3000/admin/fines                           |
| Caption: "Fines & POS Ledger displaying overdue penalty breakdown in MMK,         |
| payment collection modal, and settlement receipts."                               |
+-----------------------------------------------------------------------------------+
```

---

### Slide 17: Reports & Analytics – Loan Velocity, Utilization Gauges & Overdue Alert Table

**Objective:** Train library directors and senior staff on analyzing library performance metrics, collection utilization, and high-risk overdue loans.

#### Key Talking Points:
1. **Pure SVG Radial Performance Rings:**
   - **Collection Utilization Rate (%)**
   - **Return Rate (%)**
   - **Fine Collection Efficiency (%)**
   - **Overdue Risk Rate (%)**
2. **14-Day Loan Activity Trend:** Interactive SVG bar chart showing daily circulation velocity.
3. **Overdue Radar Table:** Color-coded severity tiers:
   - 🟡 Yellow (< 7 days overdue)
   - 🟠 Amber (7–14 days overdue)
   - 🔴 Red (> 14 days overdue with calculated penalty)
4. **JSON Snapshot Export:** Export complete live analytical data for executive ministry briefings.

#### Step-by-Step Officer Instructions:
1. Click **"More (နောက်ထပ်) ▾"** and select **"Reports & Analytics"** (`/admin/reports`).
2. Inspect the 4 radial gauges for an instant high-level diagnostic of library health.
3. Analyze the 14-day circulation bar chart to evaluate peak loan periods.
4. Scroll to the **"Overdue Loan Radar"** table to identify patrons requiring phone or SMS contact.
5. Click **"Export JSON"** to download the analytical snapshot.

```
+-----------------------------------------------------------------------------------+
| 📷 SCREENSHOT PLACEHOLDER 17: Reports & Analytics Dashboard                       |
| Recommended View: http://206.189.47.42:3000/admin/reports                         |
| Caption: "Executive Reporting dashboard featuring SVG radial utilization gauges,   |
| 14-day loan velocity bar chart, and color-coded overdue radar table."             |
+-----------------------------------------------------------------------------------+
```

---

### Slide 18: Koha Enterprise Services – Acquisitions, Serials & Interlibrary Loan (ILL)

**Objective:** Familiarize staff with advanced enterprise library operations, supplier procurement, and inter-institutional resource sharing.

#### Key Talking Points:
1. **Acquisitions & Bookseller Directory (`/admin/acquisitions`):** Manage vendors, purchase order baskets, and digital licensing.
2. **Serials & Periodical Subscriptions (`/admin/library-services`):** Track recurring journal, magazine, and newspaper deliveries with ISSN codes.
3. **Interlibrary Loans (ILL):** Manage partner institutional borrowing requests between national universities and municipal libraries.

#### Step-by-Step Officer Instructions:
1. Open **"More (နောက်ထပ်) ▾"** and click **"Library Services"** (`/admin/library-services`).
2. Switch between **"Serials"**, **"Interlibrary Loans (ILL)"**, and **"Course Reserves"** tabs.
3. Record new journal issues or monitor inter-campus transfer transit states (`In-Transit` ➔ `Received`).

```
+-----------------------------------------------------------------------------------+
| 📷 SCREENSHOT PLACEHOLDER 18: Koha Enterprise Services (Serials & ILL)            |
| Recommended View: http://206.189.47.42:3000/admin/library-services               |
| Caption: "Koha Library Services console managing periodical subscriptions,         |
| interlibrary loan transfers, and university course reserve collections."          |
+-----------------------------------------------------------------------------------+
```

---

### Slide 19: Comprehensive Standard Operating Procedures (SOP) & FAQ

**Objective:** Reference sheet for common questions and routine troubleshooting during operational deployment.

#### Frequently Asked Questions (FAQ):

**Q1: How does the system calculate overdue fines if different books have different values?**  
> *Answer:* Each physical book record stores its own configured `overdueFineRate` in MMK/day (set during cataloging). When a book is returned past its due date, the system multiplies the elapsed overdue days by that exact book's rate. Rare or expensive books can have a higher daily rate than standard paperbacks.

**Q2: Can patrons read E-Books without an active library membership?**  
> *Answer:* Yes. Open-access digital editions can be viewed directly in the browser by any visitor from the public catalog. However, reserving physical copies, renewing loans, and viewing loan history requires logging into an active member account.

**Q3: How do librarians print Member ID cards?**  
> *Answer:* Navigate to `/admin/patrons`, find the member, click **"View Card" (ကတ်ကြည့်ရန်)**, and click **"Export as Image (PNG ပုံထုတ်ယူရန်)"**. The exported PNG image is formatted at 300 DPI equivalent ($1050 \times 660$) and can be printed directly using standard PVC ID card printers or paper laminates.

**Q4: How does the Circulation Desk handle books with holds?**  
> *Answer:* When an item with active holds is checked in, the system alerts the librarian that the item is reserved and updates the hold status to `Waiting for Pickup`, preventing it from being accidentally returned to regular shelves.

**Q5: Is the system accessible on mobile devices and tablets?**  
> *Answer:* Yes. The entire interface is fully responsive, featuring collapsible mobile navigation drawers, touch-friendly barcode inputs, and responsive card layouts optimized for library tablets and smartphones.

```
+-----------------------------------------------------------------------------------+
| 📷 SCREENSHOT PLACEHOLDER 19: Mobile Responsive Library Portal                     |
| Recommended View: Mobile viewport (390px) on http://206.189.47.42:3000/           |
| Caption: "Mobile-optimized responsive view of the MOCHT Library Portal displaying |
| streamlined catalog browsing and mobile drawer menu."                             |
+-----------------------------------------------------------------------------------+
```

---

## 🎯 Summary Checklist for Presenters & Trainers

When conducting user training using this guide with NotebookLM:

1. **Audio Overview Generation:** Upload this document into NotebookLM and request an **Audio Overview (Deep Dive Conversation)** for a natural, engaging podcast-style explanation of the system.
2. **Slide Deck Generation:** Use NotebookLM's **Briefing Doc** or **Study Guide** prompt to extract concise speaking bullets.
3. **Screenshot Insertion:** Replace each of the 19 framed `📷 SCREENSHOT PLACEHOLDER` boxes with the actual exported PNG screenshots captured from the live production server at `http://206.189.47.42:3000`.

---
*Created for the Ministry of Culture, Hotels and Tourism (MOCHT) National Digital Library Project.*  
*Production Server: `206.189.47.42:3000` | Repository: `PhyoeKo/Library-Management-System`*
