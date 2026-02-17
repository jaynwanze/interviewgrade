import { Page } from '@playwright/test';

export async function dashboardDefaultOrganizationIdHelper({
  page,
}: {
  page: Page;
}): Promise<string> {
  await page.goto('/dashboard');

  let organizationId: string | undefined;
  await page.waitForURL((url) => {
    const match = url
      .toString()
      .match(
        /\/organization\/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})/,
      );
    if (match) {
      organizationId = match[1];
      return true;
    }
    return false;
  });

  if (!organizationId) {
    throw new Error(`Organization Id doesn't exist`);
  }
  return organizationId;
}
