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

  try {
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    console.log('Page loaded');

    // VRMブロック
    await page.route('**/*.vrm', route => route.abort());
    console.log('VRM block enabled');

    // Nickname input (XPath対策)
    await page.waitForSelector('input[type="text"]', { timeout: 30000 });
    await page.click('input[type="text"]');
    await page.type('input[type="text"]', NICKNAME);
    console.log('Nickname entered');

    // Join button (シンプル化)
    await page.waitForSelector('button', { timeout: 10000 });
    await page.click('button');
    console.log('Joined');

    // World load
    await page.waitForSelector('canvas', { timeout: 60000 });
    console.log('World loaded! Bot ready ✨');

    exec('openclaw system event --text "はるぼ: XRift参加完了！井戸端会議待機中〜😊" --mode now', (err) => {
      if (err) console.warn('OpenClaw notify failed:', err.message);
    });

    // Anti-AFK (キーボード版)
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

  } catch (error) {
    console.error('Error:', error);
  }
})();