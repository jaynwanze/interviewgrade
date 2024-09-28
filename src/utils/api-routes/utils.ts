import sendgrid from '@sendgrid/mail';
import { errors } from '../errors';
import { sendEmailInbucket } from '../sendEmailInbucket';

//sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

type EmailOptions = {
  to: string;
  from: string;
  subject: string;
  html: string;
};

const isDevOrTestEnvironment =
  process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

export async function sendEmail(options: EmailOptions) {
  if (isDevOrTestEnvironment) {
    await sendEmailInbucket(options);
    return;
  }
  try {
    return sendgrid.send(options);
  } catch (error) {
    errors.add(error);
  }
}
