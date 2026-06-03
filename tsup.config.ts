// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    'react', 
    'react-dom', 
    'next', 
    'idb',
    // اضافه کردن هر dependency دیگری که نباید bundle شود
  ],
  target: 'es2020',
  // غیرفعال کردن banner برای جلوگیری از مشکلات
  banner: {},
  // تنظیمات برای resolve کردن moduleها
  noExternal: [],
});