import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  base: './',
  
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'components/index.html')
      },
      output: {
        manualChunks: {
          vendor: ['vite'],
          audio: ['./js/modules/audio-manager.js'],
          timeline: ['./js/modules/timeline-manager.js'],
          effects: ['./js/modules/effects-manager.js'],
          ui: ['./js/modules/ui-manager.js']
        }
      }
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  
  server: {
    port: 3000,
    open: true,
    host: true
  },
  
  preview: {
    port: 4173,
    open: true
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      '@js': resolve(__dirname, './js'),
      '@css': resolve(__dirname, './css'),
      '@assets': resolve(__dirname, './assets')
    }
  },
  
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      css: {
        charset: false
      }
    }
  },
  
  optimizeDeps: {
    include: ['vite']
  },
  
  plugins: []
});
