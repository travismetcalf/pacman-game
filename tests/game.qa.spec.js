const { test, expect } = require('@playwright/test');

test.describe('Pac-Man QA smoke tests', () => {
  test('loads core UI and game canvas', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'PAC-MAN' })).toBeVisible();
    await expect(page.locator('#score-value')).toHaveText('0');
    await expect(page.locator('#lives-value')).toContainText('❤');
    await expect(page.locator('#level-value')).toHaveText('1/4');
    await expect(page.getByRole('heading', { name: 'Leaderboard' })).toBeVisible();

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

  test('advances through added levels', async ({ page }) => {
    await page.goto('/');

    await page.evaluate(() => window.__PACMAN_DEBUG__.start());
    await expect(page.locator('#level-value')).toHaveText('1/4');

    await page.evaluate(() => window.__PACMAN_DEBUG__.advanceLevel());
    await expect(page.locator('#level-value')).toHaveText('2/4');

    await page.evaluate(() => window.__PACMAN_DEBUG__.advanceLevel());
    await expect(page.locator('#level-value')).toHaveText('3/4');

    await page.evaluate(() => window.__PACMAN_DEBUG__.advanceLevel());
    await expect(page.locator('#level-value')).toHaveText('4/4');
  });

  test('prompts for initials and saves top-10 high scores', async ({ page }) => {
    await page.goto('/');

    await page.evaluate(() => {
      const scores = [900, 800, 700, 600, 500, 400, 300, 200, 100];
      window.__PACMAN_DEBUG__.setLeaderboard(
        scores.map((score, i) => ({ initials: `A${i}A`.slice(0, 3), score }))
      );
      window.__PACMAN_DEBUG__.setScore(950);
      window.__PACMAN_DEBUG__.forceGameOver();
    });

    await expect(page.locator('#highscore-modal')).toBeVisible();
    await page.locator('#initials-input').fill('abc');
    await page.locator('#save-score-btn').click();

    await expect(page.locator('#highscore-modal')).toBeHidden();
    await expect(page.locator('#leaderboard-list li').first()).toContainText('ABC');
    await expect(page.locator('#leaderboard-list li').first()).toContainText('950');
    await expect(page.locator('#leaderboard-list li')).toHaveCount(10);
  });
});
