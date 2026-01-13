# 🎬 Features Guide

คู่มือการใช้ Features ต่างๆ ของ TikTok Automation

---

## 📋 Modes

### 1. Draft Mode (Default) 🎨

สร้าง 3 versions ของวิดีโอ:

- **video_draft.mp4** - วิดีโอเต็ม + AI voice + captions (สำหรับ preview)
- **video_no_voice.mp4** - วิดีโอเดียวกัน แต่ไม่มีเสียง (สำหรับพากย์เอง)
- **script_with_timing.txt** - Script แบ่งตาม timestamp

#### วิธีใช้:

```bash
# API
POST /api/video/create
{
  "topic": "สอนปลูกต้นไม้",
  "duration": 60,
  "mode": "draft"
}
```

#### Response:

```json
{
  "success": true,
  "jobId": "abc123...",
  "status": "processing",
  "mode": "draft"
}
```

#### เมื่อเสร็จแล้ว:

```json
{
  "success": true,
  "status": "completed",
  "draft": {
    "url": "/api/video/download/draft/video_draft_123.mp4",
    "filename": "video_draft_123.mp4"
  },
  "noVoice": {
    "url": "/api/video/download/no_voice/video_no_voice_123.mp4",
    "filename": "video_no_voice_123.mp4"
  },
  "script": {
    "url": "/api/video/download/scripts/script_123.txt",
    "filename": "script_123.txt"
  },
  "scriptText": "รู้ไหมว่ามีดอกไม้ที่เรียกว่าดอกศพ...",
  "hashtags": ["#ดอกไม้", "#TitanArum"],
  "captions": [...]
}
```

#### Script Format:

```
[00:00-00:05] รู้ไหมว่ามีดอกไม้ที่เรียกว่าดอกศพ
[00:05-00:12] นี่คือ Titan Arum ดอกไม้ที่ใหญ่ที่สุดในโลก
[00:12-00:20] ที่เหม็นแบบนี้เพราะมันต้องล่อแมลงวัน
```

---

### 2. Replace Voice Mode 🎤

แทนที่เสียง AI ด้วยเสียงของ user

#### วิธีใช้:

```bash
# API
POST /api/video/replace-voice
Content-Type: multipart/form-data

videoPath: /path/to/video_no_voice.mp4
audio: (file) my_voice.mp3
```

#### Response:

```json
{
  "success": true,
  "video": {
    "url": "/api/video/download/video_replaced_voice_123.mp4",
    "filename": "video_replaced_voice_123.mp4"
  }
}
```

#### Process:

1. อัพโหลดไฟล์วิดีโอ (no_voice version)
2. อัพโหลดไฟล์เสียง (MP3, WAV)
3. ระบบจะ sync audio กับ video:
   - ถ้า audio สั้นกว่า → pad silence
   - ถ้า audio ยาวกว่า → trim
4. Export วิดีโอใหม่

---

### 3. Picture-in-Picture Mode (PIP) 📹

วาง user video ทับ B-roll background

#### วิธีใช้:

```bash
# API
POST /api/video/pip
Content-Type: multipart/form-data

broll: (file) background_video.mp4
person: (file) me_talking.mp4
position: bottom-right
personSize: 0.3
removeBg: true
```

#### Options:

- **position**: `bottom-right`, `bottom-left`, `top-right`, `top-left`, `center-bottom`
- **personSize**: 0.1 - 0.5 (10% - 50% of screen)
- **removeBg**: `true` / `false` (ใช้ chromakey สำหรับ green/blue screen)

#### Response:

```json
{
  "success": true,
  "video": {
    "url": "/api/video/download/video_pip_123.mp4",
    "filename": "video_pip_123.mp4"
  }
}
```

#### Process:

1. อัพโหลด B-roll background video
2. อัพโหลด person video (คุณพูด)
3. ถ้า `removeBg=true`: ตัดพื้นหลังด้วย chromakey
4. Resize person video ตาม `personSize`
5. วาง person video ตาม `position`
6. Export วิดีโอใหม่

---

### 4. Final Mode 🎬

สร้างวิดีโอเดียวแบบ final (เหมือนเดิม)

#### วิธีใช้:

```bash
# API
POST /api/video/create
{
  "topic": "สอนปลูกต้นไม้",
  "duration": 60,
  "mode": "final"
}
```

---

## 🔧 Background Removal

### Chromakey Method

ใช้สำหรับวิดีโอที่มี green screen หรือ blue screen

```javascript
// API
POST /api/video/pip
{
  "removeBg": true,
  // หรือใช้ service โดยตรง
}
```

### Options:

- **color**: `0x00ff00` (green) หรือ `0x0000ff` (blue)
- **similarity**: 0.0 - 1.0 (default: 0.3)
- **blend**: 0.0 - 1.0 (default: 0.1)

---

## 📊 Workflow Examples

### Workflow 1: Draft → Replace Voice

1. สร้างวิดีโอด้วย Draft Mode
2. ดาวน์โหลด `video_no_voice.mp4` และ `script.txt`
3. พากย์เสียงเองตาม script
4. อัพโหลดเสียงไปที่ Replace Voice API
5. ได้วิดีโอสำเร็จพร้อมเสียงของคุณ

### Workflow 2: Draft → PIP

1. สร้างวิดีโอด้วย Draft Mode
2. ดาวน์โหลด `video_no_voice.mp4` (ใช้เป็น B-roll)
3. ถ่ายวิดีโอตัวเองพูด (แนะนำใช้ green screen)
4. อัพโหลดทั้ง 2 ไฟล์ไปที่ PIP API
5. ได้วิดีโอ Picture-in-Picture

### Workflow 3: Final (Quick)

1. สร้างวิดีโอด้วย Final Mode
2. ได้วิดีโอสำเร็จพร้อม AI voice ทันที

---

## 💡 Tips

### สำหรับ Replace Voice:

- ใช้ `video_no_voice.mp4` จาก Draft Mode
- อัดเสียงให้ชัดเจน
- ตาม timing ใน script.txt

### สำหรับ PIP:

- ถ่ายวิดีโอตัวเองด้วย green screen จะได้ผลดีที่สุด
- ใช้ `personSize: 0.3` (30%) สำหรับ TikTok/Shorts
- Position `bottom-right` หรือ `center-bottom` ดูดีที่สุด

### สำหรับ Background Removal:

- ใช้ green screen (`0x00ff00`) หรือ blue screen (`0x0000ff`)
- แสงสว่างสม่ำเสมอจะได้ผลดีกว่า
- ปรับ `similarity` ถ้าตัดพื้นหลังไม่ดี

---

## 🚀 API Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/video/create` | POST | สร้างวิดีโอ (draft/final mode) |
| `/api/video/status/:jobId` | GET | ดูสถานะ job |
| `/api/video/replace-voice` | POST | แทนที่เสียง |
| `/api/video/pip` | POST | สร้าง PIP video |
| `/api/video/download/:filename` | GET | ดาวน์โหลดวิดีโอ |
| `/api/video/download/draft/:filename` | GET | ดาวน์โหลด draft |
| `/api/video/download/no_voice/:filename` | GET | ดาวน์โหลด no-voice |
| `/api/video/download/scripts/:filename` | GET | ดาวน์โหลด script |

---

**พร้อมใช้งานแล้ว!** 🎉

