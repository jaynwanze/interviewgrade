'use client';
import { SidebarVisibilityContext } from '@/contexts/SidebarVisibilityContext';
import { setSidebarVisibility } from '@/data/user/ui';
import { cn } from '@/utils/cn';
import { useMutation } from '@tanstack/react-query';
import { Menu, PanelLeftOpen } from 'lucide-react';
import Image from 'next/image';
import darkLogo from 'public/logos/nextbase-dark-logo.png';
import lightLogo from 'public/logos/nextbase-light-logo.png';
import { useContext } from 'react';
import { toast } from 'sonner';

export function SidebarOpen() {
  const { setVisibility: setVisibilityContextValue, isVisible } = useContext(
    SidebarVisibilityContext,
  );
  const { mutate } = useMutation(setSidebarVisibility, {
    onError: (error) => {
      console.log(error);
      toast.error('An error occurred.');
    },
  });
  function openSidebar() {
    mutate(true);
    setVisibilityContextValue(true);
  }
  return (
    <>
      {/* lg+ */}
      <div
        className={cn(
          'items-center ',
          isVisible ? 'hidden ' : 'hidden lg:flex',
        )}
      >
        <div className="flex items-center gap-2 ">
          <div
            className={cn(
              'flex group cursor-pointer border items-center p-1.5 h-[30px] hover:bg-neutral-50 dark:hover:bg-white/5 rounded-md',
            )}
            onClick={openSidebar}
          >
            <PanelLeftOpen className="h-4 w-4 text-neutral-500 group-hover:text-neutral-700 dark:text-slate-400 group-hover:dark:text-slate-300" />
          </div>
          <Image
            width={32}
            src={lightLogo}
            alt="Logo Login"
            className={cn(
              'rotate-0 transition-all cursor-pointer  dark:-rotate-90 dark:hidden block',
            )}
          />

          <Image
            width={32}
            src={darkLogo}
            alt="Logo Login"
            className={cn(
              ' rotate-90 transition-all cursor-pointer  dark:rotate-0 hidden dark:block',
            )}
          />
        </div>
        <div className="w-px h-5 ml-2 mr-4 bg-gray-300 dark:bg-slate-700" />
      </div>
      {/* xs to md */}
      <div className="flex lg:hidden items-center w-fit">
        <div className="flex items-center gap-2 w-20">
          <div
            className="group cursor-pointer border flex items-center p-1.5 h-[30px] hover:bg-neutral-50 dark:hover:bg-white/5 rounded-md"
            onClick={openSidebar}
          >
            <Menu className="h-4 w-4 text-neutral-500 group-hover:text-neutral-700 dark:text-slate-400 group-hover:dark:text-slate-300" />
          </div>
        </div>
      </div>
    </>
  );
}
