import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { resolve } from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // 本機 PHP 服務獨立執行，瀏覽器仍只連到 Vite 同一來源。
  server: { proxy: { '/api': { target: 'http://127.0.0.1:8088', changeOrigin: false }, '/images/projects/uploads': { target: 'http://127.0.0.1:8088', changeOrigin: false } } },
  // ═══ 多頁正式建置入口 ═══
  build: { emptyOutDir: false, rollupOptions: { input: {
    admin: resolve(import.meta.dirname, 'admin.html'),
    main: resolve(import.meta.dirname, 'index.html'),
    icons: resolve(import.meta.dirname, 'icons.html'),
    work: resolve(import.meta.dirname, 'work.html'),
    project: resolve(import.meta.dirname, 'project.html'),
    lab: resolve(import.meta.dirname, 'lab.html'),
    notFound: resolve(import.meta.dirname, '404.html'),
  } } },
})
