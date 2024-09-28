import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Send } from 'lucide-react';
import { useState } from 'react';

type Props = {
  onConfirm: () => void;
};

export const ConfirmSendLoginLinkDialog = ({ onConfirm }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="text-sm font-medium underline underline-offset-4 ">
          Send login link
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="p-3 w-fit bg-muted mb-2 rounded-lg">
            <Send className=" w-6 h-6" />
          </div>
          <div className="p-1">
            <DialogTitle className="text-lg">Send Login Link</DialogTitle>
            <DialogDescription className="text-base mt-0">
              Are you sure you want to send a login link to the user?
            </DialogDescription>
          </div>
        </DialogHeader>
        <DialogFooter className="mt-2">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              setOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            className="w-full"
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
          >
            Send Login Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
