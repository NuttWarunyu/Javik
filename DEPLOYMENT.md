# 🚀 Deployment Guide

คู่มือการ deploy โปรเจกต์ TikTok Automation บน Railway (Backend) และ Vercel (Frontend)

---

## 📋 สิ่งที่ต้องเตรียม

### API Keys ที่ต้องมี:

1. **OpenAI API Key** - สำหรับสร้างสคริปต์
   - สมัครที่: https://platform.openai.com/
   - ราคา: ~$0.10-0.50 ต่อวิดีโอ

2. **ElevenLabs API Key** (แนะนำ) หรือ **Google Cloud TTS**
   - ElevenLabs: https://elevenlabs.io/ (ฟรี 10,000 ตัวอักษร/เดือน)
   - Google Cloud TTS: https://cloud.google.com/text-to-speech

3. **Unsplash API Key** หรือ **Pexels API Key**
   - Unsplash: https://unsplash.com/developers (ฟรี 50 requests/hour)
   - Pexels: https://www.pexels.com/api/ (ฟรี 200 requests/hour)

---

## 🔧 Deploy Backend บน Railway

### 1. สร้างโปรเจกต์ใหม่บน Railway

1. ไปที่ https://railway.app
2. คลิก "New Project"
3. เลือก "Deploy from GitHub repo" หรือ "Empty Project"

### 2. Deploy จาก GitHub

1. เชื่อมต่อ GitHub repository
2. Railway จะ detect Dockerfile อัตโนมัติ
3. คลิก "Deploy"

### 3. ตั้งค่า Environment Variables

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

# CORS (optional)
FRONTEND_URL=https://your-vercel-app.vercel.app
```

### 4. ตั้งค่า Domain

1. ไปที่ Settings → Networking
2. คลิก "Generate Domain" หรือเพิ่ม custom domain
3. คัดลอก URL (เช่น: `https://your-app.railway.app`)

### 5. ตรวจสอบการทำงาน

เปิด URL: `https://your-app.railway.app/api/health`

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

## 🌐 Deploy Frontend บน Vercel

### 1. สร้างโปรเจกต์ใหม่บน Vercel

1. ไปที่ https://vercel.com
2. คลิก "Add New Project"
3. เชื่อมต่อ GitHub repository

### 2. ตั้งค่า Build Settings

- **Framework Preset**: Next.js
- **Root Directory**: `frontend`
- **Build Command**: `npm run build` (หรือ `cd frontend && npm run build`)
- **Output Directory**: `.next`

### 3. ตั้งค่า Environment Variables

ไปที่ Settings → Environment Variables และเพิ่ม:

```env
NEXT_PUBLIC_API_URL=https://your-railway-backend-url.railway.app
```

**สำคัญ**: ต้องใช้ `NEXT_PUBLIC_` prefix เพื่อให้ frontend เข้าถึงได้

### 4. อัพเดท vercel.json

แก้ไข `vercel.json` ให้ใช้ Railway backend URL ของคุณ:

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://your-railway-backend-url.railway.app/api/$1"
    }
  ]
}
```

### 5. Deploy

คลิก "Deploy" และรอให้ build เสร็จ

---

## 🔄 การอัพเดท

### Backend (Railway)
- Push code ไปที่ GitHub
- Railway จะ auto-deploy อัตโนมัติ

### Frontend (Vercel)
- Push code ไปที่ GitHub
- Vercel จะ auto-deploy อัตโนมัติ

---

## 🐛 Troubleshooting

### Backend ไม่ทำงาน

1. ตรวจสอบ logs ใน Railway Dashboard
2. ตรวจสอบ Environment Variables ว่าตั้งค่าถูกต้อง
3. ตรวจสอบ FFmpeg installation:
   ```bash
   docker exec -it <container_id> ffmpeg -version
   ```

### Frontend ไม่เชื่อมต่อกับ Backend

1. ตรวจสอบ `NEXT_PUBLIC_API_URL` ใน Vercel
2. ตรวจสอบ CORS settings ใน backend
3. ตรวจสอบ Network tab ใน browser console

### Video creation ล้มเหลว

1. ตรวจสอบ API keys ว่าถูกต้อง
2. ตรวจสอบ logs ใน Railway
3. ตรวจสอบ disk space (videos ใช้พื้นที่มาก)

---

## 💰 Cost Estimate

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

## 📝 Checklist

- [ ] สร้าง Railway project และ deploy backend
- [ ] ตั้งค่า Environment Variables ใน Railway
- [ ] ทดสอบ backend health endpoint
- [ ] สร้าง Vercel project และ deploy frontend
- [ ] ตั้งค่า `NEXT_PUBLIC_API_URL` ใน Vercel
- [ ] อัพเดท `vercel.json` ด้วย Railway URL
- [ ] ทดสอบการสร้างวิดีโอ end-to-end
- [ ] ตั้งค่า custom domain (optional)

---

**พร้อมใช้งานแล้ว!** 🎉

