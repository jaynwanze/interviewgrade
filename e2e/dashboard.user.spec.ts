import { test } from '@playwright/test';
import { dashboardDefaultOrganizationIdHelper } from './helpers/dashboard-default-organization-id.helper';

test('dashboard for a user with profile', async ({ page }) => {
  const organizationId = await dashboardDefaultOrganizationIdHelper({ page });
  const settingsPageURL = `/organization/${organizationId}/settings`;
  const billingPageURL = `/organization/${organizationId}/settings/billing`;
  const membersPageURL = `/organization/${organizationId}/settings/members`;

  // check for the presence of the settings page
  await page.goto(settingsPageURL);
  // wait for text Edit Organization Title
  await page.waitForSelector('text=Edit Organization Title');

  // check for the presence of the members page
  await page.goto(membersPageURL);
  // wait for text Team Members
  await page.waitForSelector('text=Team Members');

  // check for the presence of the billing page
  await page.goto(billingPageURL);
  // wait for text Subscription
  await page.waitForSelector('text=Subscription');
});
