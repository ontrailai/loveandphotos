import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
      '@providers': path.resolve(__dirname, './src/providers'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@assets': path.resolve(__dirname, './src/assets'),
      // Ensure single React instance
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    },
  },
  server: {
    port: 5173,
    open: true, // Opens browser automatically
    cors: true,
    proxy: {
      // Proxy Supabase requests to avoid CORS issues
      '/api/supabase': {
        target: 'https://ldxscjxoakqrmkgqwwhr.supabase.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/supabase/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  },
  build: {
    // Bundle optimization for production
    target: 'es2020',
    minify: 'esbuild',
    cssMinify: true,

    // Bundle analysis and optimization
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunks
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['lucide-react', '@radix-ui/react-label', '@radix-ui/react-slot'],
          forms: ['react-hook-form'],
          notifications: ['react-hot-toast'],
          stripe: ['@stripe/react-stripe-js', '@stripe/stripe-js'],

          // App chunks
          auth: ['@supabase/supabase-js'],
          utils: ['clsx', 'tailwind-merge', 'date-fns'],
        },

        // Optimize chunk names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },

    // Bundle size analysis
    reportCompressedSize: true,
    chunkSizeWarningLimit: 1000,

    // Source maps for production debugging
    sourcemap: true
  },

  // Performance optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'lucide-react',
      'clsx',
      'tailwind-merge',
      'swr',
      'motion/react',
      '@stripe/react-stripe-js',
      '@stripe/stripe-js'
    ],
    force: true // Force re-optimization on every start
  },

  // Environment handling
  define: {
    // Ensure environment variables are properly defined
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
  }
})
