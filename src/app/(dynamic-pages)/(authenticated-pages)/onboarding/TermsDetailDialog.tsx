'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function TermsDetailDialog({
  onConfirm,
  isLoading,
}: {
  onConfirm: () => void;
  isLoading: boolean;
}) {
  return (
    <Dialog data-testid="accept-terms-onboarding">
      <DialogTrigger asChild>
        <Button className="w-full" variant="default">
          View Terms
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-lg pb-4 space-y-4">
            Terms and conditions
          </DialogTitle>
        </DialogHeader>
        <div className="ring-1 ring-foreground/10 rounded-md">
          <div className="overflow-auto max-h-80 flex flex-col  space-y-2 p-2 bg-muted">
            <p className="text-sm  rounded-lg p-4 text-foreground/70 ">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. In sed
              lorem placerat, finibus nulla vitae, molestie ligula. Praesent
              viverra elit luctus metus sagittis viverra. In eleifend lacus ut
              eros mattis bibendum in eu dui. Nunc eu diam mauris. Aliquam
              auctor, nisi et efficitur rutrum, leo nisi fringilla orci, sit
              amet semper nibh sem vel libero. Ut tempor quam eget lectus
              consequat, id egestas nisi semper. Aliquam pharetra tincidunt
              sagittis. Ut nec gravida tortor. Proin vitae dolor magna. Duis sed
              pulvinar lectus, et volutpat tortor. Vestibulum ante ipsum primis
              in faucibus orci luctus et ultrices posuere cubilia curae; Sed eu
              blandit justo. Sed dapibus tempor luctus. Ut tempor quam eget
              lectus consequat, id egestas nisi semper. Aliquam pharetra
              tincidunt sagittis. Ut nec gravida tortor. Proin vitae dolor
              magna. Duis sed pulvinar lectus, et volutpat tortor. Vestibulum
              ante ipsum primis in faucibus orci luctus et ultrices posuere
              cubilia curae; Sed eu blandit justo. Sed dapibus tempor luctus.
            </p>
            
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            onClick={() => onConfirm()}
            variant="default"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Accepting terms...' : 'Accept Terms'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
