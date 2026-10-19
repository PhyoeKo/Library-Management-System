# MOCHT National Digital Library Access & Management System (LMS)
### ပြည်ထောင်စုသမ္မတမြန်မာနိုင်ငံတော် · ဟိုတယ်နှင့်ခရီးသွားလာရေးဝန်ကြီးဌာန
**National Library Management System — Local Installation & Setup Guide**

---

## 📌 Overview (စနစ်မိတ်ဆက်)

ဟိုတယ်နှင့်ခရီးသွားလာရေးဝန်ကြီးဌာန (MOCHT) အမျိုးသား ဒစ်ဂျစ်တယ် စာကြည့်တိုက် စီမံခန့်ခွဲမှုစနစ်သည် Next.js 16, TypeScript, Tailwind CSS, Prisma ORM နှင့် SQLite DB တို့ဖြင့် တည်ဆောက်ထားသော ပြည့်စုံသည့် Enterprise Web Application တစ်ခုဖြစ်ပါသည်။

အခြား External Database (MySQL, PostgreSQL) သီးသန့်သွင်းစရာမလိုဘဲ SQLite Database (`prisma/dev.db`) ဖြင့် Local PC တွင် လျင်မြန်လွယ်ကူစွာ တပ်ဆင်အသုံးပြုနိုင်ပါသည်။

---

## 💻 System Requirements (ကြိုတင်လိုအပ်ချက်များ)

New PC တွင် အောက်ပါ Software များ တပ်ဆင်ထားရန် လိုအပ်ပါသည်-

1. **Node.js**: `v18.18.0` သို့မဟုတ် အထက် (အကြံပြုထားသော Version: **Node.js 20 LTS** သို့မဟုတ် **22 LTS**)
   - ဒေါင်းလုဒ်ရယူရန်: [https://nodejs.org](https://nodejs.org)
   - စစ်ဆေးရန်:
     ```bash
     node -v
     npm -v
     ```
2. **Git**:
   - ဒေါင်းလုဒ်ရယူရန်: [https://git-scm.com](https://git-scm.com)
   - စစ်ဆေးရန်:
     ```bash
     git --version
     ```

---

## 🚀 Step-by-Step Local Setup Guide (အဆင့်ဆင့် တပ်ဆင်နည်း)

### အဆင့် ၁။ Source Code ကို Clone ရယူပါ (Clone Repository)

Terminal (macOS/Linux) သို့မဟုတ် Command Prompt / PowerShell (Windows) ဖွင့်၍ အောက်ပါ command ကို Run ပါ-

```bash
git clone https://github.com/PhyoeKo/Library-Management-System.git
cd Library-Management-System
```

---

### အဆင့် ၂။ Environment Configuration ဖိုင် ပြင်ဆင်ပါ (.env Setup)

Project root folder ထဲရှိ `.env.example` ဖိုင်ကို `.env` အဖြစ် ကူးယူပါ-

**Windows (Command Prompt):**
```cmd
copy .env.example .env
```

**Windows (PowerShell) / macOS / Linux:**
```bash
cp .env.example .env
```

`.env` ဖိုင်အတွင်း အောက်ပါအတိုင်း ပါဝင်ကြောင်း စစ်ဆေးပါ-
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="super-secret-lms-key-2026"
NEXTAUTH_URL="http://localhost:3000"
```

---

### အဆင့် ၃။ လိုအပ်သော Packages များကို Install ပြုလုပ်ပါ (Install Dependencies)

```bash
npm install
```

> **မှတ်ချက်:** `npm install` ပြုလုပ်ပြီးစီးပါက `prisma generate` command သည် အလိုအလျောက် Run ပြီး Prisma Client ကို generate လုပ်ပေးသွားမည် ဖြစ်ပါသည်။

---

### အဆင့် ၄။ Database ပြင်ဆင်ခြင်း (Database Verification)

Project repository ထဲတွင် မြန်မာစာပေ၊ ဘာသာရပ်ခွဲများနှင့် နမူနာစာရင်းများ ကြိုတင်ထည့်သွင်းထားပြီးဖြစ်သော SQLite Database (`prisma/dev.db`) ပါဝင်ပြီးဖြစ်ပါသည်။ ထို့ကြောင့် ထပ်မံ Setup ပြုလုပ်ရန် မလိုအပ်ဘဲ တိုက်ရိုက်အသုံးပြုနိုင်ပါသည်။

*(အကယ်၍ Database ကို အစမှ ပြန်လည် Reset ချလိုပါက သို့မဟုတ် သန့်ရှင်းစွာ အသစ်ပြန်တည်ဆောက်လိုပါက အောက်ပါ command များကို အသုံးပြုနိုင်ပါသည်)*
```bash
# Database schema ကို sync လုပ်ခြင်း
npx prisma db push

# မြန်မာဂန္တဝင်စာအုပ်များနှင့် အမျိုးအစားများ ထည့်သွင်းခြင်း
node prisma/seed-burmese-books.js
```

---

### အဆင့် ၅။ Local Development Server ကို စတင်ဖွင့်လှစ်ပါ (Start Server)

```bash
npm run dev
```

Server တက်လာပါက Web Browser (Chrome, Edge, Firefox, Safari) ဖွင့်၍ အောက်ပါလိပ်စာသို့ ဝင်ရောက်နိုင်ပါပြီ-

👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🔑 Default Login Accounts (အစမ်းဝင်ရောက်အသုံးပြုနိုင်သော အကောင့်များ)

Login စာမျက်နှာ (`http://localhost:3000/login`) တွင် အောက်ပါ အကောင့်များဖြင့် စမ်းသပ်အသုံးပြုနိုင်ပါသည် (သို့မဟုတ် Login Screen ပေါ်ရှိ Quick Preset ခလုတ်များကို တစ်ချက်နှိပ်ရုံဖြင့် ဝင်ရောက်နိုင်ပါသည်)-

| အခန်းကဏ္ဍ (Role) | အီးမေးလ် (Email) | Barcode / စာကြည့်တိုက်ကုဒ် | စကားဝှက် (Password) | ဝင်ရောက်နိုင်သည့် စာမျက်နှာ |
| :--- | :--- | :--- | :--- | :--- |
| **Chief Librarian (Admin / ဝန်ထမ်း)** | `admin@library.edu` | `STAFF-001` | `demo12345` | `http://localhost:3000/admin` |
| **VIP Member (ဗွီအိုင်ပီ အသင်းဝင်)** | `theinwin.vip@mocht.gov.mm` | `PAT-VIP-001` | `demo12345` | `http://localhost:3000/patron` |
| **General Patron (သာမန် အသင်းဝင်)** | `alex.rivera@student.edu` | `PAT-88401` | `demo12345` | `http://localhost:3000/patron` |

---

## 🧭 Key Routes & Features (အဓိက စာမျက်နှာများ)

- **OPAC Public Catalogue**: `http://localhost:3000` — စာအုပ်များ ရှာဖွေခြင်း၊ Category အလိုက် စစ်ထုတ်ခြင်း၊ E-Book PDF ဖတ်ရှုခြင်း။
- **Admin Command Dashboard**: `http://localhost:3000/admin` — နေ့စဉ် အနှစ်ချုပ် စာရင်းများ။
- **Catalog Management**: `http://localhost:3000/admin/catalog` — စာအုပ်အသစ်ထည့်သွင်းခြင်း၊ နေ့စဉ်ဒဏ်ကြေး (MMK) သတ်မှတ်ခြင်း။
- **Category CRUD**: `http://localhost:3000/admin/categories` — Trending, Latest release စသည့် စာအုပ်ကဏ္ဍခွဲများ စီမံခြင်း။
- **Circulation Desk**: `http://localhost:3000/admin/circulation` — စာအုပ်ငှားရမ်း/အပ်နှံခြင်း (VIP Member +7 Days အလိုအလျောက် သတ်မှတ်မှု)။
- **Patron Management**: `http://localhost:3000/admin/patrons` — အသင်းဝင်များ စာရင်းနှင့် တရားဝင် VIP Member Card (PNG ဒေါင်းလုဒ်ရယူခြင်း)။
- **Reports & Analytics**: `http://localhost:3000/admin/reports` — Date Filter နှင့် Circulation, Fines, Inventory, Patrons, Overdue ဇယားများအား UTF-8 BOM CSV Export ပြုလုပ်ခြင်း။
- **Library Services**: `http://localhost:3000/admin/library-services` — Serials & Periodicals, Interlibrary Loans (ILL), Academic Course Reserves။
- **Acquisitions & ERM**: `http://localhost:3000/admin/acquisitions` — ဝယ်ယူမှုအမှာစာများနှင့် အရောင်းဆိုင်များ စီမံခန့်ခွဲခြင်း။

---

## 🛠️ Production Build (Production အဖြစ် လွှင့်တင်လိုပါက)

```bash
# Production Bundle Build ပြုလုပ်ခြင်း
npm run build

# Production Server စတင်လည်ပတ်ခြင်း
npm run start
```

---

## 📚 Documentation (စာရွက်စာတမ်းနှင့် အသုံးပြုနည်း လက်စွဲများ)

- **PDF User Training Guide**: `docs/MOCHT_LMS_User_Training_Guide.pdf` (၃၁ မျက်နှာပါ မြန်မာဘာသာ ပြည့်စုံသော လက်စွဲစာအုပ်)
- **Netlify Deployable Site**: `docs/netlify-site/index.html` (Online Static Hosting သို့ တင်နိုင်သော Web Documentation)
- **Netlify ZIP Package**: `docs/mocht-lms-docs-netlify.zip`

---

## ❓ Troubleshooting (မကြာခဏ ကြုံတွေ့ရနိုင်သော ပြဿနာများနှင့် ဖြေရှင်းနည်း)

1. **Port 3000 is already in use:**
   - အခြား Program တစ်ခုခုမှ Port 3000 ကို အသုံးပြုနေပါက အောက်ပါ command ဖြင့် အခြား port ဖြင့် ဖွင့်နိုင်ပါသည်-
     ```bash
     npx next dev -p 3001
     ```
2. **Prisma Client not initialized error:**
   - `npx prisma generate` ကို Terminal တွင် run ပေးပါ။
3. **Database file locked or corrupted:**
   - `prisma/dev.db` ကို reset ပြုလုပ်ရန်:
     ```bash
     npx prisma db push --force-reset
     node prisma/seed-burmese-books.js
     ```
