import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': 'http://localhost:3000',
      '/tasks': {
        target: 'http://localhost:3000',
        bypass(req) {
          if (req.headers.accept && req.headers.accept.includes('text/html')) return req.url;
        }
      },
      '/categories': {
        target: 'http://localhost:3000',
        bypass(req) {
          if (req.headers.accept && req.headers.accept.includes('text/html')) return req.url;
        }
      },
      '/finance': {
        target: 'http://localhost:3000',
        bypass(req) {
          if (req.headers.accept && req.headers.accept.includes('text/html')) return req.url;
        }
      },
    }
  }
})
