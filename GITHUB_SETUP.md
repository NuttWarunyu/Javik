# 📦 GitHub Setup Guide

คู่มือการสร้าง GitHub repository และ push code ขึ้น GitHub

---

## 🚀 ขั้นตอนการ Setup GitHub

### 1. สร้าง GitHub Repository

#### วิธีที่ 1: สร้างผ่านเว็บไซต์ (แนะนำ)

1. ไปที่ https://github.com
2. คลิก **"+"** ที่มุมขวาบน → **"New repository"**
3. ตั้งชื่อ repository: `tiktok-automation` (หรือชื่ออื่นที่ต้องการ)
4. เลือก **Public** หรือ **Private**
5. **อย่า** check "Initialize this repository with a README" (เพราะเรามี code อยู่แล้ว)
6. คลิก **"Create repository"**

#### วิธีที่ 2: ใช้ GitHub CLI

```bash
gh repo create tiktok-automation --public --source=. --remote=origin --push
```

---

### 2. Initialize Git และ Push Code

เปิด Terminal ในโปรเจกต์และรันคำสั่งต่อไปนี้:

```bash
# 1. ไปที่โฟลเดอร์โปรเจกต์
cd /Users/warunyu/tiktok-automation

# 2. Initialize git repository
git init

# 3. เพิ่มไฟล์ทั้งหมด
git add .

# 4. Commit ครั้งแรก
git commit -m "Initial commit: TikTok Automation with mobile-first design and production-ready setup"

# 5. เพิ่ม remote repository (แทนที่ YOUR_USERNAME ด้วย username ของคุณ)
git remote add origin https://github.com/YOUR_USERNAME/tiktok-automation.git

# 6. Push code ขึ้น GitHub
git branch -M main
git push -u origin main
```

---

### 3. ตรวจสอบว่า Push สำเร็จ

1. ไปที่ https://github.com/YOUR_USERNAME/tiktok-automation
2. ควรเห็นไฟล์ทั้งหมดใน repository

---

## 🔐 การตั้งค่า Git (ถ้ายังไม่ได้ตั้งค่า)

ถ้ายังไม่ได้ตั้งค่า Git username และ email:

```bash
# ตั้งค่า username
git config --global user.name "Your Name"

# ตั้งค่า email
git config --global user.email "your.email@example.com"
```

---

## 📝 คำสั่ง Git ที่ใช้บ่อย

### เพิ่มไฟล์ใหม่
```bash
git add .
git commit -m "Description of changes"
git push
```

### ดูสถานะ
```bash
git status
```

### ดู history
```bash
git log
```

### Pull code ล่าสุด
```bash
git pull
```

---

## ⚠️ สิ่งที่ต้องระวัง

1. **อย่า commit `.env` file** - ไฟล์นี้มี API keys ที่สำคัญ
2. **ตรวจสอบ `.gitignore`** - ต้องมีไฟล์ต่อไปนี้:
   - `.env`
   - `node_modules/`
   - `output/`
   - `*.mp4`, `*.mp3`

3. **ถ้า push `.env` ไปแล้ว** - ต้อง:
   - ลบ `.env` ออกจาก Git history
   - เปลี่ยน API keys ทั้งหมดทันที
   - เพิ่ม `.env` ใน `.gitignore`

---

## 🔄 หลังจาก Push Code แล้ว

1. **Deploy Backend บน Railway**:
   - เชื่อมต่อ GitHub repository
   - Railway จะ auto-deploy เมื่อมี push ใหม่

2. **Deploy Frontend บน Vercel**:
   - เชื่อมต่อ GitHub repository
   - ตั้งค่า Root Directory เป็น `frontend`
   - Vercel จะ auto-deploy เมื่อมี push ใหม่

---

## ✅ Checklist

- [ ] สร้าง GitHub repository
- [ ] Initialize git (`git init`)
- [ ] เพิ่มไฟล์ (`git add .`)
- [ ] Commit (`git commit`)
- [ ] เพิ่ม remote (`git remote add origin`)
- [ ] Push code (`git push`)
- [ ] ตรวจสอบบน GitHub ว่า code ขึ้นแล้ว
- [ ] เชื่อมต่อ Railway กับ GitHub
- [ ] เชื่อมต่อ Vercel กับ GitHub

---

**พร้อม Deploy แล้ว!** 🎉

ดูคู่มือการ deploy ที่ [`DEPLOYMENT.md`](./DEPLOYMENT.md)

