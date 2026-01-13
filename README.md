# 🎬 Javik - TikTok/YouTube Shorts Automation

**สร้างคลิปสั้นอัตโนมัติด้วย AI + Ken Burns Effect**

---

## 🎯 เป้าหมาย

พิมพ์เนื้อหาที่อยากทำ → AI สร้างคลิปให้อัตโนมัติ:
- ✅ สร้างสคริปต์
- ✅ สร้างเสียงพูด (AI Voice)
- ✅ หารูปภาพอัตโนมัติ
- ✅ Ken Burns Effect (Zoom/Pan)
- ✅ เพิ่มแคปชั่น
- ✅ Export TikTok/Shorts format

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Install FFmpeg
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html
```

### 3. Setup Environment Variables
```bash
cp env.example .env
# Edit .env with your API keys
```

### 4. Create Your First Video
```bash
npm run create-video "สอนปลูกต้นไม้"
```

---

## 📁 Project Structure

```
tiktok-automation/
├── backend/
│   ├── services/        # Business logic
│   │   ├── contentService.js    # Script generation
│   │   ├── voiceService.js     # Text-to-Speech
│   │   ├── imageService.js     # Image search
│   │   ├── kenBurnsService.js  # Ken Burns effect
│   │   ├── editorService.js    # Video editing
│   │   └── jobService.js       # Async job processing
│   ├── routes/         # API endpoints
│   │   └── videoRoutes.js
│   └── server.js       # Express server
├── frontend/           # Next.js frontend (mobile-first)
│   ├── app/           # Next.js app directory
│   ├── components/   # React components
│   └── package.json
├── scripts/
│   └── create-video.js # CLI script
├── output/
│   ├── videos/         # Generated videos
│   ├── captions/       # Caption files
│   └── temp/          # Temporary files
├── Dockerfile          # For Railway deployment
├── railway.json        # Railway configuration
├── vercel.json         # Vercel configuration
├── package.json
├── .env
└── README.md
```

---

## 🎯 Features

- ✅ **Mobile-First Design** - ออกแบบสำหรับมือถือเป็นหลัก
- ✅ **Draft Mode** - สร้าง 3 versions: draft, no-voice, script with timing
- ✅ **Replace Voice Mode** - แทนที่เสียง AI ด้วยเสียง user
- ✅ **Picture-in-Picture Mode** - วาง user video ทับ B-roll background
- ✅ **Background Removal** - ตัดพื้นหลังด้วย chromakey (green/blue screen)
- ✅ สร้างสคริปต์อัตโนมัติ (GPT-4)
- ✅ สร้างเสียงพูด (ElevenLabs/Google TTS)
- ✅ หารูปภาพอัตโนมัติ (Unsplash/Pexels)
- ✅ Ken Burns Effect (Zoom/Pan)
- ✅ เพิ่มแคปชั่น
- ✅ Export TikTok/Shorts format (9:16, 60s)
- ✅ Async Job Processing - รองรับการสร้างวิดีโอที่ใช้เวลานาน
- ✅ Production Ready - พร้อม deploy บน Railway และ Vercel

---

## 💰 Cost

- **Per Video**: ~7-25 บาท
- **Monthly (100 videos)**: ~700-2,500 บาท

---

## 📝 Commands

### Backend
```bash
# Start server
npm start

# Development mode (with auto-reload)
npm run dev

# Create video via CLI
npm run create-video "หัวข้อวิดีโอ"
```

### Frontend
```bash
# Install frontend dependencies
cd frontend && npm install

# Development mode
npm run dev:frontend

# Build for production
npm run build:frontend
```

### Install All Dependencies
```bash
npm run install:all
```

---

## 🔧 Requirements

- Node.js 18+
- FFmpeg
- API Keys:
  - OpenAI API
  - ElevenLabs API (or Google Cloud TTS)
  - Unsplash API (or Pexels API)

---

## 🌐 Deployment

โปรเจกต์นี้พร้อม deploy บน:
- **Backend**: Railway (รองรับ Docker และ FFmpeg)
- **Frontend**: Vercel (Next.js)

ดูคู่มือการ deploy ที่: [`DEPLOYMENT.md`](./DEPLOYMENT.md)

### Quick Deploy

1. **Backend (Railway)**:
   - Push code ไปที่ GitHub
   - สร้างโปรเจกต์ใหม่บน Railway
   - Deploy จาก GitHub repo
   - ตั้งค่า Environment Variables (ดู `env.example`)

2. **Frontend (Vercel)**:
   - สร้างโปรเจกต์ใหม่บน Vercel
   - ตั้งค่า Root Directory เป็น `frontend`
   - ตั้งค่า `NEXT_PUBLIC_API_URL` เป็น Railway backend URL
   - Deploy

## 📚 Documentation

- [`FEATURES.md`](./FEATURES.md) - คู่มือการใช้ Features ต่างๆ (Draft, Replace Voice, PIP)
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) - คู่มือการ deploy บน Railway และ Vercel
- [`API_KEYS.md`](./API_KEYS.md) - คู่มือการขอ API Keys
- [`PLAN.md`](./PLAN.md) - Detailed implementation plan
- [`KEN_BURNS_GUIDE.md`](./KEN_BURNS_GUIDE.md) - Ken Burns effect guide
- [`GETTING_STARTED.md`](./GETTING_STARTED.md) - Getting started guide

## 🔑 API Keys Required

ดูรายละเอียดที่ [`env.example`](./env.example):

1. **OpenAI API Key** - สำหรับสร้างสคริปต์
2. **ElevenLabs API Key** หรือ **Google Cloud TTS** - สำหรับสร้างเสียง
3. **Unsplash API Key** หรือ **Pexels API Key** - สำหรับหารูปภาพ

---

**Let's create viral content!** 🚀


