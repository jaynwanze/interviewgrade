'use client';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { ReactNode, useState } from 'react';

interface SimpleDialogProps {
  trigger: ReactNode;
  children: ReactNode;
}

export const SimpleDialog = ({ trigger, children }: SimpleDialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>{children}</DialogContent>
    </Dialog>
  );
};
