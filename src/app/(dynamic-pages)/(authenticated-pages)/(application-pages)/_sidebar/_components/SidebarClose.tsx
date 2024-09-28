'use client';
import { SidebarVisibilityContext } from '@/contexts/SidebarVisibilityContext';
import { setSidebarVisibility } from '@/data/user/ui';
import { cn } from '@/utils/cn';
import { useMutation } from '@tanstack/react-query';
import { PanelLeftClose } from 'lucide-react';
import { useContext } from 'react';
import { toast } from 'sonner';

export function SidebarClose() {
  const { setVisibility: setVisibilityContextValue } = useContext(
    SidebarVisibilityContext,
  );
  const { mutate } = useMutation(setSidebarVisibility, {
    onError: (error) => {
      console.log(error);
      toast.error('An error occurred.');
    },
  });
  function closeSidebar() {
    mutate(false);
    setVisibilityContextValue(false);
  }
  return (
    <div
      className={cn(
        'group border cursor-pointer flex items-center p-1.5 h-fit bg-background hover:bg-secondary rounded-md',
        'hidden lg:block',
      )}
      onClick={closeSidebar}
    >
      <PanelLeftClose className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
    </div>
  );
}
