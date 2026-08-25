import type { Page } from '@playwright/test';

export async function onboardUserHelper({
  page,
  name,
}: {
  page: Page;
  name: string;
}) {
  const viewTermsDialog = await page.waitForSelector(
    'div[data-testid="view-terms-onboarding"]',
  );

  if (!viewTermsDialog) {
    throw new Error('viewTermsDialog not found');
  }

  const viewTermsButton = await viewTermsDialog.waitForSelector(
    'button:has-text("View Terms")',
  );

  if (!viewTermsButton) {
    throw new Error('view terms button not found');
  }

  await viewTermsButton.click();

  const acceptTermsButton = await page.waitForSelector(
    'button:has-text("Accept Terms")',
  );

  if (!acceptTermsButton) {
    throw new Error('acceptTermsButton not found');
  }

  await acceptTermsButton.click();
  await page.waitForSelector('text=Terms accepted!');

  const form = await page.waitForSelector(
    'form[data-testid="create-new-profile"]',
  );
  if (!form) {
    throw new Error('profile form not found');
  }

  const input = await form.waitForSelector('input[name="name"]');
  await input.fill(name);

  const submitButton = await form.waitForSelector('button:has-text("Save")');
  if (!submitButton) {
    throw new Error('profile save button not found');
  }

  await submitButton.click();
  await page.waitForSelector('text=Profile updated!');

  // V2 intentionally has no candidate/employer organization step. New users
  // land on private Practice preferences and choose their first action.
  await page.waitForSelector('text=Set your Practice target');
  await page.getByLabel('Target role').fill('Business Analyst');
  await page.getByRole('button', { name: 'Graduate' }).click();
  await page.getByRole('button', { name: 'Role-specific' }).click();
  await page.getByRole('button', { name: 'Create a Practice' }).click();
  await page.waitForURL('/candidate/practices/new');
}
