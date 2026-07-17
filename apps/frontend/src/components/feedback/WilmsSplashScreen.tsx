import { Skeleton } from '@/components/feedback/Skeleton';

export interface WilmsSplashScreenProps {
  message?: string;
}

export function WilmsSplashScreen({ message = 'Loading' }: WilmsSplashScreenProps) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-wilms-4 bg-background px-wilms-4"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-wilms-2 text-center">
        <Skeleton className="mx-auto h-4 w-40" />
        <Skeleton className="mx-auto h-3 w-56" />
      </div>
    </div>
  );
}
