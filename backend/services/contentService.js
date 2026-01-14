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
  "script": "ข้อความสคริปต์เต็ม...",
  "captions": [
    {"text": "ข้อความแคปชั่น", "startTime": 0, "duration": 3},
    {"text": "ข้อความแคปชั่น", "startTime": 3, "duration": 3}
  ],
  "hashtags": ["#hashtag1", "#hashtag2"],
  "keywords": ["keyword1", "keyword2"]
}

คำแนะนำสำคัญ:
- เริ่มต้นด้วย HOOK ที่น่าสนใจ (คำถาม, ข้อเท็จจริงที่น่าตกใจ, หรือประโยคที่ดึงดูดความสนใจ)
- ใช้ภาษาที่เป็นธรรมชาติ พูดง่าย ไม่หุ่นยนต์
- เพิ่มอารมณ์และความรู้สึก (ตื่นเต้น, ประหลาดใจ, สนุก)
- ใช้คำถามเพื่อดึงดูดความสนใจ
- แคปชั่นควรสั้น 3-5 วินาทีต่อข้อความ
- hashtags 5-10 อัน
- keywords สำหรับหารูปภาพ: ต้องเป็นคำที่ตรงกับหัวข้อ "${topic}" โดยตรง (เช่น ถ้าหัวข้อคือ "Red Handfish" keywords ต้องเป็น "red handfish", "handfish", "fish" ไม่ใช่คำทั่วไป)`;

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
    
    return {
      script: content.script || '',
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

