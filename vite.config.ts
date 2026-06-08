import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          injectRegister: 'auto',
          manifestFilename: 'manifest.json',
          includeAssets: [
            'favicon.ico',
            'starfit-icon.svg',
            'apple-touch-icon-180x180.png',
            'pwa-72x72.png',
            'pwa-96x96.png',
            'pwa-128x128.png',
            'pwa-144x144.png',
            'pwa-152x152.png',
            'pwa-192x192.png',
            'pwa-384x384.png',
            'pwa-512x512.png',
            'maskable-icon-512x512.png'
          ],
          devOptions: {
            enabled: true,
          },
          manifest: {
            id: '/',
            name: 'StarFit Fitness Ecosystem',
            short_name: 'StarFit',
            description: 'Plataforma completa para personal trainers e alunos',
            theme_color: '#102216',
            background_color: '#102216',
            display: 'standalone',
            display_override: ['standalone', 'fullscreen', 'minimal-ui'],
            orientation: 'portrait',
            start_url: '/',
            scope: '/',
            icons: [
              {
                src: '/pwa-64x64.png',
                sizes: '64x64',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/pwa-72x72.png',
                sizes: '72x72',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/pwa-96x96.png',
                sizes: '96x96',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/pwa-128x128.png',
                sizes: '128x128',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/pwa-144x144.png',
                sizes: '144x144',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/pwa-152x152.png',
                sizes: '152x152',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/pwa-384x384.png',
                sizes: '384x384',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/maskable-icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
              }
            ]
          },
          workbox: {
            clientsClaim: true,
            skipWaiting: true,
            maximumFileSizeToCacheInBytes: 5000000, // 5MB
            globPatterns: ['**/*.{js,css,html,ico,png,svg}']
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
