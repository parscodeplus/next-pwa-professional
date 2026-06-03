// scripts/generate-icons.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const ICON_DIR = path.join(process.cwd(), 'public/icons');
const SOURCE_ICON = path.join(ICON_DIR, 'source.png');

/**
 * بررسی وجود Sharp برای تبدیل تصاویر
 */
function checkSharpInstalled() {
  try {
    require.resolve('sharp');
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * نصب Sharp
 */
function installSharp() {
  console.log('📦 Installing sharp for icon generation...');
  try {
    execSync('npm install -D sharp', { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error('❌ Failed to install sharp:', error);
    return false;
  }
}

/**
 * تولید آیکون در اندازه‌های مختلف
 */
async function generateIcons() {
  console.log('\n🎨 Generating PWA icons...\n');
  
  // بررسی وجود پوشه آیکون‌ها
  if (!fs.existsSync(ICON_DIR)) {
    fs.mkdirSync(ICON_DIR, { recursive: true });
    console.log('✅ Created icons directory');
  }
  
  // بررسی وجود فایل سورس
  if (!fs.existsSync(SOURCE_ICON)) {
    console.log('⚠️ No source icon found at:', SOURCE_ICON);
    console.log('📝 Please place a 512x512px PNG file at public/icons/source.png');
    console.log('🔄 Or provide a URL to an icon: npm run generate-icons -- --url=https://example.com/icon.png');
    return false;
  }
  
  // بررسی Sharp
  let sharp;
  if (!checkSharpInstalled()) {
    const installed = installSharp();
    if (!installed) {
      console.log('⚠️ Could not generate icons automatically');
      console.log('📝 Please generate icons manually or install sharp: npm install -D sharp');
      return false;
    }
  }
  
  sharp = require('sharp');
  
  // تولید آیکون‌ها
  for (const size of ICON_SIZES) {
    const outputPath = path.join(ICON_DIR, `icon-${size}x${size}.png`);
    
    try {
      await sharp(SOURCE_ICON)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 },
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated: icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`❌ Failed to generate icon-${size}x${size}.png:`, error);
    }
  }
  
  // تولید maskable icon (با padding)
  const maskablePath = path.join(ICON_DIR, 'icon-512x512-maskable.png');
  try {
    await sharp(SOURCE_ICON)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .composite([{
        input: Buffer.from(`
          <svg width="512" height="512">
            <circle cx="256" cy="256" r="220" fill="white" />
          </svg>
        `),
        blend: 'dest-over',
      }])
      .png()
      .toFile(maskablePath);
    
    console.log(`✅ Generated: icon-512x512-maskable.png`);
  } catch (error) {
    console.error(`❌ Failed to generate maskable icon:`, error);
  }
  
  console.log('\n🎉 All icons generated successfully!\n');
  return true;
}

/**
 * دانلود آیکون از URL
 */
async function downloadIconFromUrl(url) {
  const https = require('https');
  const http = require('http');
  
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        fs.writeFileSync(SOURCE_ICON, buffer);
        resolve();
      });
    }).on('error', reject);
  });
}

/**
 * پردازش آرگومان‌های خط فرمان
 */
async function main() {
  const args = process.argv.slice(2);
  const urlIndex = args.indexOf('--url');
  
  if (urlIndex !== -1 && args[urlIndex + 1]) {
    const iconUrl = args[urlIndex + 1];
    console.log(`📥 Downloading icon from: ${iconUrl}`);
    
    try {
      await downloadIconFromUrl(iconUrl);
      console.log('✅ Icon downloaded successfully');
    } catch (error) {
      console.error('❌ Failed to download icon:', error);
      process.exit(1);
    }
  }
  
  const success = await generateIcons();
  if (!success) {
    process.exit(1);
  }
}

// اجرا در صورت فراخوانی مستقیم
if (require.main === module) {
  main();
}

module.exports = {
  generateIcons,
  ICON_SIZES,
};