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

คำแนะนำ:
- เขียนให้เข้าใจง่าย สั้น กระชับ
- ใช้ภาษาที่เป็นธรรมชาติ พูดง่าย
- แคปชั่นควรสั้น 3-5 วินาทีต่อข้อความ
- hashtags 5-10 อัน
- keywords สำหรับหารูปภาพ 3-5 คำ`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview', // หรือ 'gpt-4o' ที่รองรับ json_object
      messages: [
        {
          role: 'system',
          content: 'คุณเป็นผู้เชี่ยวชาญในการสร้างสคริปต์วิดีโอสั้นสำหรับ TikTok และ YouTube Shorts ตอบเป็น JSON เท่านั้น ต้องตอบเป็น JSON format เท่านั้น',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
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

