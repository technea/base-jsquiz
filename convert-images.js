const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function convertSvgToPng() {
  try {
    // Convert icon-pro.svg to icon-pro.png (1024x1024)
    await sharp('public/icon-pro.svg')
      .png({ quality: 100 })
      .resize(1024, 1024, { fit: 'contain', background: { r: 15, g: 23, b: 42, alpha: 1 } })
      .toFile('public/icon-pro.png');
    console.log('✓ Converted icon-pro.svg to icon-pro.png (1024x1024)');

    // Convert splash-pro.svg to splash-pro.png (1080x1920)
    await sharp('public/splash-pro.svg')
      .png({ quality: 100 })
      .resize(1080, 1920, { fit: 'contain', background: { r: 15, g: 23, b: 42, alpha: 1 } })
      .toFile('public/splash-pro.png');
    console.log('✓ Converted splash-pro.svg to splash-pro.png (1080x1920)');

    // Convert og-pro.svg to og-pro.png (1200x630)
    await sharp('public/og-pro.svg')
      .png({ quality: 100 })
      .resize(1200, 630, { fit: 'contain', background: { r: 15, g: 23, b: 42, alpha: 1 } })
      .toFile('public/og-pro.png');
    console.log('✓ Converted og-pro.svg to og-pro.png (1200x630)');

  } catch (error) {
    console.error('Error converting SVG to PNG:', error);
  }
}

convertSvgToPng();
