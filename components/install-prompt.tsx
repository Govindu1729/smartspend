'use client';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
  };

  if (!deferredPrompt) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button onClick={handleInstall}>Install App</Button>
    </div>
  );
}
