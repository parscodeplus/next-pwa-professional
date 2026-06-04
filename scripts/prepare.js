#!/usr/bin/env node

// این فایل هم در توسعه و هم در نصب اجرا می‌شود
// اما باید تشخیص دهیم کجا هستیم

const fs = require('fs');
const path = require('path');

// بررسی اینکه آیا در پروژه مقصد هستیم
const isInNodeModules = process.cwd().includes('node_modules') || 
                        fs.existsSync(path.join(process.cwd(), 'node_modules'));

if (!isInNodeModules) {
  console.log('📦 Running in development mode, skipping setup');
  process.exit(0);
}

// اجرای setup اصلی
require('./postinstall.js');