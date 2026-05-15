import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    allowedHosts: [
      'whale-app-hbb36.ondigitalocean.app',
    ],
  },
  preview: {
    allowedHosts: [
      'whale-app-hbb36.ondigitalocean.app',
    ],
  },
});
