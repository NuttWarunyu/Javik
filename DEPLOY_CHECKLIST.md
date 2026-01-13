# ✅ Deploy Checklist - ทำตามลำดับ

## 📋 ขั้นตอนการ Deploy เป็น Public

### Step 1: Setup GitHub Repository

#### 1.1 สร้าง GitHub Repository

1. ไปที่ https://github.com/new
2. ตั้งชื่อ: `tiktok-automation` (หรือชื่ออื่นที่ต้องการ)
3. เลือก **Public** หรือ **Private**
4. **อย่า** check "Initialize this repository with a README"
5. คลิก **"Create repository"**

#### 1.2 Push Code ขึ้น GitHub

เปิด Terminal และรันคำสั่งเหล่านี้:

```bash
cd /Users/warunyu/tiktok-automation

# Initialize git
git init

# เพิ่มไฟล์ทั้งหมด
git add .

# Commit
git commit -m "Initial commit: TikTok Automation with Draft Mode, Replace Voice, and PIP features"

# เพิ่ม remote (แทนที่ YOUR_USERNAME ด้วย username ของคุณ)
git remote add origin https://github.com/YOUR_USERNAME/tiktok-automation.git

# ตั้งค่า branch เป็น main
git branch -M main

# Push code
git push -u origin main
```

---

### Step 2: Deploy Backend บน Railway

#### 2.1 สร้าง Railway Project

1. ไปที่ https://railway.app
2. คลิก **"New Project"**
3. เลือก **"Deploy from GitHub repo"**
4. เลือก repository `tiktok-automation`
5. Railway จะ detect Dockerfile อัตโนมัติ

#### 2.2 ตั้งค่า Environment Variables

ไปที่ Settings → Variables และเพิ่ม:

```env
# OpenAI
OPENAI_API_KEY=sk-your_openai_key_here

# Voice (เลือกอย่างใดอย่างหนึ่ง)
ELEVENLABS_API_KEY=your_elevenlabs_key_here
# หรือ
GOOGLE_CLOUD_TTS_KEY=your_google_cloud_key_here
GOOGLE_CLOUD_TTS_PROJECT_ID=your_project_id

# Images (เลือกอย่างใดอย่างหนึ่ง)
UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
# หรือ
PEXELS_API_KEY=your_pexels_api_key_here

# Server
PORT=3003
NODE_ENV=production

# CORS (จะตั้งทีหลังเมื่อได้ Vercel URL)
FRONTEND_URL=https://your-vercel-app.vercel.app
```

#### 2.3 ตั้งค่า Domain

1. ไปที่ Settings → Networking
2. คลิก **"Generate Domain"** หรือเพิ่ม custom domain
3. **คัดลอก URL** (เช่น: `https://tiktok-automation-production.up.railway.app`)

#### 2.4 ตรวจสอบการทำงาน

เปิด URL: `https://your-railway-url.railway.app/api/health`

ควรเห็น:
```json
{
  "success": true,
  "message": "TikTok Automation API is running",
  "timestamp": "...",
  "environment": "production"
}
```

---

### Step 3: Deploy Frontend บน Vercel

#### 3.1 สร้าง Vercel Project

1. ไปที่ https://vercel.com
2. คลิก **"Add New Project"**
3. เลือก repository `tiktok-automation`
4. ตั้งค่า:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `.next`

#### 3.2 ตั้งค่า Environment Variables

ไปที่ Settings → Environment Variables และเพิ่ม:

```env
NEXT_PUBLIC_API_URL=https://your-railway-backend-url.railway.app
```

**สำคัญ**: แทนที่ `your-railway-backend-url.railway.app` ด้วย Railway URL ที่ได้จาก Step 2.3

#### 3.3 อัพเดท vercel.json

แก้ไข `vercel.json` ให้ใช้ Railway backend URL:

```json
{
  "version": 2,
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/.next",
  "framework": "nextjs",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://your-railway-backend-url.railway.app/api/$1"
    }
  ],
  "env": {
    "NEXT_PUBLIC_API_URL": "https://your-railway-backend-url.railway.app"
  }
}
```

#### 3.4 Deploy

คลิก **"Deploy"** และรอให้ build เสร็จ

#### 3.5 ตั้งค่า Custom Domain (Optional)

1. ไปที่ Settings → Domains
2. เพิ่ม domain ที่ต้องการ (เช่น: `tiktok-automation.yourdomain.com`)

---

### Step 4: อัพเดท CORS ใน Railway

หลังจากได้ Vercel URL แล้ว:

1. ไปที่ Railway Dashboard
2. Settings → Variables
3. อัพเดท `FRONTEND_URL` เป็น Vercel URL ของคุณ
4. Railway จะ restart อัตโนมัติ

---

### Step 5: ทดสอบ End-to-End

1. เปิด Vercel URL ใน browser
2. พิมพ์หัวข้อวิดีโอ
3. คลิก "สร้างวิดีโอ"
4. รอให้สร้างเสร็จ
5. ดาวน์โหลดวิดีโอ

---

## 🔑 API Keys ที่ต้องมี

ดูรายละเอียดที่ [`API_KEYS.md`](./API_KEYS.md):

1. ✅ **OpenAI API Key** - สำหรับสร้างสคริปต์
2. ✅ **ElevenLabs API Key** (แนะนำ) หรือ **Google Cloud TTS** - สำหรับสร้างเสียง
3. ✅ **Unsplash API Key** หรือ **Pexels API Key** - สำหรับหารูปภาพ

---

## ⚠️ สิ่งที่ต้องระวัง

1. **อย่า commit `.env` file** - ตรวจสอบว่า `.gitignore` มี `.env` อยู่แล้ว
2. **ตั้งค่า Environment Variables ใน Railway และ Vercel** - อย่า hardcode ใน code
3. **ตรวจสอบ CORS** - ตั้งค่า `FRONTEND_URL` ใน Railway
4. **ตรวจสอบ Disk Space** - Railway free tier มีจำกัด

---

## 📊 Cost Estimate

### Railway (Backend)
- **Free Tier**: $5 credit/เดือน
- **Pro**: $20/เดือน (unlimited)

### Vercel (Frontend)
- **Free Tier**: Unlimited projects
- **Pro**: $20/เดือน (สำหรับ production)

### API Costs (ต่อวิดีโอ)
- OpenAI GPT-4: ~$0.10-0.50
- ElevenLabs: ~$0.10-0.30 (หรือฟรี tier)
- Images: ฟรี
- **Total: ~7-25 บาท/วิดีโอ**

---

## ✅ Checklist

- [ ] สร้าง GitHub repository
- [ ] Push code ขึ้น GitHub
- [ ] สร้าง Railway project และ deploy backend
- [ ] ตั้งค่า Environment Variables ใน Railway
- [ ] ทดสอบ backend health endpoint
- [ ] สร้าง Vercel project และ deploy frontend
- [ ] ตั้งค่า `NEXT_PUBLIC_API_URL` ใน Vercel
- [ ] อัพเดท `vercel.json` ด้วย Railway URL
- [ ] อัพเดท `FRONTEND_URL` ใน Railway
- [ ] ทดสอบการสร้างวิดีโอ end-to-end
- [ ] ตั้งค่า custom domain (optional)

---

## 🆘 Troubleshooting

### Backend ไม่ทำงาน
- ตรวจสอบ logs ใน Railway Dashboard
- ตรวจสอบ Environment Variables
- ตรวจสอบ FFmpeg installation

### Frontend ไม่เชื่อมต่อกับ Backend
- ตรวจสอบ `NEXT_PUBLIC_API_URL` ใน Vercel
- ตรวจสอบ CORS settings ใน Railway
- ตรวจสอบ Network tab ใน browser console

### Video creation ล้มเหลว
- ตรวจสอบ API keys
- ตรวจสอบ logs ใน Railway
- ตรวจสอบ disk space

---

**พร้อม Deploy แล้ว!** 🚀

