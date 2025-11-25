import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  define: {
    // Correctly inject the API key from the build environment into the client code
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});