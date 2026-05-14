import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Konfigurasjon for Vite: https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isDev = mode === 'development';
  
  return {
    plugins: [react()],
    server: {
      port: parseInt(env.PORT || (isDev ? '5173' : '8001')),
      host: isDev ? '0.0.0.0' : true, // Tillat ekstern tilkobling i Docker dev
      allowedHosts: isDev ? ['localhost', '.bjornhavar.no'] : undefined,
      watch: {
        usePolling: true, 
        interval: 1000,
      },
      proxy: {
        '/api': {
          target: 'http://backend-dev:6768',
          changeOrigin: true,
        },
      },
      fs: {
        deny: [
          '.env',
          '.env.*',
          '*.{crt,pem}',
          '**/.git/**',
          '.env.development',
          '.env.local',
          '.env.production'
        ]
      }
    },
    // Globale constants 
    define: {
      __APP_ENV__: JSON.stringify(env.NODE_ENV || 'development'),
    },
  };
})
