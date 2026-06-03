// templates/app/manifest.ts
import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Your PWA App',
    short_name: 'PWA App',
    description: 'A professional PWA application with offline support',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    orientation: 'portrait',
    scope: '/',
    categories: ['productivity', 'business'],
    icons: [
      {
        src: '/icons/icon-72x72.png',
        sizes: '72x72',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-128x128.png',
        sizes: '128x128',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-152x152.png',
        sizes: '152x152',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icons/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
    screenshots: [
      {
        src: '/screenshots/desktop.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Desktop view',
      },
      {
        src: '/screenshots/mobile.png',
        sizes: '750x1334',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Mobile view',
      },
    ],
    shortcuts: [
      {
        name: 'Home',
        short_name: 'Home',
        description: 'Go to home page',
        url: '/',
        icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }],
      },
      {
        name: 'Profile',
        short_name: 'Profile',
        description: 'View your profile',
        url: '/profile',
        icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }],
      },
    ],
    related_applications: [
      {
        platform: 'webapp',
        url: 'https://your-domain.com/manifest.json',
      },
    ],
    prefer_related_applications: false,
    handle_links: 'preferred',
    launch_handler: {
      client_mode: ['focus-existing', 'auto'],
    },
    display_override: ['window-controls-overlay', 'standalone'],
    edge_side_panel: {
      preferred_width: 400,
    },
    share_target: {
      action: '/share-target',
      method: 'GET',
      enctype: 'application/x-www-form-urlencoded',
      params: {
        title: 'title',
        text: 'text',
        url: 'url',
      },
    },
    file_handlers: [
      {
        action: '/open-file',
        accept: {
          'text/plain': ['.txt'],
          'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
        },
      },
    ],
    protocol_handlers: [
      {
        protocol: 'web+myapp',
        url: '/handle-protocol?url=%s',
      },
    ],
  };
}