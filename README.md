# 🎬 TikReel Studio

AI-Powered TikTok Reel Template Generator with Paystack paywall and Admin Dashboard.

---

## ⚙️ Setup (do this first)

### 1. Install Node.js
Download from https://nodejs.org (choose LTS version)

### 2. Install dependencies
Open a terminal inside this folder and run:
```bash
npm install
```

### 3. Add your Paystack key
Open `src/App.jsx` and find line 4:
```js
const PAYSTACK_PUBLIC_KEY = "pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxx";
```
Replace with your real key from https://paystack.com → Settings → API Keys

### 4. Change admin password
Same file, line 5:
```js
const ADMIN_PASSWORD = "admin2024";
```
Change to something strong!

### 5. Test locally
```bash
npm run dev
```
Open http://localhost:5173

---

## 🚀 Deploy to Vercel (Free — Recommended)

1. Push this folder to GitHub:
```bash
git init
git add .
git commit -m "TikReel Studio"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/tikreel-studio.git
git push -u origin main
```

2. Go to https://vercel.com → Sign in with GitHub
3. Click **"Add New Project"** → select `tikreel-studio`
4. Leave all settings as default → click **Deploy**
5. ✅ Live at `tikreel-studio.vercel.app`

---

## 🌐 Deploy to Netlify (Free — Drag & Drop)

1. Build the app:
```bash
npm run build
```
2. Go to https://netlify.com → Sites
3. Drag and drop the `dist/` folder
4. ✅ Live instantly

---

## 📄 Deploy to GitHub Pages

1. Edit `vite.config.js` — change base:
```js
base: "/tikreel-studio/",  // must match your repo name
```

2. Deploy:
```bash
npm run deploy
```
3. ✅ Live at `yourusername.github.io/tikreel-studio/`

---

## 📁 Project Structure

```
tikreel-studio/
├── index.html          ← App entry point
├── vite.config.js      ← Build config
├── package.json        ← Dependencies
└── src/
    ├── main.jsx        ← React root
    └── App.jsx         ← Full app (edit this)
```

---

## 💰 Pricing (edit in App.jsx)

| Variable | Default | Meaning |
|---|---|---|
| MONTHLY_AMOUNT | 200000 | ₦2,000 in kobo |
| YEARLY_AMOUNT | 1500000 | ₦15,000 in kobo |
| FREE_LIMIT | 3 | Free generations before paywall |

---

## 🛡️ Admin Dashboard

Access: Click the **🛡️ Admin** button in the header  
Password: `admin2024` (change it!)

Features:
- Revenue overview + 7-day chart
- Subscriber management
- Full payment log
- Manual access grants
- Export CSV
