// Content generation service using OpenAI
const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate script for video
 * @param {string} topic - Video topic
 * @param {number} duration - Duration in seconds (default: 60)
 * @returns {Promise<Object>} Script with text, captions, hashtags, and keywords
 */
async function generateScript(topic, duration = 60) {
  try {
    const prompt = `สร้างสคริปต์สำหรับวิดีโอ TikTok/YouTube Shorts เรื่อง "${topic}"

ความยาว: ${duration} วินาที (ประมาณ ${Math.floor(duration / 2.5)} คำ)

รูปแบบการตอบ:
{
  "hook": "HOOK ที่น่าสนใจ (3 วินาทีแรก)",
  "script": "ข้อความสคริปต์เต็ม...",
  "midHook": "MID-HOOK สำหรับกลางวิดีโอ (optional)",
  "cta": "CALL-TO-ACTION สำหรับท้ายวิดีโอ",
  "captions": [
    {"text": "ข้อความแคปชั่น", "startTime": 0, "duration": 3},
    {"text": "ข้อความแคปชั่น", "startTime": 3, "duration": 3}
  ],
  "hashtags": ["#hashtag1", "#hashtag2"],
  "keywords": ["keyword1", "keyword2"]
}

คำแนะนำสำคัญสำหรับวิดีโอที่ทำให้ช่องดัง:
- HOOK (3 วินาทีแรก): ต้องดึงดูดทันที! ใช้:
  * คำถามที่น่าสนใจ ("รู้ไหมว่า...", "เคยเห็น...ไหม")
  * ข้อเท็จจริงที่น่าตกใจ (ตัวเลข, สถิติ)
  * ประโยคที่สร้างความอยากรู้ ("สิ่งนี้จะเปลี่ยนชีวิตคุณ")
  * คำสั่งที่ชัดเจน ("ดูนี่!", "หยุด! ต้องดู")
- เนื้อหา: ใช้ภาษาธรรมชาติ พูดง่าย ไม่หุ่นยนต์ เพิ่มอารมณ์ (ตื่นเต้น, ประหลาดใจ, สนุก)
- MID-HOOK (กลางวิดีโอ): เพิ่ม suspense หรือ cliffhanger เพื่อให้ดูต่อ
- CALL-TO-ACTION (ท้ายวิดีโอ): 
  * "กดไลค์ถ้าชอบ!"
  * "คอมเมนต์บอกความคิดเห็น"
  * "แชร์ให้เพื่อนดู!"
  * "กดติดตามเพื่อไม่พลาดคลิปใหม่"
- แคปชั่น: สั้น 3-5 วินาทีต่อข้อความ, ใช้ตัวหนา, สีสัน, emoji
- hashtags: 10-15 อัน รวม trending hashtags, niche hashtags, และ branded hashtags
- keywords สำหรับหารูปภาพ: ต้องเป็นคำที่ตรงกับหัวข้อ "${topic}" โดยตรง (เช่น ถ้าหัวข้อคือ "Red Handfish" keywords ต้องเป็น "red handfish", "handfish", "fish" ไม่ใช่คำทั่วไป)

รูปแบบการตอบต้องมี:
{
  "hook": "HOOK ที่น่าสนใจ (3 วินาทีแรก)",
  "script": "ข้อความสคริปต์เต็ม...",
  "midHook": "MID-HOOK สำหรับกลางวิดีโอ (optional)",
  "cta": "CALL-TO-ACTION สำหรับท้ายวิดีโอ",
  "captions": [...],
  "hashtags": [...],
  "keywords": [...]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview', // หรือ 'gpt-4o' ที่รองรับ json_object
      messages: [
        {
          role: 'system',
          content: 'คุณเป็นผู้เชี่ยวชาญในการสร้างสคริปต์วิดีโอสั้นสำหรับ TikTok และ YouTube Shorts ที่น่าสนใจและดึงดูดความสนใจ ใช้ภาษาธรรมชาติ มี hook ที่น่าสนใจ และ keywords ต้องตรงกับหัวข้อโดยตรง ตอบเป็น JSON เท่านั้น',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.9, // เพิ่ม temperature เพื่อให้มีความสร้างสรรค์มากขึ้น
      response_format: { type: 'json_object' },
    });

    const content = JSON.parse(response.choices[0].message.content);
    
    // Combine hook + script + midHook + cta into full script
    let fullScript = '';
    if (content.hook) {
      fullScript += content.hook + ' ';
    }
    if (content.script) {
      fullScript += content.script;
    }
    if (content.midHook) {
      // Insert midHook at 60% of duration
      const midPoint = Math.floor(fullScript.length * 0.6);
      fullScript = fullScript.slice(0, midPoint) + ' ' + content.midHook + ' ' + fullScript.slice(midPoint);
    }
    if (content.cta) {
      fullScript += ' ' + content.cta;
    }
    
    return {
      hook: content.hook || '',
      script: fullScript.trim() || content.script || '',
      midHook: content.midHook || '',
      cta: content.cta || '',
      captions: content.captions || [],
      hashtags: content.hashtags || [],
      keywords: content.keywords || [],
    };
  } catch (error) {
    console.error('Error generating script:', error);
    throw new Error(`Failed to generate script: ${error.message}`);
  }
}

module.exports = {
  generateScript,
};

