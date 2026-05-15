/**
 * Vite configuration for DigitalOcean preview/dev hosts.
 *
 * This repository is a Next.js app, but this config is harmless if Vite is not
 * used. It is present so any Vite-based preview process allows the deployed
 * DigitalOcean hostname instead of blocking it with an allowedHosts error.
 */
module.exports = {
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
};
