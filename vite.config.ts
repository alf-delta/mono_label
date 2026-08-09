import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    // Native FSEvents can stall during watcher creation on some macOS/Node
    // combinations. Polling keeps local startup deterministic.
    watch: {
      usePolling: true,
      interval: 150,
    },
    proxy: {
      '/api': 'http://127.0.0.1:5174',
    },
  },
});
