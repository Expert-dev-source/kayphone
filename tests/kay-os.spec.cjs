const { test, expect } = require('@playwright/test');

async function unlockDemo(page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const onboarding=page.locator('#onboarding');
  await expect(onboarding).toBeVisible({timeout:15000});
  await page.locator('#onboardingSkip').click();
  await page.locator('#lockHint').click();
  await expect(page.locator('#passcodeOverlay')).toHaveClass(/open/);
  for(let n=0;n<6;n++)await page.locator('.passcode-key').nth(n).click();
  await expect(page.locator('#screen-home')).toHaveClass(/active/, {timeout:10000});
  await expect(page.locator('#kayHomeIntro')).toBeVisible({timeout:10000});
}

test('Kay OS actually loads, unlocks, and shows the new home',async({page})=>{
  const errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await unlockDemo(page);
  await expect(page.locator('#kayHomeTime')).toHaveText(/\d{1,2}:\d{2}/);
  await expect(page.locator('.kay-space-home')).toBeVisible();
  await expect(page.locator('#kayDesktopStage')).toHaveCount(1);
  await expect(page.locator('.app-item[data-appid="space"]')).toHaveCount(1);
  expect(await page.evaluate(()=>!!window.KayExperience&&!!window.KaySpace)).toBe(true);
  expect(errors).toEqual([]);
});

test('Space stores a real task, edits it, filters, reopens it, and exports backup',async({page})=>{
  await unlockDemo(page);
  await page.locator('.kay-space-home').click();
  await expect(page.locator('#view-space')).toHaveClass(/open/);
  await expect(page.locator('.space-empty')).toBeVisible();
  await page.locator('#kaySpaceRoot [data-space-action="task"]').click();
  await page.locator('.space-form [name="title"]').fill('Ship something functional');
  await page.locator('.space-form [name="body"]').fill('Verify task persistence and keyboard access');
  await page.locator('.space-form button[type="submit"]').click();
  await expect(page.locator('.space-card-title')).toHaveText('Ship something functional');
  await page.locator('#kaySpaceRoot [data-space-action^="pin:"]').click();
  await expect(page.locator('.space-card.space-pinned')).toHaveCount(1);
  await page.locator('#kaySpaceRoot [data-space-action^="toggle:"]').click();
  await expect(page.locator('.space-card.space-done')).toHaveCount(1);
  await page.locator('#kaySpaceRoot [data-space-action^="edit:"]').click();
  await page.locator('.space-form [name="title"]').fill('Ship and test the app');
  await page.locator('.space-form button[type="submit"]').click();
  await expect(page.locator('.space-card-title')).toHaveText('Ship and test the app');
  await page.locator('.space-search').fill('no such item');
  await expect(page.locator('.space-empty')).toBeVisible();
  await page.locator('.space-search').fill('');
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#kaySpaceRoot [data-space-action="export"]').click();
  const download=await downloadPromise;
  expect(download.suggestedFilename()).toBe('kay-space-backup.json');
  const cards=await page.evaluate(()=>JSON.parse(localStorage.getItem('kayos_space_v1')));
  expect(cards).toHaveLength(1);
  expect(cards[0].title).toBe('Ship and test the app');
  expect(cards[0].done).toBe(true);
  await page.reload();
  await expect(page.locator('#onboarding')).not.toHaveClass(/open/);
  await page.locator('#lockHint').click();
  for(let n=0;n<6;n++)await page.locator('.passcode-key').nth(n).click();
  await expect(page.locator('#screen-home')).toHaveClass(/active/);
  await page.locator('.kay-space-home').click();
  await expect(page.locator('.space-card-title')).toHaveText('Ship and test the app');
});

test('Focus timer is functional and command palette opens Kay Space',async({page})=>{
  await unlockDemo(page);
  await page.keyboard.press('Control+k');
  await expect(page.locator('#spotlight')).toHaveClass(/open/);
  await page.locator('#spotlightInput').fill('Kay Space');
  await expect(page.locator('#spotlightResults [data-kay-appid="space"]')).toBeVisible();
  await page.locator('#spotlightResults [data-kay-appid="space"]').click();
  await expect(page.locator('#view-space')).toHaveClass(/open/);
  await page.locator('#kaySpaceRoot [data-space-action="focus:start"]').click();
  expect(await page.evaluate(()=>document.body.dataset.focus)).toBe('work');
  await expect(page.locator('#spaceTimer')).not.toHaveText('25:00');
  await page.locator('#kaySpaceRoot [data-space-action="focus:stop"]').click();
  expect(await page.evaluate(()=>document.body.dataset.focus)).toBe('off');
});

test.use({viewport:{width:390,height:844}});
