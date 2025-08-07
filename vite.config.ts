import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Vite plugin to log client-side errors to the console
const logClientErrors = (): Plugin => ({
  name: 'log-client-errors',
  configureServer(server) {
    server.middlewares.use('/log-error', (req, res, next) => {
      // We are only interested in POST requests
      if (req.method !== 'POST') {
        return next();
      }

      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });

      req.on('end', () => {
        console.error('\n--- Client-side Error ---');
        try {
          const error = JSON.parse(body);
          console.error(`Message: ${error.message}`);
          if (error.stack) {
            // A bit of formatting to make stack traces more readable
            console.error(`Stack:\n${error.stack.split('\n').map((l: string) => `  ${l}`).join('\n')}`);
          }
        } catch (e) {
          console.error('Received unparseable error log:', body);
        }
        console.error('--------------------------\n');

        // Send a confirmation response to the client
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Error logged successfully' }));
      });
    });
  },
});

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'generateSW',
      minify: false,
      includeAssets: ['vite.svg'], // Only include existing assets
      manifest: {
        name: 'My Awesome PWA', // Your app's full name
        short_name: 'MyPWA',    // Short name for homescreen
        description: 'My awesome React TypeScript PWA!',
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
    logClientErrors(),
  ],
  build: { minify: false },
  base: '/my-pwa-app/',
  server: {
    // Make server accessible on local network for mobile testing
    host: '0.0.0.0',
  },
});

