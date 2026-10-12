import { defineConfig } from 'vite';

// Relative base so the site works when served from GitHub Pages
// at https://<user>.github.io/<repo>/ as well as from any subpath.
export default defineConfig({
  base: './',
});
