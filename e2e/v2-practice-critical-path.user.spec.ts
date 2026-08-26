import { expect, test, type Page } from '@playwright/test';

const FEEDBACK_SUMMARY =
  'E2E fixture: the answer addressed the published rubric clearly.';

test('creator → mobile guest → final response → report → creator results', async ({
  page,
  browser,
  baseURL,
}) => {
  test.setTimeout(180_000);

  const unique = Date.now().toString();
  const title = `E2E Critical Path ${unique}`;
  const guestName = `E2E Guest ${unique}`;

  await createAndPublishFiveQuestionPractice(page, title);

  const practiceMatch = new URL(page.url()).pathname.match(
    /\/candidate\/practices\/([^/]+)$/,
  );
  const practiceId = practiceMatch?.[1];
  expect(practiceId).toBeTruthy();

  await page.goto('/candidate/practices');
  const practiceCard = page.getByTestId(`practice-card-${practiceId}`);
  await expect(practiceCard).toContainText(title);
  const sharePath = await practiceCard
    .getByRole('link', { name: 'Run' })
    .getAttribute('href');
  expect(sharePath).toMatch(/^\/p\//);

  // Exercise the candidate-facing flow at an iPhone-class viewport. This is
  // where the focused session and visual-first report have had the most layout
  // pressure, so the critical path also protects against accidental horizontal
  // overflow or a shell collapsing into a corner.
  const guestContext = await browser.newContext({
    baseURL: baseURL ?? undefined,
    permissions: ['camera', 'microphone'],
    viewport: { width: 390, height: 844 },
  });

  try {
    const guestPage = await guestContext.newPage();
    await installGuestProviderFakes(guestPage);

    await guestPage.goto(sharePath!);
    await expect(guestPage.getByRole('heading', { name: title })).toBeVisible();
    await expectNoHorizontalOverflow(guestPage);

    await guestPage.getByLabel('Name (optional)').fill(guestName);
    await guestPage
      .getByLabel('Email (optional)')
      .fill(`critical-${unique}@example.com`);
    await guestPage.getByRole('button', { name: 'Start practice' }).click();

    await expect(guestPage).toHaveURL(/\/session\/[^/?]+$/);
    const sessionId = new URL(guestPage.url()).pathname.split('/').pop();
    expect(sessionId).toBeTruthy();

    await guestPage.getByRole('button', { name: 'Begin practice' }).click();
    await expect(guestPage).toHaveURL(
      new RegExp(`/session/${sessionId}\\?started=1$`),
    );
    await expectNoHorizontalOverflow(guestPage);

    for (let questionNumber = 1; questionNumber <= 5; questionNumber += 1) {
      await expect(
        guestPage.getByText(`Question ${questionNumber} of 5`, { exact: true }),
      ).toBeVisible();

      const record = guestPage.getByRole('button', { name: 'Record answer' });
      const stop = guestPage.getByRole('button', { name: 'Stop recording' });

      await expect(record).toBeEnabled({ timeout: 15_000 });
      await record.click();
      await expect(stop).toBeEnabled();
      await guestPage.waitForTimeout(350);
      await stop.click();

      if (questionNumber < 5) {
        await expect(guestPage.getByText(FEEDBACK_SUMMARY)).toBeVisible({
          timeout: 30_000,
        });
        await guestPage.getByRole('button', { name: 'Next question' }).click();
        await expectNoHorizontalOverflow(guestPage);
      }
    }

    // Final-question regression boundary: once Q5 is saved, completion must not
    // be blocked on the live feedback stream. The report path is responsible for
    // waiting for/persisting the complete evaluation as needed.
    await expect(
      guestPage.getByText('Question 5 of 5', { exact: true }),
    ).toBeVisible();
    const finish = guestPage.getByRole('button', { name: 'Finish practice' });
    await expect(finish).toBeEnabled({ timeout: 15_000 });
    await finish.click();

    await expect(guestPage).toHaveURL(
      new RegExp(`/session/${sessionId}/report/generating$`),
      { timeout: 30_000 },
    );
    await expect(guestPage).toHaveURL(
      new RegExp(`/session/${sessionId}/report$`),
      { timeout: 60_000 },
    );

    await expect(guestPage.getByText('Final report', { exact: true })).toBeVisible();
    await expect(guestPage.getByRole('heading', { name: title })).toBeVisible();
    await expect(guestPage.getByText('5 evaluated responses')).toBeVisible();
    await expect(guestPage.getByText('Overall score')).toBeVisible();
    await expect(guestPage.getByText('82', { exact: true }).first()).toBeVisible();
    await expect(guestPage.getByText('Rubric performance')).toBeVisible();
    await expect(guestPage.getByText('What went well')).toBeVisible();
    await expect(guestPage.getByText('Focus next')).toBeVisible();
    await expect(guestPage.getByText('Recommended next step')).toBeVisible();
    await expect(guestPage.getByText('Response review')).toBeVisible();
    await expectNoHorizontalOverflow(guestPage);
  } finally {
    await guestContext.close();
  }

  await page.goto(`/candidate/practices/${practiceId}/results`);
  await expect(page.getByText('Practice results', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  await expect(page.getByText(guestName, { exact: true })).toBeVisible();
  await expect(page.getByText('100%', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('82/100', { exact: true }).first()).toBeVisible();
});

async function expectNoHorizontalOverflow(page: Page) {
  await expect
    .poll(async () =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
    )
    .toBe(true);
}

async function createAndPublishFiveQuestionPractice(page: Page, title: string) {
  await page.goto('/candidate/practices/new');
  await page.getByText('Build manually', { exact: true }).click();

  await page.getByLabel('Title').fill(title);
  await page
    .getByLabel('Description')
    .fill('A deterministic five-question Practice used to protect the V2 critical path.');
  await page
    .getByLabel('Scenario')
    .fill('You are explaining how you solve problems, work with others, and learn from outcomes.');
  await page
    .getByLabel('Question')
    .fill('Tell me about a time you had to prioritize competing needs.');
  await page.getByLabel('Criterion name').fill('Answer quality');
  await page
    .getByLabel('What good looks like')
    .fill('Uses a specific example, clear reasoning, actions taken, and a concrete outcome.');
  await page.getByRole('button', { name: 'Create manual draft' }).click();

  await expect(page).toHaveURL(/\/candidate\/practices\/[^/?]+\?created=1$/);

  await page.locator('#question-0-prep').fill('0');
  await page.locator('#question-0-response').fill('15');

  const prompts = [
    'Tell me about a time you changed your approach after receiving new information.',
    'Describe a difficult stakeholder conversation and how you handled it.',
    'Give an example of a decision you made with incomplete information.',
    'Tell me about a mistake or setback and what you learned from it.',
  ];

  for (let offset = 0; offset < prompts.length; offset += 1) {
    await page.getByRole('button', { name: 'Add question' }).click();
    const index = offset + 1;
    await page.locator(`#question-${index}-prompt`).fill(prompts[offset]);
    await page.locator(`#question-${index}-prep`).fill('0');
    await page.locator(`#question-${index}-response`).fill('15');
  }

  await expect(page.getByText('Question 5', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Publish' }).click();
  await expect(page).toHaveURL(/\?published=1$/);
  await expect(
    page.getByText(/Published\. This version is now locked for future sessions/),
  ).toBeVisible();
}

async function installGuestProviderFakes(page: Page) {
  let transcriptionNumber = 0;

  await page.route('**/api/transcribe', async (route) => {
    transcriptionNumber += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        text: `E2E answer ${transcriptionNumber}: I used a specific situation, explained my actions and reasoning, and finished with a measurable outcome.`,
      }),
    });
  });

  await page.route('**/api/tts', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'audio/wav',
      body: createSilentWav(),
    });
  });
}

function createSilentWav(durationMs = 120): Buffer {
  const sampleRate = 8_000;
  const channels = 1;
  const bitsPerSample = 16;
  const sampleCount = Math.max(1, Math.floor((sampleRate * durationMs) / 1_000));
  const dataSize = sampleCount * channels * (bitsPerSample / 8);
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * (bitsPerSample / 8), 28);
  buffer.writeUInt16LE(channels * (bitsPerSample / 8), 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  return buffer;
}
