# 🚀 Getting Started

**โปรเจคแยกจาก PlantPick - TikTok/YouTube Shorts Automation**

---

## 📍 Location

โปรเจคอยู่ที่: `/Users/warunyu/tiktok-automation`

---

## 🎯 Quick Start

### 1. Navigate to Project
```bash
cd /Users/warunyu/tiktok-automation
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Install FFmpeg
```bash
# macOS
brew install ffmpeg

# Check installation
ffmpeg -version
```

### 4. Setup Environment Variables
```bash
cp env.example .env
# Edit .env with your API keys
```

### 5. Test Server
```bash
npm start
# Visit: http://localhost:3003/api/health
```

---

## 📁 Project Structure

```
tiktok-automation/
├── backend/
│   ├── services/        # (จะสร้างทีหลัง)
│   ├── routes/         # (จะสร้างทีหลัง)
│   └── server.js       # ✅ พร้อมแล้ว
├── scripts/
│   └── create-video.js # ✅ พร้อมแล้ว
├── output/
│   ├── videos/        # วิดีโอที่สร้างเสร็จ
│   ├── captions/      # ไฟล์แคปชั่น
│   └── temp/          # ไฟล์ชั่วคราว
├── package.json        # ✅ พร้อมแล้ว
├── README.md          # ✅ พร้อมแล้ว
├── PLAN.md            # ✅ Plan พร้อมแล้ว
└── KEN_BURNS_GUIDE.md # ✅ Guide พร้อมแล้ว
```

---

## 🔑 Required API Keys

1. **OpenAI API** - สร้างสคริปต์
   - Sign up: https://platform.openai.com/
   - Cost: ~$0.10-0.50/คลิป

2. **ElevenLabs** - เสียงพูด AI
   - Sign up: https://elevenlabs.io/
   - Cost: ~$0.10-0.30/คลิป

3. **Unsplash** หรือ **Pexels** - รูปภาพฟรี
   - Unsplash: https://unsplash.com/developers (50 requests/hour)
   - Pexels: https://www.pexels.com/api/ (200 requests/hour)
   - Cost: ฟรี!

---

## 🎬 Next Steps

1. ✅ โครงสร้างโปรเจคพร้อมแล้ว
2. ⚠️ Setup APIs (OpenAI, ElevenLabs, Unsplash/Pexels)
3. ⚠️ Implement services (content, voice, image, kenBurns)
4. ⚠️ Test end-to-end

---

## 📚 Documentation

- `README.md` - Overview
- `PLAN.md` - Implementation plan
- `KEN_BURNS_GUIDE.md` - Ken Burns effect guide

---

**Ready to build!** 🎬


