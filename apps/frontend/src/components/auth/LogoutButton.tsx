'use client';

import { Button } from '@/components/ui/Button';
import { useLogout } from '@/hooks/useLogout';
import { LogOut } from 'lucide-react'; // ← Add this import
import { cn } from '@/utils/cn';

export interface LogoutButtonProps {
  className?: string;
  collapsed?: boolean;
}

export function LogoutButton({ className, collapsed = false }: LogoutButtonProps) {
  const { logout, isLoggingOut } = useLogout();

  return (
    <Button
      type="button"
      variant="secondary"
      className={cn(
        'w-full',
        collapsed 
          ? 'h-10 px-2 justify-center' 
          : 'justify-start',
        className
      )}
      disabled={isLoggingOut}
      aria-label="Log out"
      onClick={() => void logout()}
    >
      {isLoggingOut ? (
        'Logging out...'
      ) : collapsed ? (
        <LogOut className="h-5 w-5" />
      ) : (
        <>
          <LogOut className="h-5 w-5 mr-3" />
          Log out
        </>
      )}
    </Button>
  );
}