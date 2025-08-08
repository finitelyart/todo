import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'generateSW',
      minify: false,
      includeAssets: ['vite.svg'], // Only include existing assets
      manifest: {
        name: 'Todo App PWA',
        short_name: 'TodoApp',
        description: 'A simple Todo application.',
        theme_color: '#ffffff', // Theme color for the browser UI
        icons: [
          {
            src: 'vite.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
        ],
      },
      devOptions: {
        enabled: true, // Enable PWA in development for testing
      },
    }),
  ],
  build: { minify: false },
  base: process.env.VITE_BASE_PATH,
  server: {
    // Make server accessible on local network for mobile testing
    host: '0.0.0.0',
  },
});

