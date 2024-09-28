import { sendApplicationEmail } from "@/app/emails/send-application-email";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useSAToastMutation } from "@/hooks/useSAToastMutation";
import { Send } from "lucide-react";
import { useState } from "react";

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  applicationUrl: string;
}

export function ShareDialog({ isOpen, onClose, applicationUrl }: ShareDialogProps) {
  const [email, setEmail] = useState("");
  const [applicantName, setApplicantName] = useState("");
  const { toast } = useToast();

  const { mutate, isLoading } = useSAToastMutation(sendApplicationEmail, {
    loadingMessage: "Sending application email...",
    successMessage: "The application link has been sent successfully.",
    errorMessage: "Failed to send application email. Please try again. " ,
    onSuccess: () => {
      onClose();
      setEmail("");
      setApplicantName("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({ recipientEmail: email, applicationUrl, applicantName });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] ">
        <DialogHeader>
          <DialogTitle>Share Application</DialogTitle>
          <DialogDescription>
            Send the application link to an email address.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="applicantName" className="text-left">
                Name
              </Label>
              <Input
                id="applicantName"
                type="text"
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-left">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send"}
              <Send className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}