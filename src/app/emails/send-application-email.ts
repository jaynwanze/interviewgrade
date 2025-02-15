import { action } from '@/lib/safe-action';
import { z } from 'zod';
import type { SAPayload } from '@/types';

const sendApplicationEmailSchema = z.object({
  recipientEmail: z.string().email(),
  applicationUrl: z.string().url(),
  applicantName: z.string(),
});

export const sendApplicationEmail = action(
  sendApplicationEmailSchema,
  async ({
    recipientEmail,
    applicationUrl,
    applicantName,
  }): Promise<SAPayload<undefined>> => {
    try {
      const response = await fetch('/api/email/application-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipientEmail, applicationUrl, applicantName }),
      });

      if (!response.ok) {
        throw new Error('Failed to send application email');
      }

      return { status: 'success', data: undefined };
    } catch (error) {
      console.error('Error sending application email:', error);
      return {
        status: 'error',
        message: `Failed to send application email. ${error.message}`,
      };
    }
  },
);
