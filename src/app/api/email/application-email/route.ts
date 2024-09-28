import { resend, resendFrom } from '@/utils/resend';
import ApplicationEmail from 'emails/application-email';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

const emailSchema = z.object({
  applicationUrl: z.string().url(),
  applicantName: z.string(),
  recipientEmail: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { applicationUrl, applicantName, recipientEmail } =
      emailSchema.parse(body); // Added recipientEmail

    const { data, error } = await resend.emails.send({
      from: resendFrom,
      to: [recipientEmail], // Updated to use recipientEmail
      subject: 'Application Link',
      react: ApplicationEmail({ applicationUrl, applicantName }),
      text: `Hello ${applicantName}, please visit ${applicationUrl} to complete your application.`,
    });

    if (error) {
      console.error('Email failed to send:', error); // Added console log

      return Response.json({ error }, { status: 500 });
    }
    console.log('Email sent successfully:', data); // Added console log for success

    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
