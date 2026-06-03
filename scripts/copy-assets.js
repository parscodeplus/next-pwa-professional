// scripts/copy-assets.js
const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.join(__dirname, '../templates');
const TARGET_DIR = process.cwd();

async function copyFile(src, dest) {
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

async function copyDirectory(src, dest, overwrite = false) {
  if (!fs.existsSync(src)) return;
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath, overwrite);
    } else {
      if (!fs.existsSync(destPath) || overwrite) {
        await copyFile(srcPath, destPath);
        console.log(`✅ Copied: ${destPath}`);
      }
    }
  }
}

async function copyPWAAssets() {
  console.log('\n📁 Copying PWA static assets...\n');
  
  const manifestSrc = path.join(SOURCE_DIR, 'public/manifest.json');
  const manifestDest = path.join(TARGET_DIR, 'public/manifest.json');
  
  if (fs.existsSync(manifestSrc) && !fs.existsSync(manifestDest)) {
    await copyFile(manifestSrc, manifestDest);
    console.log('✅ Created: public/manifest.json');
  }
  
  const offlineHtmlSrc = path.join(SOURCE_DIR, 'public/offline.html');
  const offlineHtmlDest = path.join(TARGET_DIR, 'public/offline.html');
  
  if (fs.existsSync(offlineHtmlSrc) && !fs.existsSync(offlineHtmlDest)) {
    await copyFile(offlineHtmlSrc, offlineHtmlDest);
    console.log('✅ Created: public/offline.html');
  }
  
  const iconsDir = path.join(TARGET_DIR, 'public/icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
    console.log('✅ Created: public/icons/ directory');
  }
  
  console.log('\n✅ Static assets copied successfully!\n');
}

async function copyPWAPages() {
  console.log('📄 Copying PWA pages...\n');
  
  const offlinePageSrc = path.join(SOURCE_DIR, 'app/offline/page.tsx');
  const offlinePageDest = path.join(TARGET_DIR, 'app/offline/page.tsx');
  
  if (fs.existsSync(offlinePageSrc) && !fs.existsSync(offlinePageDest)) {
    const offlineDir = path.dirname(offlinePageDest);
    if (!fs.existsSync(offlineDir)) {
      fs.mkdirSync(offlineDir, { recursive: true });
    }
    await copyFile(offlinePageSrc, offlinePageDest);
    console.log('✅ Created: app/offline/page.tsx');
  }
  
  const manifestTsSrc = path.join(SOURCE_DIR, 'app/manifest.ts');
  const manifestTsDest = path.join(TARGET_DIR, 'app/manifest.ts');
  
  if (fs.existsSync(manifestTsSrc) && !fs.existsSync(manifestTsDest)) {
    await copyFile(manifestTsSrc, manifestTsDest);
    console.log('✅ Created: app/manifest.ts');
  }
  
  console.log('\n✅ PWA pages copied successfully!\n');
}

async function copyNextConfigTemplate() {
  console.log('⚙️ Checking Next.js config...\n');
  
  const configPaths = [
    path.join(TARGET_DIR, 'next.config.js'),
    path.join(TARGET_DIR, 'next.config.mjs'),
  ];
  
  const existingConfig = configPaths.find(p => fs.existsSync(p));
  
  if (!existingConfig) {
    const templateSrc = path.join(SOURCE_DIR, 'next.config.template.js');
    
    if (fs.existsSync(templateSrc)) {
      await copyFile(templateSrc, path.join(TARGET_DIR, 'next.config.js'));
      console.log('✅ Created: next.config.js with PWA configuration');
    }
  } else {
    console.log(`⚠️ Existing config found: ${existingConfig}`);
  }
  
  console.log('');
}

module.exports = {
  copyPWAAssets,
  copyPWAPages,
  copyNextConfigTemplate,
  copyDirectory,
  copyFile,
};

if (require.main === module) {
  (async () => {
    await copyPWAAssets();
    await copyPWAPages();
    await copyNextConfigTemplate();
  })();
}