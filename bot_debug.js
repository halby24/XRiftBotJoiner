const { chromium } = require('playwright');
const { exec } = require('child_process');

const NICKNAME = process.env.NICKNAME || 'はるぼ';
const HEADLESS = process.env.HEADLESS !== 'false';
const URL = 'https://app.xrift.net/instance/75462ce2-7e1e-4d16-a696-6ee01a6e4eb6';

(async () => {
  console.log(`Starting XRift bot: ${NICKNAME}`);
  const browser = await chromium.launch({
    headless: HEADLESS,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-dev-shm-usage',
      '--single-process',
      '--disable-extensions',
      '--disable-plugins',
      '--window-size=640,480'
    ]
  });
  const context = await browser.newContext({ viewport: { width: 640, height: 480 } });
  const page = await context.newPage();

  // Page load debugging
  page.on('console', msg => console.log('PAGE console:', msg.text()));
  page.on('pageerror', error => console.log('PAGE error:', error));

  try {
    console.log('Loading page...');
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('Page loaded');

    // Debug: Check page content
    const body = await page.evaluate(() => document.body.innerHTML);
    console.log('Page body length:', body.length);
    console.log('Page contains input?', body.includes('input'));
    console.log('Page contains button?', body.includes('button'));
    console.log('Page contains canvas?', body.includes('canvas'));

    // VRMブロック
    await page.route('**/*.vrm', route => route.abort());
    console.log('VRM block enabled');

    // Nickname input
    console.log('Looking for input...');
    const input = await page.waitForSelector('input[type="text"]', { timeout: 30000 });
    console.log('Found input');
    await input.click();
    await input.type(NICKNAME);
    console.log('Nickname entered');

    // Join button
    console.log('Looking for button...');
    const button = await page.waitForSelector('button', { timeout: 10000 });
    console.log('Found button');
    await button.click();
    console.log('Joined');

    // World load - wait longer
    console.log('Waiting for world...');
    try {
      await page.waitForSelector('canvas', { timeout: 120000 });
      console.log('World loaded! Bot ready ✨');
    } catch (e) {
      console.log('Canvas not found, checking page structure...');
      const content = await page.evaluate(() => document.body.innerHTML);
      console.log('Current page state:', content.substring(0, 500));
    }

    exec('openclaw system event --text "はるぼ: XRift参加完了！井戸端会議待機中〜😊" --mode now', (err) => {
      if (err) console.warn('OpenClaw notify failed:', err.message);
    });

    // Anti-AFK
    setInterval(async () => {
      try {
        await page.keyboard.press('ArrowUp');
        await page.waitForTimeout(200);
        await page.keyboard.press('ArrowDown');
        console.log('Anti-AFK');
      } catch (e) { }
    }, 60000);

    // WSキャプチャ
    page.on('websocket', ws => {
      console.log('WebSocket connected!');
      ws.on('framereceived', frame => console.log('WS RX:', frame.payloadData.toString()));
      ws.on('framesent', frame => console.log('WS TX:', frame.payloadData.toString()));
    });

    // Keep alive
    console.log('Keeping bot alive...');
    await new Promise(() => {});

  } catch (error) {
    console.error('Error:', error);
    await browser.close();
    process.exit(1);
  }
})();