import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// Choices and doc links: DESIGN.md, "Research decisions".
export default defineConfig({
  // The live site is a GitHub Pages project site.
  base: '/ingredient_to_recipe_maker/',
  server: {
    // The local Worker only accepts http://localhost:3000 (DEV_ORIGIN).
    port: 3000,
    strictPort: true,
    fs: {
      // Vite's default list (repeated, since the docs don't say whether
      // setting this replaces it), the Worker's secrets file, and folders
      // that hold local data (Claude Code settings, Wrangler cache/state).
      deny: ['.env', '.env.*', '*.{crt,pem,key,p12,pfx,cer,der}', '.npmrc',
        '.yarnrc.yml', '**/.git/**', '.dev.vars', '.dev.vars.*',
        '**/.claude/**', '**/.wrangler/**'],
    },
  },
  // Same port, so the built site can also call the local Worker.
  preview: { port: 3000, strictPort: true },
  // From Ionic's JS quickstart.
  optimizeDeps: { exclude: ['@ionic/core'] },
  build: {
    rollupOptions: {
      output: { manualChunks: undefined },
    },
  },
  plugins: [
    viteStaticCopy({
      targets: [{
        src: 'node_modules/@ionic/core/dist/ionic/*',
        dest: '',
        // Plugin v4 keeps folder structure; strip node_modules/@ionic/core/dist/ionic
        // so ionic.esm.js sits at the base path (Ionic's docs predate this).
        rename: { stripBase: 5 },
      }],
    }),
  ],
});
