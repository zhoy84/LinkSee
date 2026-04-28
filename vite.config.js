import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// LinkSee - 灵犀在线工具箱
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
