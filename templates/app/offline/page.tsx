// templates/app/offline/page.tsx
import { OfflinePage } from 'next-pwa-professional';

export const metadata = {
  title: 'آفلاین - برنامه',
  description: 'شما در حالت آفلاین هستید',
};

export default function OfflineRoute() {
  return <OfflinePage />;
}