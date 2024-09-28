'use client';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { MOBILE_MEDIA_QUERY_MATCHER } from '@/constants';
import { SidebarVisibilityContext } from '@/contexts/SidebarVisibilityContext';
import useMatchMedia from '@/hooks/useMatchMedia';
import { useContext } from 'react';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';

export function MobileSidebarShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isVisible, setVisibility } = useContext(SidebarVisibilityContext);
  const isMobile = useMatchMedia(MOBILE_MEDIA_QUERY_MATCHER);
  if (!isMobile) {
    return null;
  }
  return (
    <Sheet open={isVisible} onOpenChange={setVisibility}>
       <SheetTitle>
  <VisuallyHidden.Root>
    Menu
  </VisuallyHidden.Root>
</SheetTitle>
      <SheetContent side="left">{children}</SheetContent>
    </Sheet>
  );
}
