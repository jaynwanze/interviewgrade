import { expect, request, test as setup } from '@playwright/test';
import { onboardUserHelper } from 'e2e/helpers/onboard-user.helper';

const INBUCKET_URL = `http://localhost:54324`;

async function getConfirmEmail(username: string): Promise<{ url: string }> {
  const requestContext = await request.newContext();
  const messages = await requestContext
    .get(`${INBUCKET_URL}/api/v1/mailbox/${username}`)
    .then((res) => res.json())
    // InBucket doesn't have any params for sorting, so here
    // we're sorting the messages by date.
    .then((items) =>
      [...items].sort((a, b) => {
        if (a.date < b.date) return 1;
        if (a.date > b.date) return -1;
        return 0;
      }),
    );

  const latestMessageId = messages[0]?.id;
  if (!latestMessageId) {
    throw new Error('No email received');
  }

  const message = await requestContext
    .get(`${INBUCKET_URL}/api/v1/mailbox/${username}/${latestMessageId}`)
    .then((res) => res.json());

  const bodies = [message.body?.html, message.body?.text].filter(
    (value): value is string => typeof value === 'string' && value.length > 0,
  );

  for (const body of bodies) {
    const href = body.match(/href=["']([^"']+)["']/i)?.[1];
    if (href) {
      return { url: decodeEmailHtml(href) };
    }

    const plainUrl = body.match(/https?:\/\/[^\s<>"')]+/i)?.[0];
    if (plainUrl) {
      return { url: decodeEmailHtml(plainUrl) };
    }
  }

  throw new Error('Confirmation URL not found in email');
}

function decodeEmailHtml(value: string): string {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&#x3D;', '=')
    .replaceAll('&#61;', '=');
}

function getIdentifier(): string {
  return `johndoe` + Date.now().toString().slice(-4);
}

const authFile = 'playwright/.auth/user.json';

setup('create account', async ({ page }) => {
  const identifier = getIdentifier();
  const emailAddress = `${identifier}@myapp.com`;

  await page.goto('/sign-up');

  const magicLoginButton = await page.waitForSelector(
    'button:has-text("Magic Link")',
  );

  if (!magicLoginButton) {
    throw new Error('magicLoginButton not found');
  }

  await magicLoginButton.click();

  await page.getByTestId('magic-link-form').locator('input').fill(emailAddress);
  await page.getByRole('button', { name: 'Sign up with Magic Link' }).click();
  await page.waitForSelector('text=A magic link has been sent to your email!');

  let url: string | undefined;
  await expect
    .poll(
      async () => {
        try {
          const { url: urlFromCheck } = await getConfirmEmail(identifier);
          url = urlFromCheck;
          return typeof urlFromCheck;
        } catch {
          return null;
        }
      },
      {
        message: 'make sure the email is received',
        intervals: [1000, 2000, 5000, 10000, 20000],
      },
    )
    .toBe('string');

  if (!url) {
    throw new Error('Confirmation URL was not resolved');
  }

  await page.goto(url);
  await page.waitForURL('/onboarding');
  await onboardUserHelper({ page, name: 'John Doe' });
  await page.context().storageState({ path: authFile });
});
