#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// اصلاح مسیر - پیدا کردن ریشه پکیج
function getPackageRoot() {
  // اگر در node_modules نصب شده
  let currentDir = __dirname;
  
  // تا زمانی که به node_modules/next-pwa-professional رسیدیم
  while (currentDir !== path.parse(currentDir).root) {
    if (path.basename(currentDir) === 'next-pwa-professional') {
      return currentDir;
    }
    // بررسی وجود فایل package.json در مسیر فعلی
    const packageJsonPath = path.join(currentDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      if (packageJson.name === 'next-pwa-professional') {
        return currentDir;
      }
    }
    currentDir = path.dirname(currentDir);
  }
  
  // اگر پیدا نشد، از مسیر نسبی استفاده کن
  return path.join(__dirname, '..');
}

const PACKAGE_ROOT = getPackageRoot();
const TARGET_DIR = process.cwd();
const SOURCE_DIR = path.join(PACKAGE_ROOT, 'templates');

console.log('📂 Package root:', PACKAGE_ROOT);
console.log('📂 Templates dir:', SOURCE_DIR);
console.log('📂 Target dir:', TARGET_DIR);

// اطمینان از وجود دایرکتوری templates
function ensureTemplatesExist() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error('❌ Templates directory not found at:', SOURCE_DIR);
    console.log('💡 Available files in package root:', fs.readdirSync(PACKAGE_ROOT));
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
    writeStream.on('finish', resolve);
    
    readStream.pipe(writeStream);
  });
}

// کپی فایل‌های استاتیک
async function copyPWAAssets() {
  console.log('\n📁 Copying PWA static assets...\n');
  
  const templatesPublic = path.join(SOURCE_DIR, 'public');
  const targetPublic = path.join(TARGET_DIR, 'public');
  
  if (!fs.existsSync(templatesPublic)) {
    console.log('⚠️ No templates/public found at:', templatesPublic);
    return;
  }
  
  // ایجاد پوشه public اگر وجود ندارد
  if (!fs.existsSync(targetPublic)) {
    fs.mkdirSync(targetPublic, { recursive: true });
  }
  
  // کپی manifest.json
  const manifestSrc = path.join(templatesPublic, 'manifest.json');
  const manifestDest = path.join(targetPublic, 'manifest.json');
  
  if (fs.existsSync(manifestSrc)) {
    if (!fs.existsSync(manifestDest)) {
      await copyFile(manifestSrc, manifestDest);
      console.log('✅ Created: public/manifest.json');
    } else {
      console.log('⏭️ Skipped: public/manifest.json already exists');
    }
  }
  
  // کپی offline.html
  const offlineSrc = path.join(templatesPublic, 'offline.html');
  const offlineDest = path.join(targetPublic, 'offline.html');
  
  if (fs.existsSync(offlineSrc)) {
    if (!fs.existsSync(offlineDest)) {
      await copyFile(offlineSrc, offlineDest);
      console.log('✅ Created: public/offline.html');
    } else {
      console.log('⏭️ Skipped: public/offline.html already exists');
    }
  }
  
  // ایجاد پوشه آیکون‌ها
  const iconsDir = path.join(targetPublic, 'icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
    console.log('✅ Created: public/icons/ directory');
  }
  
  console.log('\n✅ Static assets processed!\n');
}

// کپی صفحات PWA
async function copyPWAPages() {
  console.log('📄 Copying PWA pages...\n');
  
  const templatesApp = path.join(SOURCE_DIR, 'app');
  const targetApp = path.join(TARGET_DIR, 'app');
  
  if (!fs.existsSync(templatesApp)) {
    console.log('⚠️ No templates/app found at:', templatesApp);
    return;
  }
  
  if (!fs.existsSync(targetApp)) {
    fs.mkdirSync(targetApp, { recursive: true });
  }
  
  // کپی صفحه offline
  const offlinePageSrc = path.join(templatesApp, 'offline', 'page.tsx');
  const offlinePageDest = path.join(targetApp, 'offline', 'page.tsx');
  
  if (fs.existsSync(offlinePageSrc)) {
    if (!fs.existsSync(offlinePageDest)) {
      const offlineDir = path.dirname(offlinePageDest);
      if (!fs.existsSync(offlineDir)) {
        fs.mkdirSync(offlineDir, { recursive: true });
      }
      await copyFile(offlinePageSrc, offlinePageDest);
      console.log('✅ Created: app/offline/page.tsx');
    } else {
      console.log('⏭️ Skipped: app/offline/page.tsx already exists');
    }
  }
  
  // کپی manifest.ts
  const manifestTsSrc = path.join(templatesApp, 'manifest.ts');
  const manifestTsDest = path.join(targetApp, 'manifest.ts');
  
  if (fs.existsSync(manifestTsSrc)) {
    if (!fs.existsSync(manifestTsDest)) {
      await copyFile(manifestTsSrc, manifestTsDest);
      console.log('✅ Created: app/manifest.ts');
    } else {
      console.log('⏭️ Skipped: app/manifest.ts already exists');
    }
  }
  
  console.log('\n✅ PWA pages processed!\n');
}

// به‌روزرسانی next.config
async function updateNextConfig() {
  console.log('⚙️ Checking Next.js config...\n');
  
  const configPaths = [
    path.join(TARGET_DIR, 'next.config.js'),
    path.join(TARGET_DIR, 'next.config.mjs'),
  ];
  
  const existingConfig = configPaths.find(p => fs.existsSync(p));
  
  if (!existingConfig) {
    const templateConfig = path.join(SOURCE_DIR, 'next.config.template.js');
    
    if (fs.existsSync(templateConfig)) {
      await copyFile(templateConfig, path.join(TARGET_DIR, 'next.config.js'));
      console.log('✅ Created: next.config.js with PWA configuration');
    } else {
      console.log('⚠️ Template config not found at:', templateConfig);
    }
  } else {
    console.log(`⚠️ Existing config found: ${existingConfig}`);
    console.log('📝 Please ensure PWA configuration is added manually:');
    console.log(`
    const withPWA = require('@ducanh2912/next-pwa')({
      dest: 'public',
      register: true,
      skipWaiting: true,
    });
    
    module.exports = withPWA({
      // your existing config
    });
    `);
  }
  
  console.log('');
}

// نصب وابستگی‌ها
async function installDependencies() {
  console.log('\n📦 Checking dependencies...\n');
  
  const requiredDeps = ['@ducanh2912/next-pwa', 'idb'];
  const packageJsonPath = path.join(TARGET_DIR, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.log('⚠️ No package.json found');
    return false;
  }
  
  let packageJson;
  try {
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  } catch (error) {
    console.log('⚠️ Invalid package.json');
    return false;
  }
  
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  const missingDeps = requiredDeps.filter(dep => !allDeps[dep]);
  
  if (missingDeps.length > 0) {
    console.log(`📦 Missing dependencies: ${missingDeps.join(', ')}`);
    console.log('💡 Please install manually:');
    console.log(`   pnpm add ${missingDeps.join(' ')}`);
    console.log(`   or npm install ${missingDeps.join(' ')}`);
  } else {
    console.log('✅ All dependencies are ready');
  }
  
  return true;
}

// بررسی و به‌روزرسانی layout.tsx
async function updateLayoutFile() {
  console.log('🔧 Checking layout file...\n');
  
  const layoutPaths = [
    path.join(TARGET_DIR, 'app', 'layout.tsx'),
    path.join(TARGET_DIR, 'app', 'layout.jsx'),
    path.join(TARGET_DIR, 'src', 'app', 'layout.tsx'),
    path.join(TARGET_DIR, 'src', 'app', 'layout.jsx'),
  ];
  
  const layoutPath = layoutPaths.find(p => fs.existsSync(p));
  
  if (!layoutPath) {
    console.log('⚠️ Layout file not found. Please add PWAProvider manually:');
    console.log(`
    import { PWAProvider } from 'next-pwa-professional';
    
    export default function RootLayout({ children }) {
      return (
        <html>
          <body>
            <PWAProvider>
              {children}
            </PWAProvider>
          </body>
        </html>
      );
    }
    `);
    return;
  }
  
  const layoutContent = fs.readFileSync(layoutPath, 'utf-8');
  
  if (!layoutContent.includes('PWAProvider')) {
    console.log('⚠️ PWAProvider not found in layout.');
    console.log('📝 Please add it manually to', layoutPath);
    console.log(`
    import { PWAProvider } from 'next-pwa-professional';
    
    // Wrap your children with <PWAProvider>
    `);
  } else {
    console.log('✅ PWAProvider found in layout!');
  }
  
  console.log('');
}

// پیام موفقیت
function showSuccessMessage() {
  console.log('\n' + '='.repeat(60));
  console.log('🎉 Next.js PWA Professional Setup Complete!');
  console.log('='.repeat(60));
  console.log('\n📖 Next steps:');
  console.log('─────────────────────────────────────────────────');
  console.log('1️⃣  Add PWAProvider to your layout.tsx:');
  console.log('    import { PWAProvider } from "next-pwa-professional";');
  console.log('');
  console.log('    export default function RootLayout({ children }) {');
  console.log('      return (');
  console.log('        <html>');
  console.log('          <body>');
  console.log('            <PWAProvider>{children}</PWAProvider>');
  console.log('          </body>');
  console.log('        </html>');
  console.log('      );');
  console.log('    }');
  console.log('');
  console.log('2️⃣  Build and test:');
  console.log('    npm run build  # or pnpm build');
  console.log('    npm start      # or pnpm start');
  console.log('');
  console.log('3️⃣  Test offline mode:');
  console.log('    - Open DevTools (F12)');
  console.log('    - Go to Network tab');
  console.log('    - Check "Offline"');
  console.log('    - Refresh the page');
  console.log('');
  console.log('📚 For more info, visit: https://github.com/your-org/next-pwa-professional');
  console.log('='.repeat(60) + '\n');
}

// اجرای اصلی
async function main() {
  console.log('\n🚀 Setting up Next.js PWA Professional...\n');
  
  if (!ensureTemplatesExist()) {
    console.error('❌ Setup failed: Templates not found');
    console.log('💡 Make sure you have installed the package correctly:');
    console.log('   pnpm install next-pwa-professional');
    process.exit(1);
  }
  
  try {
    await copyPWAAssets();
    await copyPWAPages();
    await updateNextConfig();
    await installDependencies();
    await updateLayoutFile();
    showSuccessMessage();
  } catch (error) {
    console.error('❌ Setup error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// اجرا
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { 
  copyPWAAssets, 
  copyPWAPages, 
  updateNextConfig,
  getPackageRoot 
};