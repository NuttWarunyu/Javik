# 🚀 Quick Deploy Guide - ทำตามนี้เลย!

## ⚡ ขั้นตอนเร็วๆ (5 นาที)

### 1️⃣ สร้าง GitHub Repository

```bash
# 1. ไปที่ https://github.com/new
# 2. ตั้งชื่อ: tiktok-automation
# 3. เลือก Public
# 4. อย่า check "Initialize with README"
# 5. คลิก "Create repository"
```

### 2️⃣ Push Code ขึ้น GitHub

**รันคำสั่งเหล่านี้ใน Terminal:**

```bash
cd /Users/warunyu/tiktok-automation

# ถ้ายังไม่ได้ตั้งค่า Git
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Initialize และ push
git init
git add .
git commit -m "Initial commit: TikTok Automation"

# แทนที่ YOUR_USERNAME ด้วย username ของคุณ
git remote add origin https://github.com/YOUR_USERNAME/tiktok-automation.git
git branch -M main
git push -u origin main
```

### 3️⃣ Deploy Backend บน Railway

1. **ไปที่**: https://railway.app
2. **คลิก**: "New Project" → "Deploy from GitHub repo"
3. **เลือก**: repository `tiktok-automation`
4. **รอ**: Railway จะ deploy อัตโนมัติ

**ตั้งค่า Environment Variables:**
- ไปที่ Settings → Variables
- เพิ่ม API keys ตาม `env.example`
- **สำคัญ**: ต้องมี `OPENAI_API_KEY` อย่างน้อย

**ตั้งค่า Domain:**
- Settings → Networking → Generate Domain
- **คัดลอก URL** (เช่น: `https://xxx.railway.app`)

### 4️⃣ Deploy Frontend บน Vercel

1. **ไปที่**: https://vercel.com
2. **คลิก**: "Add New Project"
3. **เลือก**: repository `tiktok-automation`
4. **ตั้งค่า**:
   - Root Directory: `frontend`
   - Framework: Next.js (auto-detect)
5. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL` = Railway URL จากขั้นตอนที่ 3
6. **คลิก**: Deploy

### 5️⃣ อัพเดท CORS

1. **Railway Dashboard** → Settings → Variables
2. เพิ่ม/แก้ไข: `FRONTEND_URL` = Vercel URL ของคุณ
3. Railway จะ restart อัตโนมัติ

### 6️⃣ ทดสอบ

เปิด Vercel URL ใน browser และทดสอบสร้างวิดีโอ!

---

## 🔑 API Keys ที่ต้องมี

**ขั้นต่ำ:**
- ✅ OpenAI API Key (จำเป็น)

**แนะนำ:**
- ✅ ElevenLabs API Key (เสียงดีกว่า)
- ✅ Unsplash หรือ Pexels API Key (หารูป)

ดูรายละเอียดที่: [`API_KEYS.md`](./API_KEYS.md)

---

## 📝 Checklist

- [ ] สร้าง GitHub repo
- [ ] Push code
- [ ] Deploy Railway (backend)
- [ ] ตั้งค่า API keys ใน Railway
- [ ] Deploy Vercel (frontend)
- [ ] ตั้งค่า `NEXT_PUBLIC_API_URL` ใน Vercel
- [ ] อัพเดท CORS ใน Railway
- [ ] ทดสอบ!

---

**เสร็จแล้ว!** 🎉

ดูรายละเอียดเพิ่มเติมที่: [`DEPLOY_CHECKLIST.md`](./DEPLOY_CHECKLIST.md)

