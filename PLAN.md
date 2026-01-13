# 🎬 TikTok Automation - Implementation Plan

**สร้างคลิปสั้นอัตโนมัติด้วย AI + Ken Burns Effect**

---

## 🎯 Overview

Flow: **พิมพ์หัวข้อ → สร้างสคริปต์ → หารูปภาพ → Zoom/Pan → รวมเสียง → Export**

---

## 🏗️ Architecture

```
User Input → GPT-4 (Script) → ElevenLabs (Voice) → Unsplash (Images) → FFmpeg (Ken Burns) → Final Video
```

---

## 📋 Implementation Steps

### Phase 1: Content Generation
- [ ] สร้างสคริปต์ด้วย GPT-4
- [ ] สร้างแคปชั่น
- [ ] สร้าง hashtags
- [ ] Extract keywords สำหรับหารูป

### Phase 2: Voice Generation
- [ ] ElevenLabs integration
- [ ] หรือ Google Cloud TTS
- [ ] Export เป็น MP3

### Phase 3: Image Search
- [ ] Unsplash API integration
- [ ] หรือ Pexels API
- [ ] Download images

### Phase 4: Ken Burns Effect
- [ ] FFmpeg zoom/pan
- [ ] Create video from images
- [ ] Add transitions

### Phase 5: Video Editing
- [ ] Combine audio + video
- [ ] Add captions
- [ ] Export TikTok format

---

## 💰 Cost Estimate

- GPT-4: $0.10-0.50/คลิป
- ElevenLabs: $0.10-0.30/คลิป
- Images: ฟรี
- FFmpeg: ฟรี
- **Total: ~7-25 บาท/คลิป**

---

## 🚀 Next Steps

1. Setup APIs
2. Implement content generation
3. Implement voice generation
4. Implement image search
5. Implement Ken Burns effect
6. Test end-to-end

---

**Ready to build!** 🎬


