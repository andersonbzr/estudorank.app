import { test, expect } from '@playwright/test';

test('me page guards unauthenticated users', async ({ page }) => {
  await page.goto('/me');
  // Should redirect or show guard content
  await expect(page).toHaveURL(/login|entrar/);
});
