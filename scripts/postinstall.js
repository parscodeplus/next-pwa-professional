#!/usr/bin/env node

// IMPORTANT: این فایل در پروژه مقصد اجرا می‌شود
// مسیرها نسبی به پروژه مقصد هستند

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// بررسی اینکه آیا در حال توسعه هستیم یا در پروژه مقصد
const isDev = process.env.NODE_ENV === 'development' || 
              !fs.existsSync(path.join(process.cwd(), 'node_modules', 'next-pwa-professional'));

// اگر در حال توسعه هستیم، هیچ کاری نکن
if (isDev && process.argv.includes('--skip-dev')) {
  console.log('📦 Skipping postinstall in development mode');
  process.exit(0);
}

const TARGET_DIR = process.cwd();
const PACKAGE_DIR = path.join(TARGET_DIR, 'node_modules', 'next-pwa-professional');
const SOURCE_DIR = path.join(PACKAGE_DIR, 'templates');

// اگر پکیج در node_modules نیست، یعنی در حال توسعه هستیم
if (!fs.existsSync(PACKAGE_DIR)) {
  console.log('📦 Skipping postinstall - running in development mode');
  process.exit(0);
}

console.log('\n🚀 Setting up Next.js PWA Professional in your project...\n');
console.log(`📂 Project directory: ${TARGET_DIR}`);
console.log(`📦 Package directory: ${PACKAGE_DIR}\n`);

// تشخیص پکیج منیجر
function getPackageManager() {
  if (fs.existsSync(path.join(TARGET_DIR, 'pnpm-lock.yaml'))) return 'pnpm';
  if (fs.existsSync(path.join(TARGET_DIR, 'yarn.lock'))) return 'yarn';
  if (fs.existsSync(path.join(TARGET_DIR, 'bun.lockb'))) return 'bun';
  if (fs.existsSync(path.join(TARGET_DIR, 'package-lock.json'))) return 'npm';
  return 'npm';
}

// پیدا کردن مسیر درست app
function getAppPath() {
  const possiblePaths = [
    path.join(TARGET_DIR, 'app'),
    path.join(TARGET_DIR, 'src', 'app'),
  ];
  
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  
  return path.join(TARGET_DIR, 'app');
}

// کپی فایل
function copyFile(src, dest) {
  return new Promise((resolve, reject) => {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    const readStream = fs.createReadStream(src);
    const writeStream = fs.createWriteStream(dest);
    
    readStream.on('error', reject);
    writeStream.on('error', reject);
    writeStream.on('finish', resolve);
    
    readStream.pipe(writeStream);
  });
}

// کپی فایل‌های استاتیک
async function copyPWAAssets() {
  console.log('📁 Copying PWA static assets...');
  
  const templatesPublic = path.join(SOURCE_DIR, 'public');
  const targetPublic = path.join(TARGET_DIR, 'public');
  
  if (!fs.existsSync(templatesPublic)) {
    console.log('   ⚠️ Templates not found');
    return;
  }
  
  if (!fs.existsSync(targetPublic)) {
    fs.mkdirSync(targetPublic, { recursive: true });
  }
  
  const manifestSrc = path.join(templatesPublic, 'manifest.json');
  const manifestDest = path.join(targetPublic, 'manifest.json');
  if (fs.existsSync(manifestSrc) && !fs.existsSync(manifestDest)) {
    await copyFile(manifestSrc, manifestDest);
    console.log('   ✅ Created: public/manifest.json');
  }
  
  const offlineSrc = path.join(templatesPublic, 'offline.html');
  const offlineDest = path.join(targetPublic, 'offline.html');
  if (fs.existsSync(offlineSrc) && !fs.existsSync(offlineDest)) {
    await copyFile(offlineSrc, offlineDest);
    console.log('   ✅ Created: public/offline.html');
  }
  
  const iconsDir = path.join(targetPublic, 'icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
    console.log('   ✅ Created: public/icons/');
  }
}

// کپی صفحات PWA
async function copyPWAPages() {
  console.log('\n📄 Copying PWA pages...');
  
  const templatesApp = path.join(SOURCE_DIR, 'app');
  const targetApp = getAppPath();
  
  if (!fs.existsSync(templatesApp)) {
    console.log('   ⚠️ Templates not found');
    return;
  }
  
  const offlineSrc = path.join(templatesApp, 'offline', 'page.tsx');
  const offlineDest = path.join(targetApp, 'offline', 'page.tsx');
  if (fs.existsSync(offlineSrc) && !fs.existsSync(offlineDest)) {
    const offlineDir = path.dirname(offlineDest);
    if (!fs.existsSync(offlineDir)) {
      fs.mkdirSync(offlineDir, { recursive: true });
    }
    await copyFile(offlineSrc, offlineDest);
    console.log('   ✅ Created: app/offline/page.tsx');
  }
  
  const manifestSrc = path.join(templatesApp, 'manifest.ts');
  const manifestDest = path.join(targetApp, 'manifest.ts');
  if (fs.existsSync(manifestSrc) && !fs.existsSync(manifestDest)) {
    await copyFile(manifestSrc, manifestDest);
    console.log('   ✅ Created: app/manifest.ts');
  }
}

// به‌روزرسانی next.config.js
async function updateNextConfig() {
  console.log('\n⚙️ Updating Next.js config...');
  
  const configPath = path.join(TARGET_DIR, 'next.config.js');
  
  if (!fs.existsSync(configPath)) {
    const configContent = `const withPWA = require('@ducanh2912/next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

module.exports = withPWA({
  reactStrictMode: true,
  swcMinify: true,
});
`;
    fs.writeFileSync(configPath, configContent);
    console.log('   ✅ Created: next.config.js');
  }
}

// پیام موفقیت
function showSuccessMessage() {
  console.log('\n' + '='.repeat(60));
  console.log('✅ Next.js PWA Professional Setup Complete!');
  console.log('='.repeat(60));
  console.log('\n📁 Files added to your project:');
  console.log('   - public/manifest.json');
  console.log('   - public/offline.html');
  console.log('   - public/icons/');
  console.log('   - app/offline/page.tsx');
  console.log('   - app/manifest.ts');
  console.log('   - next.config.js');
  console.log('\n📖 Next steps:');
  console.log('1. Add PWAProvider to your layout.tsx:');
  console.log('   import { PWAProvider } from "next-pwa-professional";');
  console.log('   <PWAProvider>{children}</PWAProvider>');
  console.log('2. Run: npm run build && npm start');
  console.log('3. Test offline: DevTools > Network > Offline');
  console.log('='.repeat(60) + '\n');
}

// اجرای اصلی
async function main() {
  try {
    await copyPWAAssets();
    await copyPWAPages();
    await updateNextConfig();
    showSuccessMessage();
  } catch (error) {
    console.error('❌ Setup error:', error.message);
  }
}

main();