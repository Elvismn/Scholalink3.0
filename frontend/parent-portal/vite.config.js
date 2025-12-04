import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared')
    }
  },
  build: {
    rollupOptions: {
      external: [], 
    },
  },
  server: {
    host: true,
    port: 5174, // Different port than admin
    strictPort: true,
  }
})
