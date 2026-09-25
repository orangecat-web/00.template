import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { resolve } from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  input: {
    main: resolve(import.meta.dirname, 'index.html'),
    icons: resolve(import.meta.dirname, 'icons.html'),
    work: resolve(import.meta.dirname, 'work.html'),
    lab: resolve(import.meta.dirname, 'lab.html'),
  },
})
