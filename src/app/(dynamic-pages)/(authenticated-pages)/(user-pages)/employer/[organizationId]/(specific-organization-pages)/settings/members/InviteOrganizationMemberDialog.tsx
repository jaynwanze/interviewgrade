'use client';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Enum } from '@/types';
import { UserPlus } from 'lucide-react';
import { useState } from 'react';

type Props = {
  onInvite: (email: string, role: Enum<'organization_member_role'>) => void;
  isLoading: boolean;
};

export const InviteOrganizationMemberDialog = ({
  onInvite,
  isLoading,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Enum<'organization_member_role'>>('member');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          size="default"
          data-testid="invite-user-button"
        >
          <UserPlus className="mr-2 w-5 h-5" />
          Invite user{' '}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <div className="p-3 w-fit bg-muted mb-2 rounded-lg">
            <UserPlus className=" w-6 h-6" />
          </div>
          <div className="p-1">
            <DialogTitle className="text-lg">Invite user</DialogTitle>
            <DialogDescription className="text-base mt-0">
              Invite a user to your organization.
            </DialogDescription>
          </div>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onInvite(email, role);
            setEmail('');
            setOpen(false);
          }}
          data-testid="invite-user-form"
        >
          <div className="mb-8">
            <Label className="text-muted-foreground">Enter Email</Label>
            <Input
              className="mt-1.5 shadow appearance-none border h-11 rounded-lg w-full py-2 px-3 focus:ring-0 text-muted-foreground leading-tight focus:outline-none focus:shadow-outline text-base"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              type="email"
              name="email"
              required
              disabled={isLoading}
            />
          </div>
          <DialogFooter>
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
              type="submit"
              variant="default"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Inviting User' : 'Invite'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
