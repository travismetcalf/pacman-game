const { test, expect } = require('@playwright/test');

test.describe('Pac-Man QA smoke tests', () => {
  test('loads core UI and game canvas', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'PAC-MAN' })).toBeVisible();
    await expect(page.locator('#score-value')).toHaveText('0');
    await expect(page.locator('#lives-value')).toContainText('❤');

    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();
    await expect(canvas).toHaveJSProperty('width', 672);
    await expect(canvas).toHaveJSProperty('height', 744);
  });

  test('starts game and score increases after movement', async ({ page }) => {
    await page.goto('/');
    const score = page.locator('#score-value');

    await expect(score).toHaveText('0');
    await page.keyboard.press('Space');

    await expect
      .poll(async () => Number(await score.innerText()), { timeout: 7000 })
      .toBeGreaterThan(0);
  });

  test('mute button toggles from click and keyboard shortcut', async ({ page }) => {
    await page.goto('/');
    const muteButton = page.locator('#mute-btn');

    await expect(muteButton).toContainText('Sound On');
    await muteButton.click();
    await expect(muteButton).toContainText('Sound Off');

    await page.keyboard.press('m');
    await expect(muteButton).toContainText('Sound On');
  });
});
