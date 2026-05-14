import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: '.',
  server: {
    port: 5200,
    open: '/index.supervisor.html',
  },
  resolve: {
    alias: [
      {
        // Intercept any import of lib/supabase and replace with mock
        find: /.*\/lib\/supabase$/,
        replacement: resolve(__dirname, 'src/supervisor-preview/mockSupabase.ts'),
      },
    ],
  },
})
