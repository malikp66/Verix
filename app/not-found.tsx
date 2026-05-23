import { ErrorPageLayout } from '@/components/ErrorPageLayout';

export default function NotFound() {
  return <ErrorPageLayout statusCode={404} />;
}
