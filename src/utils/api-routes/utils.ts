import sendgrid from '@sendgrid/mail';
import { errors } from '../errors';

type EmailOptions = {
  to: string;
  from: string;
  subject: string;
  html: string;
};

const isDevOrTestEnvironment =
  process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

export async function sendEmail(options: EmailOptions) {
  // The old local Inbucket path depended on Nodemailer and is no longer used.
  // Keep development/test side-effect free while preserving the production
  // SendGrid path used by invitation and account-deletion emails.
  if (isDevOrTestEnvironment) {
    return;
  }

  try {
    return await sendgrid.send(options);
  } catch (error) {
    errors.add(error);
  }
}
