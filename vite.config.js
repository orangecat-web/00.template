import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { resolve } from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // ═══ 多頁正式建置入口 ═══
  build: { rollupOptions: { input: {
    main: resolve(import.meta.dirname, 'index.html'),
    icons: resolve(import.meta.dirname, 'icons.html'),
    work: resolve(import.meta.dirname, 'work.html'),
    project: resolve(import.meta.dirname, 'project.html'),
    lab: resolve(import.meta.dirname, 'lab.html'),
    notFound: resolve(import.meta.dirname, '404.html'),
  } } },
})
