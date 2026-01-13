// Image search service using Unsplash or Pexels
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const OUTPUT_DIR = path.join(__dirname, '../../output/temp');

// Ensure output directory exists
async function ensureOutputDir() {
  try {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
  } catch (error) {
    // Directory already exists
  }
}

/**
 * Search images from Unsplash
 * @param {string} query - Search query
 * @param {number} count - Number of images (default: 5)
 * @returns {Promise<Array<string>>} Array of image URLs
 */
async function searchUnsplash(query, count = 5) {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    throw new Error('UNSPLASH_ACCESS_KEY not found in environment variables');
  }

  try {
    const response = await axios.get('https://api.unsplash.com/search/photos', {
      params: {
        query,
        per_page: count,
        orientation: 'portrait', // For 9:16 format
      },
      headers: {
        Authorization: `Client-ID ${accessKey}`,
      },
    });

    return response.data.results.map((photo) => photo.urls.regular);
  } catch (error) {
    console.error('Unsplash error:', error.response?.data || error.message);
    throw new Error(`Failed to search Unsplash: ${error.message}`);
  }
}

/**
 * Search images from Pexels
 * @param {string} query - Search query
 * @param {number} count - Number of images (default: 5)
 * @returns {Promise<Array<string>>} Array of image URLs
 */
async function searchPexels(query, count = 5) {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    throw new Error('PEXELS_API_KEY not found in environment variables');
  }

  try {
    const response = await axios.get('https://api.pexels.com/v1/search', {
      params: {
        query,
        per_page: count,
        orientation: 'portrait',
      },
      headers: {
        Authorization: apiKey,
      },
    });

    return response.data.photos.map((photo) => photo.src.large);
  } catch (error) {
    console.error('Pexels error:', error.response?.data || error.message);
    throw new Error(`Failed to search Pexels: ${error.message}`);
  }
}

/**
 * Download image from URL
 * @param {string} url - Image URL
 * @returns {Promise<string>} Path to downloaded image
 */
async function downloadImage(url) {
  await ensureOutputDir();
  const outputPath = path.join(OUTPUT_DIR, `image_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`);

  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
    });

    await fs.writeFile(outputPath, response.data);
    return outputPath;
  } catch (error) {
    console.error('Download error:', error.message);
    throw new Error(`Failed to download image: ${error.message}`);
  }
}

/**
 * Search and download images (auto-select service)
 * @param {Array<string>} keywords - Keywords for image search
 * @param {number} imagesPerKeyword - Images per keyword (default: 2)
 * @returns {Promise<Array<string>>} Array of downloaded image paths
 */
async function searchAndDownloadImages(keywords, imagesPerKeyword = 2) {
  const imageUrls = [];
  
  // Try Unsplash first, fallback to Pexels
  for (const keyword of keywords) {
    try {
      if (process.env.UNSPLASH_ACCESS_KEY) {
        const urls = await searchUnsplash(keyword, imagesPerKeyword);
        imageUrls.push(...urls);
      } else if (process.env.PEXELS_API_KEY) {
        const urls = await searchPexels(keyword, imagesPerKeyword);
        imageUrls.push(...urls);
      } else {
        throw new Error('No image service API key found');
      }
    } catch (error) {
      console.error(`Error searching for "${keyword}":`, error.message);
    }
  }

  // Download images
  const imagePaths = [];
  for (const url of imageUrls.slice(0, 10)) { // Limit to 10 images
    try {
      const path = await downloadImage(url);
      imagePaths.push(path);
    } catch (error) {
      console.error(`Error downloading image:`, error.message);
    }
  }

  if (imagePaths.length === 0) {
    throw new Error('No images were downloaded');
  }

  return imagePaths;
}

module.exports = {
  searchUnsplash,
  searchPexels,
  downloadImage,
  searchAndDownloadImages,
};

