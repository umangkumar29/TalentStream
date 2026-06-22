import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

console.log('Vite config loaded from vite.config.ts');
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(), // reads @/* from tsconfig.json paths automatically
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
