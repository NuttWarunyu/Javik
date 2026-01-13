// Background removal service using FFmpeg chromakey and segmentation
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

const OUTPUT_DIR = path.join(__dirname, '../../output/temp');

/**
 * Remove background from video using chromakey (green/blue screen)
 * @param {string} videoPath - Path to input video
 * @param {Object} options - Removal options
 * @param {string} options.color - Color to remove (hex: '0x00ff00' for green, '0x0000ff' for blue)
 * @param {number} options.similarity - Similarity threshold (0.0-1.0)
 * @param {number} options.blend - Blend amount (0.0-1.0)
 * @param {string} outputPath - Output path (optional)
 * @returns {Promise<string>} Path to output video
 */
async function removeBackgroundChromakey(videoPath, options = {}, outputPath = null) {
  if (!outputPath) {
    const timestamp = Date.now();
    outputPath = path.join(OUTPUT_DIR, `video_nobg_${timestamp}.mp4`);
  }

  const {
    color = '0x00ff00', // Green screen default
    similarity = 0.3,
    blend = 0.1,
  } = options;

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .videoFilters([
        {
          filter: 'chromakey',
          options: `color=${color}:similarity=${similarity}:blend=${blend}`,
        },
      ])
      .outputOptions([
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '23',
        '-pix_fmt', 'yuva420p', // Support alpha channel
        '-c:a', 'copy',
      ])
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', (err) => {
        console.error('Background removal error:', err);
        reject(new Error(`Failed to remove background: ${err.message}`));
      })
      .run();
  });
}

/**
 * Remove background using segmentation (more advanced, requires additional setup)
 * Note: This is a placeholder. For production, consider using:
 * - MediaPipe Selfie Segmentation
 * - TensorFlow.js BodyPix
 * - Or external API services
 * 
 * @param {string} videoPath - Path to input video
 * @param {string} outputPath - Output path (optional)
 * @returns {Promise<string>} Path to output video
 */
async function removeBackgroundSegmentation(videoPath, outputPath = null) {
  // TODO: Implement segmentation-based background removal
  // This would require additional ML models or external services
  
  throw new Error('Segmentation-based background removal not yet implemented. Use chromakey method for green/blue screen videos.');
}

/**
 * Auto-detect and remove background
 * @param {string} videoPath - Path to input video
 * @param {Object} options - Removal options
 * @returns {Promise<string>} Path to output video
 */
async function removeBackground(videoPath, options = {}) {
  const { method = 'chromakey' } = options;

  if (method === 'chromakey') {
    return removeBackgroundChromakey(videoPath, options);
  } else if (method === 'segmentation') {
    return removeBackgroundSegmentation(videoPath, options.outputPath);
  } else {
    throw new Error(`Unknown background removal method: ${method}`);
  }
}

module.exports = {
  removeBackground,
  removeBackgroundChromakey,
  removeBackgroundSegmentation,
};

