import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// Choices and doc links: DESIGN.md, "Research decisions".
// `--mode android` builds the Capacitor app (ANDROID.md step 4).
export default defineConfig(({ mode }) => ({
  // The live site is a GitHub Pages project site; the app serves its files
  // from the root of https://localhost/.
  base: mode === 'android' ? '/' : '/ingredient_to_recipe_maker/',
  // A folder of its own, so a site build is never packaged into the app.
  build: { outDir: mode === 'android' ? 'dist-android' : 'dist' },
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
}));
