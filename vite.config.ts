import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

const clientPort = Number(process.env.SKILL_BUILDER_CLIENT_PORT || 3847)
const serverPort = Number(process.env.SKILL_BUILDER_SERVER_PORT || 3848)

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: clientPort,
    proxy: {
      '/api': `http://localhost:${serverPort}`,
    },
  },
})
