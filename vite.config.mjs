import { defineConfig } from 'vite';
import path from 'path';
import vue from '@vitejs/plugin-vue';
import Components from 'unplugin-vue-components/vite';
import { PrimeVueResolver } from '@primevue/auto-import-resolver';

export default defineConfig({
  root: 'frontend',
  publicDir: 'public', 
  plugins: [
    vue(),
    Components({
      resolvers: [
        PrimeVueResolver()
      ]
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './frontend/src')
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            if (id.includes('chart.js')) {
              return 'vendor-charts';
            }
            if (id.includes('primevue') || id.includes('@primevue') || id.includes('primeicons')) {
              return 'vendor-primevue';
            }
            if (id.includes('vue') || id.includes('pinia')) {
              return 'vendor-vue';
            }
          }
        },
      },
      input: {
        main: path.resolve(process.cwd(), 'frontend/index.html'),
      },
    },
  },
});
