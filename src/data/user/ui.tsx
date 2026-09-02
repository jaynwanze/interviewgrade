'use server';

import { SIDEBAR_VISIBILITY_COOKIE_KEY } from '@/constants';
import { cookies } from 'next/headers';

export async function setSidebarVisibility(isVisible: boolean) {
  const cookieStore = await cookies();
  cookieStore.set(SIDEBAR_VISIBILITY_COOKIE_KEY, String(isVisible));
  return isVisible;
}
