const { chromium } = require('playwright');
const { exec } = require('child_process');

const NICKNAME = process.env.NICKNAME || 'はるぼ';
const HEADLESS = process.env.HEADLESS !== 'false';
const URL = 'https://app.xrift.net/instance/1f45bcb9-4e8c-46cc-809d-98c80edab917';

console.log(`Starting XRift bot: ${NICKNAME}`);
console.log(`URL: ${URL}`);

(async () => {
  exec('openclaw system event --text "はるぼ: XRiftボット起動開始！" --mode now');

  const browser = await chromium.launch({
    headless: HEADLESS,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-gl=swiftshader',
      '--enable-webgl',
      '--disable-dev-shm-usage',
      '--disable-extensions',
      '--window-size=640,480'
    ]
  });
  const context = await browser.newContext({ viewport: { width: 640, height: 480 } });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  // WebSocketフック（ぺらぼ先輩のコード適用）
  await page.addInitScript(() => {
    const origWS = window.WebSocket;
    window._xriftWs = null;
    window.WebSocket = function(...args) {
      const ws = new origWS(...args);
      console.log('Native WS connecting to:', args[0]);
      if (args[0].includes('api.xrift.net') || args[0].includes('wss://api.xrift.net')) {
        console.log('XRIFT WS detected!');
        window._xriftWs = ws;
        
        ws.addEventListener('message', (e) => {
          console.log('Native RX:', e.data.substring(0, 100));
        });
        
        ws.addEventListener('open', () => {
          console.log('Native WS opened');
        });
      }
      return ws;
    };
  });

  try {
    console.log('Navigating to page...');
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('Page loaded');

    exec('openclaw system event --text "はるぼ: 軽量ワールドアクセス中…" --mode now');

    // Step 1: ニックネーム入力
    console.log('Step 1: Nickname input');
    const nicknameInput = await page.waitForSelector('input[placeholder], input[type="text"]', { timeout: 30000 });
    await nicknameInput.click();
    await nicknameInput.type(NICKNAME);
    console.log('Nickname entered');

    // 「この名前で参加」
    await page.click('button:has-text("参加"), button:has-text("Submit")');
    console.log('First join button clicked');

    // 「入室する」
    console.log('Step 2: Wait for 「入室する」 button');
    await page.waitForFunction(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(btn => 
        btn.textContent?.includes('入室') || 
        btn.textContent?.includes('参加') ||
        btn.textContent?.includes('Enter')
      );
    }, { timeout: 10000 });
    await page.click('button');
    console.log('Second join button (入室) clicked');

    // 入室後25秒待機
    console.log('Step 3: Waiting 25s for world to initialize...');
    await page.waitForTimeout(25000);
    console.log('World initialized');

    // _xriftWs接続待機
    console.log('Step 4: Waiting for XRIFT WS via native hook...');
    const startTime = Date.now();
    let wsReady = false;
    
    while (!wsReady && Date.now() - startTime < 60000) {
      const ready = await page.evaluate(() => {
        return window._xriftWs && window._xriftWs.readyState === 1;
      });
      if (ready) {
        wsReady = true;
        break;
      }
      console.log('Waiting for native WS...', Date.now() - startTime, 'ms');
      await page.waitForTimeout(1000);
    }

    if (wsReady) {
      console.log(' Bot ready via native hook! 🎉');
      exec('openclaw system event --text "はるぼ: XRift参加完了！井戸端会議合流〜😊" --mode now');

      setInterval(async () => {
        try {
          await page.keyboard.press('ArrowUp');
          await page.waitForTimeout(200);
          await page.keyboard.press('ArrowDown');
        } catch (e) {}
      }, 60000);

      await new Promise(() => {});
    } else {
      console.error('Native WS timeout after 60s');
      const body = await page.evaluate(() => document.body.innerHTML);
      console.log('Page state:', body.substring(0, 300));
      throw new Error('Native WS timeout');
    }

  } catch (error) {
    console.error('Error:', error);
    exec('openclaw system event --text "はるぼ: XRift参加失敗😢" --mode now');
    await browser.close();
    process.exit(1);
  }
})();