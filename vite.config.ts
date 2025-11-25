import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/', // Ensure absolute paths for Vercel
  build: {
    outDir: 'dist',
  },
  define: {
    // Correctly inject the API key from the build environment into the client code
    // Use a fallback to empty string to prevent build crashes if env is missing
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || '')
  }
});