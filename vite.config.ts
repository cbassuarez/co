import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  // Baked venue for a pinned install. Default null = the public web build, where
  // place is resolved at runtime (?place= / timezone). scripts/build-venue.mjs sets
  // CO_VENUE to a place/venue id to pin a tarball to one place regardless of host tz.
  define: {
    __CO_VENUE__: JSON.stringify(process.env.CO_VENUE ?? null)
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    chunkSizeWarningLimit: 2048
  }
});
