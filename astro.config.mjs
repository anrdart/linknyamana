// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  output: 'server',
  integrations: [react()],
  adapter: cloudflare(),
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: ['bcryptjs'],
    },
    optimizeDeps: {
      exclude: ['bcryptjs'],
    },
    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: {
        '@': __dirname + './src',
      },
    },
  },
});
