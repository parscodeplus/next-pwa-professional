#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// پیدا کردن مسیر صحیح پکیج
function getPackageRoot() {
  // مسیرهای احتمالی برای پکیج
  const possiblePaths = [
    __dirname,  // در حین توسعه
    path.join(__dirname, '..'),  // در node_modules
    path.join(process.cwd(), 'node_modules', 'next-pwa-professional'),  // در پروژه مقصد
    path.join(process.cwd(), '..', 'next-pwa-professional'),  // توسعه محلی
  ];
  
  for (const p of possiblePaths) {
    const packageJsonPath = path.join(p, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        if (packageJson.name === 'next-pwa-professional') {
          console.log(`✅ Found package at: ${p}`);
          return p;
        }
      } catch (e) {}
    }
  }
  
  // اگر پیدا نشد، از مسیر نسبی استفاده کن
  const fallbackPath = path.join(__dirname, '..');
  console.log(`⚠️ Using fallback path: ${fallbackPath}`);
  return fallbackPath;
}

const PACKAGE_ROOT = getPackageRoot();
const TARGET_DIR = process.cwd();
const SOURCE_DIR = path.join(PACKAGE_ROOT, 'templates');

console.log(`\n📦 Package root: ${PACKAGE_ROOT}`);
console.log(`📂 Templates dir: ${SOURCE_DIR}`);
console.log(`🎯 Target dir: ${TARGET_DIR}\n`);

// بررسی وجود templates
function ensureTemplatesExist() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`❌ Templates directory not found at: ${SOURCE_DIR}`);
    
    // لیست فایل‌های موجود در پکیج
    if (fs.existsSync(PACKAGE_ROOT)) {
      console.log(`\n📁 Available files in package root:`);
      const files = fs.readdirSync(PACKAGE_ROOT);
      files.forEach(f => console.log(`   - ${f}`));
    }
    
    return false;
  }
  return true;
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
    writeStream.on('finish', () => {
      console.log(`   ✅ Created: ${path.relative(TARGET_DIR, dest)}`);
      resolve();
    });
    
    readStream.pipe(writeStream);
  });
}

// کپی فایل‌های استاتیک
async function copyPWAAssets() {
  console.log('\n📁 Copying PWA static assets...');
  
  const templatesPublic = path.join(SOURCE_DIR, 'public');
  const targetPublic = path.join(TARGET_DIR, 'public');
  
  if (!fs.existsSync(templatesPublic)) {
    console.log(`⚠️ Templates public not found at: ${templatesPublic}`);
    return;
  }
  
  // ایجاد پوشه public
  if (!fs.existsSync(targetPublic)) {
    fs.mkdirSync(targetPublic, { recursive: true });
    console.log(`   Created: public/`);
  }
  
  // کپی فایل‌ها
  const filesToCopy = ['manifest.json', 'offline.html'];
  for (const file of filesToCopy) {
    const src = path.join(templatesPublic, file);
    const dest = path.join(targetPublic, file);
    
    if (fs.existsSync(src)) {
      if (!fs.existsSync(dest)) {
        await copyFile(src, dest);
      } else {
        console.log(`   ⏭️ Skipped: public/${file} (already exists)`);
      }
    } else {
      console.log(`   ⚠️ Source not found: ${file}`);
    }
  }
  
  // ایجاد پوشه آیکون‌ها
  const iconsDir = path.join(targetPublic, 'icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
    console.log(`   ✅ Created: public/icons/`);
  }
  
  console.log('\n✅ Static assets processed!');
}

// کپی صفحات PWA
async function copyPWAPages() {
  console.log('\n📄 Copying PWA pages...');
  
  const templatesApp = path.join(SOURCE_DIR, 'app');
  const targetApp = path.join(TARGET_DIR, 'app');
  
  if (!fs.existsSync(templatesApp)) {
    console.log(`⚠️ Templates app not found at: ${templatesApp}`);
    return;
  }
  
  // کپی صفحه offline
  const offlineSrc = path.join(templatesApp, 'offline', 'page.tsx');
  const offlineDest = path.join(targetApp, 'offline', 'page.tsx');
  
  if (fs.existsSync(offlineSrc)) {
    if (!fs.existsSync(offlineDest)) {
      const offlineDir = path.dirname(offlineDest);
      if (!fs.existsSync(offlineDir)) {
        fs.mkdirSync(offlineDir, { recursive: true });
      }
      await copyFile(offlineSrc, offlineDest);
    } else {
      console.log(`   ⏭️ Skipped: app/offline/page.tsx (already exists)`);
    }
  } else {
    console.log(`   ⚠️ Source not found: app/offline/page.tsx`);
  }
  
  // کپی manifest.ts
  const manifestSrc = path.join(templatesApp, 'manifest.ts');
  const manifestDest = path.join(targetApp, 'manifest.ts');
  
  if (fs.existsSync(manifestSrc)) {
    if (!fs.existsSync(manifestDest)) {
      await copyFile(manifestSrc, manifestDest);
    } else {
      console.log(`   ⏭️ Skipped: app/manifest.ts (already exists)`);
    }
  } else {
    console.log(`   ⚠️ Source not found: app/manifest.ts`);
  }
  
  console.log('\n✅ PWA pages processed!');
}

// به‌روزرسانی next.config
async function updateNextConfig() {
  console.log('\n⚙️ Updating Next.js config...');
  
  const configPath = path.join(TARGET_DIR, 'next.config.js');
  
  if (!fs.existsSync(configPath)) {
    const templateConfig = path.join(SOURCE_DIR, 'next.config.template.js');
    
    if (fs.existsSync(templateConfig)) {
      await copyFile(templateConfig, configPath);
    } else {
      console.log(`   ⚠️ Template config not found`);
      
      // ایجاد config به صورت دستی
      const configContent = `const withPWA = require('@ducanh2912/next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
});

module.exports = withPWA({
  reactStrictMode: true,
});
`;
      fs.writeFileSync(configPath, configContent);
      console.log(`   ✅ Created: next.config.js`);
    }
  } else {
    // بررسی وجود تنظیمات PWA در config موجود
    const content = fs.readFileSync(configPath, 'utf-8');
    if (!content.includes('@ducanh2912/next-pwa')) {
      console.log(`   ⚠️ Existing next.config.js found but missing PWA config`);
      console.log(`   📝 Please add PWA config manually or replace with template`);
    } else {
      console.log(`   ✅ PWA config already present`);
    }
  }
}

// پیام موفقیت
function showSuccessMessage() {
  console.log('\n' + '='.repeat(60));
  console.log('🎉 Next.js PWA Professional Setup Complete!');
  console.log('='.repeat(60));
  console.log('\n📁 Files created:');
  console.log('   - public/manifest.json');
  console.log('   - public/offline.html');
  console.log('   - public/icons/');
  console.log('   - app/offline/page.tsx');
  console.log('   - app/manifest.ts');
  console.log('   - next.config.js (updated)');
  console.log('\n📖 Next steps:');
  console.log('1. Add icons to public/icons/ directory');
  console.log('2. Wrap your app with PWAProvider in layout.tsx');
  console.log('3. Run: npm run build && npm start');
  console.log('='.repeat(60) + '\n');
}

// اجرای اصلی
async function main() {
  console.log('\n🚀 Setting up Next.js PWA Professional...\n');
  
  if (!ensureTemplatesExist()) {
    console.error('\n❌ Setup failed: Templates not found');
    console.log('\n💡 Manual setup:');
    console.log('1. Create public/manifest.json');
    console.log('2. Create app/offline/page.tsx');
    console.log('3. Add PWA config to next.config.js');
    process.exit(1);
  }
  
  try {
    await copyPWAAssets();
    await copyPWAPages();
    await updateNextConfig();
    showSuccessMessage();
  } catch (error) {
    console.error('❌ Setup error:', error.message);
    process.exit(1);
  }
}

// اجرا
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { copyPWAAssets, copyPWAPages, updateNextConfig };