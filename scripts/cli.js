#!/usr/bin/env node
// scripts/cli.js

const fs = require('fs');
const path = require('path');

const TARGET_DIR = process.cwd();
const PACKAGE_DIR = path.join(__dirname, '..');
const SOURCE_DIR = path.join(PACKAGE_DIR, 'templates');

console.log('\n🔧 Next.js PWA Professional - Manual Setup\n');
console.log(`📂 Target directory: ${TARGET_DIR}\n`);

function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
  console.log(`   ✅ Created: ${path.relative(TARGET_DIR, dest)}`);
}

// کپی فایل‌های استاتیک
if (fs.existsSync(path.join(SOURCE_DIR, 'public'))) {
  console.log('📁 Copying static assets...');
  
  const manifestSrc = path.join(SOURCE_DIR, 'public/manifest.json');
  const manifestDest = path.join(TARGET_DIR, 'public/manifest.json');
  if (fs.existsSync(manifestSrc) && !fs.existsSync(manifestDest)) {
    copyFile(manifestSrc, manifestDest);
  }
  
  // ایجاد پوشه icons
  const iconsDir = path.join(TARGET_DIR, 'public/icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
    console.log(`   ✅ Created: public/icons/`);
  }
}

// کپی صفحات PWA
if (fs.existsSync(path.join(SOURCE_DIR, 'app'))) {
  console.log('\n📄 Copying PWA pages...');
  
  const offlineSrc = path.join(SOURCE_DIR, 'app/offline/page.tsx');
  const offlineDest = path.join(TARGET_DIR, 'app/offline/page.tsx');
  if (fs.existsSync(offlineSrc) && !fs.existsSync(offlineDest)) {
    const offlineDir = path.dirname(offlineDest);
    if (!fs.existsSync(offlineDir)) {
      fs.mkdirSync(offlineDir, { recursive: true });
    }
    copyFile(offlineSrc, offlineDest);
  }
  
  const manifestSrc = path.join(SOURCE_DIR, 'app/manifest.ts');
  const manifestDest = path.join(TARGET_DIR, 'app/manifest.ts');
  if (fs.existsSync(manifestSrc) && !fs.existsSync(manifestDest)) {
    copyFile(manifestSrc, manifestDest);
  }
}

console.log('\n✅ Manual setup complete!\n');
console.log('📖 Next steps:');
console.log('1. Add PWAProvider to your layout.tsx');
console.log('2. Add app icons to public/icons/');
console.log('3. Run: npm run build && npm start\n');