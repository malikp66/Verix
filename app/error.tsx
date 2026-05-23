'use client';

import { ErrorPageLayout } from '@/components/ErrorPageLayout';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string; statusCode?: number };
  reset: () => void;
}) {
  const statusCode = error?.statusCode || 500;

  return (
    <ErrorPageLayout
      statusCode={statusCode}
      digest={error?.digest}
      onReset={reset}
    />
  );
}
