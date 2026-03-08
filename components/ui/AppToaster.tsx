'use client';

import { Toaster } from 'sonner';

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      duration={3500}
      toastOptions={{
        classNames: {
          toast: 'rounded-xl border border-stone-200 shadow-lg',
          title: 'text-sm font-semibold text-stone-900',
          description: 'text-sm text-stone-600',
        },
      }}
    />
  );
}

