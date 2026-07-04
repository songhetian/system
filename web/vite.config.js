import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            manifest: {
                name: '人力智能排班薪资一体化中台',
                short_name: 'Shop HR',
                description: '智能排班薪资一体化管理平台',
                theme_color: '#1677ff',
                background_color: '#ffffff',
                display: 'standalone',
                icons: [
                    { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
                    { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
                runtimeCaching: [
                    {
                        urlPattern: /^\/api\//,
                        handler: 'NetworkFirst',
                        options: { cacheName: 'api-cache', expiration: { maxEntries: 50, maxAgeSeconds: 60 } },
                    },
                ],
            },
        }),
    ],
    resolve: {
        alias: { '@': path.resolve(__dirname, './src') },
    },
    server: {
        port: 5173,
        proxy: {
            '/api': { target: 'http://localhost:3000', changeOrigin: true },
        },
    },
});
