# 🚀 Push Code ขึ้น GitHub - Javik

## Repository: https://github.com/NuttWarunyu/Javik

---

## 📋 คำสั่งที่ต้องรัน

**รันคำสั่งเหล่านี้ใน Terminal:**

```bash
cd /Users/warunyu/tiktok-automation

# 1. Initialize git (ถ้ายังไม่ได้ทำ)
git init

# 2. เพิ่มไฟล์ทั้งหมด
git add .

# 3. Commit
git commit -m "Initial commit: Javik - TikTok Automation with Draft Mode, Replace Voice, and PIP features"

# 4. เพิ่ม remote repository
git remote add origin https://github.com/NuttWarunyu/Javik.git

# 5. ตั้งค่า branch เป็น main
git branch -M main

# 6. Push code ขึ้น GitHub
git push -u origin main
```

---

## ⚠️ ถ้ามี Error

### ถ้า remote มีอยู่แล้ว:
```bash
git remote set-url origin https://github.com/NuttWarunyu/Javik.git
git push -u origin main
```

### ถ้า branch ไม่ตรงกัน:
```bash
git branch -M main
git push -u origin main
```

### ถ้า push ถูก reject:
```bash
git pull origin main --allow-unrelated-histories
git push -u origin main
```

---

## ✅ หลังจาก Push สำเร็จ

1. ไปที่ https://github.com/NuttWarunyu/Javik
2. ตรวจสอบว่าไฟล์ทั้งหมดขึ้นแล้ว
3. ไปต่อที่ Step 2: Deploy Backend บน Railway

ดูรายละเอียดที่: [`QUICK_DEPLOY.md`](./QUICK_DEPLOY.md)

---

**พร้อม Push แล้ว!** 🎉

