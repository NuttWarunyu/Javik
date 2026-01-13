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
  const outputPath = path.join(OUTPUT_DIR, `kenburns_${Date.now()}_${Math.random().toString(36).substring(7)}.mp4`);

  // TikTok/Shorts format: 1080x1920 (9:16)
  const width = 1080;
  const height = 1920;

  // Effect configurations
  const effects = {
    zoomIn: {
      scale: 'scale=iw*1.2:ih*1.2',
      crop: `crop=${width}:${height}`,
      x: '(iw-ow)/2',
      y: '(ih-oh)/2',
      zoom: `scale=iw*1.5:ih*1.5,crop=${width}:${height}:((iw-${width})/2):((ih-${height})/2)`,
    },
    zoomOut: {
      scale: `scale=${width}:${height}`,
      zoom: `scale=iw*0.8:ih*0.8,crop=${width}:${height}:((iw-${width})/2):((ih-${height})/2)`,
    },
    panLeft: {
      scale: `scale=iw*1.3:ih*1.3`,
      crop: `crop=${width}:${height}`,
      x: '0',
      y: '(ih-oh)/2',
      pan: `crop=${width}:${height}:t*((iw-${width})/${duration}):((ih-${height})/2)`,
    },
    panRight: {
      scale: `scale=iw*1.3:ih*1.3`,
      crop: `crop=${width}:${height}`,
      pan: `crop=${width}:${height}:(iw-${width})-t*((iw-${width})/${duration}):((ih-${height})/2)`,
    },
    panUp: {
      scale: `scale=iw*1.3:ih*1.3`,
      crop: `crop=${width}:${height}`,
      pan: `crop=${width}:${height}:((iw-${width})/2):(ih-${height})-t*((ih-${height})/${duration})`,
    },
    panDown: {
      scale: `scale=iw*1.3:ih*1.3`,
      crop: `crop=${width}:${height}`,
      pan: `crop=${width}:${height}:((iw-${width})/2):t*((ih-${height})/${duration})`,
    },
  };

  const config = effects[effect] || effects.zoomIn;

  return new Promise((resolve, reject) => {
    let command = ffmpeg(imagePath)
      .inputOptions(['-loop', '1', '-t', duration.toString()])
      .videoFilters([
        {
          filter: 'scale',
          options: `iw*1.3:ih*1.3`,
        },
        {
          filter: 'crop',
          options: `${width}:${height}`,
        },
        {
          filter: 'zoompan',
          options: `z='min(zoom+0.0015,1.5)':d=${duration * 30}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${width}x${height}`,
        },
      ])
      .outputOptions([
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '23',
        '-pix_fmt', 'yuv420p',
        '-r', '30',
        '-t', duration.toString(),
      ])
      .size(`${width}x${height}`)
      .output(outputPath)
      .on('end', () => {
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('FFmpeg error:', err);
        reject(new Error(`Failed to create Ken Burns effect: ${err.message}`));
      });

    // Apply effect-specific filters
    if (effect === 'zoomIn') {
      command = command.videoFilters([
        {
          filter: 'scale',
          options: 'iw*1.5:ih*1.5',
        },
        {
          filter: 'crop',
          options: `${width}:${height}:((iw-${width})/2):((ih-${height})/2)`,
        },
        {
          filter: 'zoompan',
          options: `z='min(zoom+0.002,1.5)':d=${duration * 30}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${width}x${height}`,
        },
      ]);
    } else if (effect === 'zoomOut') {
      command = command.videoFilters([
        {
          filter: 'scale',
          options: 'iw*1.5:ih*1.5',
        },
        {
          filter: 'crop',
          options: `${width}:${height}:((iw-${width})/2):((ih-${height})/2)`,
        },
        {
          filter: 'zoompan',
          options: `z='if(lte(zoom,1.0),1.5,max(1.0,zoom-0.0015))':d=${duration * 30}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${width}x${height}`,
        },
      ]);
    }

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
  
  const effects = ['zoomIn', 'zoomOut', 'panLeft', 'panRight'];
  const durationPerImage = totalDuration / imagePaths.length;
  
  const videoPaths = [];
  
  // Create Ken Burns videos for each image
  for (let i = 0; i < imagePaths.length; i++) {
    const effect = effects[i % effects.length];
    const videoPath = await createKenBurnsEffect(imagePaths[i], durationPerImage, effect);
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

