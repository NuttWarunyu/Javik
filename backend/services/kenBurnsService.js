// Ken Burns effect service using FFmpeg
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

const OUTPUT_DIR = path.join(__dirname, '../../output/temp');
const VIDEOS_DIR = path.join(__dirname, '../../output/videos');

// Ensure output directory exists
async function ensureOutputDir() {
  try {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    await fs.mkdir(VIDEOS_DIR, { recursive: true });
  } catch (error) {
    // Directory already exists
  }
}

/**
 * Generate Ken Burns effect for a single image
 * @param {string} imagePath - Path to input image
 * @param {number} duration - Duration in seconds
 * @param {string} effect - Effect type: 'zoomIn', 'zoomOut', 'panLeft', 'panRight', 'panUp', 'panDown'
 * @returns {Promise<string>} Path to generated video
 */
async function createKenBurnsEffect(imagePath, duration, effect = 'zoomIn') {
  await ensureOutputDir();
  
  // Verify image exists and is readable
  try {
    await fs.access(imagePath);
  } catch (err) {
    throw new Error(`Image file not found or not accessible: ${imagePath}`);
  }
  
  const outputPath = path.join(OUTPUT_DIR, `kenburns_${Date.now()}_${Math.random().toString(36).substring(7)}.mp4`);

  // TikTok/Shorts format: 1080x1920 (9:16)
  const width = 1080;
  const height = 1920;
  const fps = 30;

  return new Promise((resolve, reject) => {
    // Use simpler approach: scale + crop with static zoom (more compatible)
    let filterComplex = '';
    
    if (effect === 'zoomIn') {
      // Zoom in: scale larger then crop center
      filterComplex = `scale=iw*1.5:ih*1.5,crop=${width}:${height}:(iw-${width})/2:(ih-${height})/2`;
    } else if (effect === 'zoomOut') {
      // Zoom out: scale to fit
      filterComplex = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black`;
    } else if (effect === 'panLeft') {
      // Pan left: scale larger, crop moving left
      filterComplex = `scale=iw*1.3:ih*1.3,crop=${width}:${height}:0:(ih-${height})/2`;
    } else if (effect === 'panRight') {
      // Pan right: scale larger, crop moving right
      filterComplex = `scale=iw*1.3:ih*1.3,crop=${width}:${height}:(iw-${width}):(ih-${height})/2`;
    } else {
      // Default: center crop
      filterComplex = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black`;
    }

    const command = ffmpeg(imagePath)
      .inputOptions([
        '-loop', '1',
        '-framerate', fps.toString(),
        '-t', duration.toString(),
      ])
      .videoFilters(filterComplex)
      .outputOptions([
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '23',
        '-pix_fmt', 'yuv420p',
        '-r', fps.toString(),
        '-t', duration.toString(),
        '-movflags', '+faststart',
      ])
      .size(`${width}x${height}`)
      .output(outputPath)
      .on('start', (commandLine) => {
        console.log('FFmpeg command:', commandLine);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          console.log(`Processing: ${Math.round(progress.percent)}% done`);
        }
      })
      .on('end', () => {
        // Verify output file exists
        fs.access(outputPath)
          .then(() => {
            console.log(`Ken Burns video created: ${outputPath}`);
            resolve(outputPath);
          })
          .catch((err) => {
            reject(new Error(`Output file was not created: ${err.message}`));
          });
      })
      .on('error', (err) => {
        console.error('FFmpeg error details:', {
          message: err.message,
          code: err.code,
          signal: err.signal,
          imagePath,
          outputPath,
        });
        reject(new Error(`Failed to create Ken Burns effect: ${err.message}`));
      });

    command.run();
  });
}

/**
 * Create video from multiple images with Ken Burns effects
 * @param {Array<string>} imagePaths - Array of image paths
 * @param {number} totalDuration - Total duration in seconds
 * @returns {Promise<string>} Path to combined video
 */
async function createVideoFromImages(imagePaths, totalDuration) {
  await ensureOutputDir();
  
  // Validate input
  if (!imagePaths || imagePaths.length === 0) {
    throw new Error('No images provided. Cannot create video from empty image array.');
  }
  
  // Filter out invalid paths
  const validImagePaths = [];
  for (const imgPath of imagePaths) {
    try {
      await fs.access(imgPath);
      validImagePaths.push(imgPath);
    } catch (err) {
      console.warn(`Image path not accessible: ${imgPath}`);
    }
  }
  
  if (validImagePaths.length === 0) {
    throw new Error('No valid images found. All image paths are invalid or inaccessible.');
  }
  
  const effects = ['zoomIn', 'zoomOut', 'panLeft', 'panRight'];
  const durationPerImage = totalDuration / validImagePaths.length;
  
  const videoPaths = [];
  
  // Create Ken Burns videos for each image
  for (let i = 0; i < validImagePaths.length; i++) {
    const effect = effects[i % effects.length];
    const videoPath = await createKenBurnsEffect(validImagePaths[i], durationPerImage, effect);
    videoPaths.push(videoPath);
  }

  // Concatenate videos
  const concatPath = path.join(OUTPUT_DIR, `concat_${Date.now()}.txt`);
  const concatContent = videoPaths.map((p) => `file '${p}'`).join('\n');
  await fs.writeFile(concatPath, concatContent);

  const outputPath = path.join(OUTPUT_DIR, `combined_${Date.now()}.mp4`);

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(concatPath)
      .inputOptions(['-f', 'concat', '-safe', '0'])
      .outputOptions([
        '-c', 'copy',
        '-t', totalDuration.toString(),
      ])
      .output(outputPath)
      .on('end', () => {
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('FFmpeg concat error:', err);
        reject(new Error(`Failed to concatenate videos: ${err.message}`));
      })
      .run();
  });
}

/**
 * Create solid color background video (fallback when no images)
 * @param {number} duration - Duration in seconds
 * @param {string} color - Hex color code (default: '#1a1a2e' - dark blue)
 * @param {number} width - Video width (default: 1080)
 * @param {number} height - Video height (default: 1920 for 9:16)
 * @returns {Promise<string>} Path to generated video
 */
async function createSolidColorVideo(duration, color = '#1a1a2e', width = 1080, height = 1920) {
  await ensureOutputDir();
  const outputPath = path.join(OUTPUT_DIR, `solid_${Date.now()}.mp4`);

  return new Promise((resolve, reject) => {
    // Create solid color video using FFmpeg
    ffmpeg()
      .input(`color=c=${color}:size=${width}x${height}:duration=${duration}:rate=30`)
      .inputOptions(['-f', 'lavfi'])
      .outputOptions([
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '23',
        '-pix_fmt', 'yuv420p',
        '-t', duration.toString(),
      ])
      .output(outputPath)
      .on('end', () => {
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('FFmpeg solid color error:', err);
        reject(new Error(`Failed to create solid color video: ${err.message}`));
      })
      .run();
  });
}

module.exports = {
  createKenBurnsEffect,
  createVideoFromImages,
  createSolidColorVideo,
};

