// Video editing service - combine audio, video, and captions
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

const OUTPUT_DIR = path.join(__dirname, '../../output/videos');
const DRAFT_DIR = path.join(__dirname, '../../output/draft');
const NO_VOICE_DIR = path.join(__dirname, '../../output/no_voice');
const SCRIPTS_DIR = path.join(__dirname, '../../output/scripts');
const CAPTIONS_DIR = path.join(__dirname, '../../output/captions');

// Ensure output directory exists
async function ensureOutputDir() {
  try {
    // Create all directories with recursive option
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    await fs.mkdir(DRAFT_DIR, { recursive: true });
    await fs.mkdir(NO_VOICE_DIR, { recursive: true });
    await fs.mkdir(SCRIPTS_DIR, { recursive: true });
    await fs.mkdir(CAPTIONS_DIR, { recursive: true });
    
    // Verify directories exist by checking access
    await fs.access(OUTPUT_DIR).catch(() => {
      throw new Error(`Failed to create OUTPUT_DIR: ${OUTPUT_DIR}`);
    });
    await fs.access(DRAFT_DIR).catch(() => {
      throw new Error(`Failed to create DRAFT_DIR: ${DRAFT_DIR}`);
    });
    await fs.access(NO_VOICE_DIR).catch(() => {
      throw new Error(`Failed to create NO_VOICE_DIR: ${NO_VOICE_DIR}`);
    });
    await fs.access(SCRIPTS_DIR).catch(() => {
      throw new Error(`Failed to create SCRIPTS_DIR: ${SCRIPTS_DIR}`);
    });
  } catch (error) {
    console.error('Error ensuring output directories:', error);
    // Re-throw if it's not just "already exists"
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Create SRT subtitle file
 * @param {Array<Object>} captions - Array of caption objects {text, startTime, duration}
 * @returns {Promise<string>} Path to SRT file
 */
async function createSRTFile(captions) {
  await ensureOutputDir();
  const srtPath = path.join(CAPTIONS_DIR, `captions_${Date.now()}.srt`);

  let srtContent = '';
  captions.forEach((caption, index) => {
    const start = formatSRTTime(caption.startTime);
    const end = formatSRTTime(caption.startTime + caption.duration);
    srtContent += `${index + 1}\n${start} --> ${end}\n${caption.text}\n\n`;
  });

  await fs.writeFile(srtPath, srtContent);
  return srtPath;
}

/**
 * Format time for SRT (HH:MM:SS,mmm)
 */
function formatSRTTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
}

/**
 * Combine audio and video with captions
 * @param {string} videoPath - Path to video file
 * @param {string} audioPath - Path to audio file
 * @param {Array<Object>} captions - Array of caption objects
 * @param {string} filename - Output filename
 * @returns {Promise<string>} Path to final video
 */
async function combineAudioVideoWithCaptions(videoPath, audioPath, captions, filename = null) {
  await ensureOutputDir();
  
  const outputFilename = filename || `video_${Date.now()}.mp4`;
  const outputPath = path.join(OUTPUT_DIR, outputFilename);

  // Create SRT file if captions provided
  let srtPath = null;
  if (captions && captions.length > 0) {
    srtPath = await createSRTFile(captions);
  }

  return new Promise((resolve, reject) => {
    let command = ffmpeg(videoPath)
      .input(audioPath)
      .outputOptions([
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-preset', 'medium',
        '-crf', '23',
        '-pix_fmt', 'yuv420p',
        '-shortest',
        '-map', '0:v:0',
        '-map', '1:a:0',
      ]);

    // Add subtitles if available
    if (srtPath) {
      command = command
        .input(srtPath)
        .outputOptions([
          '-c:s', 'mov_text',
          '-map', '2',
        ]);
    }

    command
      .output(outputPath)
      .on('end', () => {
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('FFmpeg combine error:', err);
        reject(new Error(`Failed to combine audio and video: ${err.message}`));
      })
      .run();
  });
}

/**
 * Add captions overlay to video (burned-in subtitles)
 * @param {string} videoPath - Path to video file
 * @param {Array<Object>} captions - Array of caption objects
 * @param {string} filename - Output filename
 * @param {string} outputDir - Optional output directory (default: OUTPUT_DIR)
 * @returns {Promise<string>} Path to final video
 */
async function addCaptionsOverlay(videoPath, captions, filename = null, outputDir = null) {
  await ensureOutputDir();
  
  const outputFilename = filename || `video_captions_${Date.now()}.mp4`;
  const targetDir = outputDir || OUTPUT_DIR;
  const outputPath = path.join(targetDir, outputFilename);
  
  // Ensure parent directory exists
  const dirPath = path.dirname(outputPath);
  await fs.mkdir(dirPath, { recursive: true });
  
  // Verify directory was created
  try {
    await fs.access(dirPath);
  } catch (err) {
    throw new Error(`Failed to create output directory: ${dirPath} - ${err.message}`);
  }

  // Create filter complex for captions
  const filters = [];
  let currentTime = 0;

  captions.forEach((caption, index) => {
    const startTime = caption.startTime;
    const endTime = startTime + caption.duration;
    
    // Use system font (works on both macOS and Linux)
    // On Alpine Linux, use DejaVu Sans which is usually available
    const fontPath = process.platform === 'darwin' 
      ? '/System/Library/Fonts/Helvetica.ttc'
      : '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
    
    filters.push(
      `drawtext=text='${caption.text.replace(/'/g, "\\'")}':` +
      `fontfile=${fontPath}:` +
      `fontsize=60:` +
      `fontcolor=white:` +
      `x=(w-text_w)/2:` +
      `y=h-th-100:` +
      `enable='between(t,${startTime},${endTime})'`
    );
  });

  return new Promise(async (resolve, reject) => {
    // Double-check directory exists before FFmpeg runs
    try {
      const outputDir = path.dirname(outputPath);
      await fs.mkdir(outputDir, { recursive: true });
      await fs.access(outputDir);
    } catch (dirError) {
      console.error('Failed to ensure output directory:', dirError);
      reject(new Error(`Failed to create output directory: ${dirError.message}`));
      return;
    }
    
    ffmpeg(videoPath)
      .videoFilters(filters)
      .outputOptions([
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '23',
        '-pix_fmt', 'yuv420p',
      ])
      .output(outputPath)
      .on('end', () => {
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('FFmpeg caption error:', err);
        console.error('Output path:', outputPath);
        console.error('Output directory exists:', require('fs').existsSync(path.dirname(outputPath)));
        reject(new Error(`Failed to add captions: ${err.message}`));
      })
      .run();
  });
}

/**
 * Create final video with all components
 * @param {string} videoPath - Path to video file
 * @param {string} audioPath - Path to audio file
 * @param {Array<Object>} captions - Array of caption objects
 * @param {string} filename - Output filename
 * @returns {Promise<string>} Path to final video
 */
async function createFinalVideo(videoPath, audioPath, captions, filename = null) {
  // First combine audio and video
  const combinedPath = await combineAudioVideoWithCaptions(videoPath, audioPath, captions, filename);
  
  // Then add caption overlay (burned-in)
  if (captions && captions.length > 0) {
    const finalPath = await addCaptionsOverlay(combinedPath, captions, filename);
    return finalPath;
  }

  return combinedPath;
}

/**
 * Create script file with timing
 * @param {Array<Object>} captions - Array of caption objects {text, startTime, duration}
 * @param {string} filename - Output filename
 * @returns {Promise<string>} Path to script file
 */
async function createScriptWithTiming(captions, filename = null) {
  await ensureOutputDir();
  
  const scriptFilename = filename || `script_${Date.now()}.txt`;
  const scriptPath = path.join(SCRIPTS_DIR, scriptFilename);

  let scriptContent = '';
  captions.forEach((caption) => {
    const start = formatTime(caption.startTime);
    const end = formatTime(caption.startTime + caption.duration);
    scriptContent += `[${start}-${end}] ${caption.text}\n`;
  });

  await fs.writeFile(scriptPath, scriptContent, 'utf8');
  return scriptPath;
}

/**
 * Format time as MM:SS
 */
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Create draft videos (3 versions)
 * @param {string} videoPath - Path to video file
 * @param {string} audioPath - Path to audio file
 * @param {Array<Object>} captions - Array of caption objects
 * @param {string} baseFilename - Base filename (without extension)
 * @returns {Promise<Object>} Object with paths to draft, no_voice, and script files
 */
async function createDraftVideos(videoPath, audioPath, captions, baseFilename = null) {
  await ensureOutputDir();
  
  const timestamp = Date.now();
  const draftFilename = baseFilename ? `${baseFilename}_draft.mp4` : `video_draft_${timestamp}.mp4`;
  const noVoiceFilename = baseFilename ? `${baseFilename}_no_voice.mp4` : `video_no_voice_${timestamp}.mp4`;
  const scriptFilename = baseFilename ? `${baseFilename}_script.txt` : `script_${timestamp}.txt`;

  const draftPath = path.join(DRAFT_DIR, draftFilename);
  const noVoicePath = path.join(NO_VOICE_DIR, noVoiceFilename);
  const scriptPath = path.join(SCRIPTS_DIR, scriptFilename);

  // 1. Create draft video (full + AI voice + captions)
  const draftVideoPath = await createFinalVideo(videoPath, audioPath, captions, draftFilename);
  // Move to draft directory
  await fs.rename(draftVideoPath, draftPath).catch(() => {
    // If rename fails, copy instead
    return fs.copyFile(draftVideoPath, draftPath);
  });

  // 2. Create no-voice video (video only, no audio)
  await new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .videoFilters(captions.map((caption, index) => {
        const startTime = caption.startTime;
        const endTime = startTime + caption.duration;
        return {
          filter: 'drawtext',
          options: `text='${caption.text.replace(/'/g, "\\'")}':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=60:fontcolor=white:x=(w-text_w)/2:y=h-th-100:enable='between(t,${startTime},${endTime})'`
        };
      }))
      .outputOptions([
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '23',
        '-pix_fmt', 'yuv420p',
        '-an', // No audio
      ])
      .output(noVoicePath)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });

  // 3. Create script with timing
  await createScriptWithTiming(captions, scriptFilename);

  return {
    draft: draftPath,
    noVoice: noVoicePath,
    script: scriptPath,
  };
}

/**
 * Replace voice in video
 * @param {string} videoPath - Path to video file (with or without audio)
 * @param {string} newAudioPath - Path to new audio file
 * @param {string} outputPath - Output path (optional)
 * @returns {Promise<string>} Path to final video
 */
async function replaceVoice(videoPath, newAudioPath, outputPath = null) {
  await ensureOutputDir();
  
  if (!outputPath) {
    const timestamp = Date.now();
    outputPath = path.join(OUTPUT_DIR, `video_replaced_voice_${timestamp}.mp4`);
  }

  return new Promise((resolve, reject) => {
    // Get video duration
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(new Error(`Failed to probe video: ${err.message}`));
        return;
      }

      const videoDuration = metadata.format.duration;

      // Get audio duration
      ffmpeg.ffprobe(newAudioPath, (err, audioMetadata) => {
        if (err) {
          reject(new Error(`Failed to probe audio: ${err.message}`));
          return;
        }

        const audioDuration = audioMetadata.format.duration;

        let command = ffmpeg(videoPath)
          .input(newAudioPath);

        // If audio is shorter, pad with silence
        if (audioDuration < videoDuration) {
          const silenceDuration = videoDuration - audioDuration;
          command = command
            .input('anullsrc=channel_layout=stereo:sample_rate=44100')
            .inputOptions(['-f', 'lavfi', '-t', silenceDuration.toString()])
            .complexFilter([
              '[1:a][2:a]concat=n=2:v=0:a=1[outa]'
            ])
            .outputOptions([
              '-map', '0:v',
              '-map', '[outa]',
              '-c:v', 'copy',
              '-c:a', 'aac',
              '-shortest',
            ]);
        } else if (audioDuration > videoDuration) {
          // If audio is longer, trim it
          command = command
            .outputOptions([
              '-map', '0:v',
              '-map', '1:a',
              '-c:v', 'copy',
              '-c:a', 'aac',
              '-shortest',
            ]);
        } else {
          // Same duration
          command = command
            .outputOptions([
              '-map', '0:v',
              '-map', '1:a',
              '-c:v', 'copy',
              '-c:a', 'aac',
            ]);
        }

        command
          .output(outputPath)
          .on('end', () => resolve(outputPath))
          .on('error', (err) => {
            console.error('Replace voice error:', err);
            reject(new Error(`Failed to replace voice: ${err.message}`));
          })
          .run();
      });
    });
  });
}

/**
 * Create Picture-in-Picture video
 * @param {string} brollVideoPath - Path to B-roll background video
 * @param {string} personVideoPath - Path to person video
 * @param {Object} options - PIP options
 * @param {boolean} options.removeBg - Remove background from person video
 * @param {string} options.position - Position: 'bottom-right', 'bottom-left', 'top-right', 'top-left', 'center-bottom'
 * @param {number} options.personSize - Person video size as fraction (0.3 = 30%)
 * @param {string} outputPath - Output path (optional)
 * @returns {Promise<string>} Path to final video
 */
async function createPIPVideo(brollVideoPath, personVideoPath, options = {}, outputPath = null) {
  await ensureOutputDir();
  
  const {
    removeBg = false,
    position = 'bottom-right',
    personSize = 0.3,
  } = options;

  if (!outputPath) {
    const timestamp = Date.now();
    outputPath = path.join(OUTPUT_DIR, `video_pip_${timestamp}.mp4`);
  }

  // Position mapping
  const positions = {
    'bottom-right': { x: 'main_w-overlay_w-20', y: 'main_h-overlay_h-20' },
    'bottom-left': { x: '20', y: 'main_h-overlay_h-20' },
    'top-right': { x: 'main_w-overlay_w-20', y: '20' },
    'top-left': { x: '20', y: '20' },
    'center-bottom': { x: '(main_w-overlay_w)/2', y: 'main_h-overlay_h-20' },
  };

  const pos = positions[position] || positions['bottom-right'];

  return new Promise((resolve, reject) => {
    let command = ffmpeg(brollVideoPath)
      .input(personVideoPath);

    // Calculate overlay size
    const overlayWidth = `iw*${personSize}`;
    const overlayHeight = `ih*${personSize}`;

    // Build filter complex
    let filterComplex = `[1:v]scale=${overlayWidth}:${overlayHeight}[overlay]`;

    if (removeBg) {
      // Use chromakey to remove green/blue background
      // Note: This is a simple approach. For better results, use external tools
      filterComplex = `[1:v]scale=${overlayWidth}:${overlayHeight},chromakey=color=0x00ff00:similarity=0.3:blend=0.1[overlay]`;
    } else {
      filterComplex = `[1:v]scale=${overlayWidth}:${overlayHeight}[overlay]`;
    }

    filterComplex += `;[0:v][overlay]overlay=${pos.x}:${pos.y}`;

    command
      .complexFilter(filterComplex)
      .outputOptions([
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '23',
        '-pix_fmt', 'yuv420p',
        '-map', '0:a?', // Use audio from background if available
        '-c:a', 'aac',
        '-shortest',
      ])
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', (err) => {
        console.error('PIP video error:', err);
        reject(new Error(`Failed to create PIP video: ${err.message}`));
      })
      .run();
  });
}

module.exports = {
  createSRTFile,
  combineAudioVideoWithCaptions,
  addCaptionsOverlay,
  createFinalVideo,
  createDraftVideos,
  createScriptWithTiming,
  replaceVoice,
  createPIPVideo,
};

