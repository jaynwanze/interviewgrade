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
    throw new Error('acceptTermsForm not found');
  }

  const viewTermsButton = await viewTermsDialog.waitForSelector(
    'button:has-text("View Terms")',
  );

  if (!viewTermsButton) {
    throw new Error('view accept terms not found');
  }

  await viewTermsButton.click();

  const acceptTermsButton = await page.waitForSelector(
    'button:has-text("Accept Terms")',
  );

  if (!acceptTermsButton) {
    throw new Error('acceptTermsButton not found');
  }

  await acceptTermsButton.click();

  // wait for text "Terms accepted!"
  await page.waitForSelector('text=Terms accepted!');

  const form = await page.waitForSelector(
    'form[data-testid="create-new-profile"]',
  );
  if (!form) {
    throw new Error('form not found');
  }
  const input = await form.waitForSelector('input[name="name"]');
  // enter text in the input field
  await input.fill(name);
  // get button with text "save"
  const submitButton = await form.waitForSelector('button:has-text("Save")');
  if (!submitButton) {
    throw new Error('submitButton not found');
  }
  await submitButton.click();

  // wait for text "Profile updated!"
  await page.waitForSelector('text=Profile updated!');

  const createOrganizationForm = await page.waitForSelector(
    'form[data-testid="create-new-organization"]',
  );

  if (!createOrganizationForm) {
    throw new Error('createOrganizationForm not found');
  }

  const inputCreateOrg = await createOrganizationForm.waitForSelector(
    'input[name="organizationTitle"]',
  );

  if (!inputCreateOrg) {
    throw new Error('inputCreateOrg not found');
  }

  await inputCreateOrg.fill('My Organization');

  const createOrganizationButton = await createOrganizationForm.waitForSelector(
    'button:has-text("Create Organization")',
  );

  if (!createOrganizationButton) {
    throw new Error('createOrganizationButton not found');
  }

  await createOrganizationButton.click();

  // wait for text "Organization created!"
  await page.waitForSelector('text=Organization created!');
}
