// Служебный скрипт: снимает скриншоты 3D-конструктора по пресетам.
// Требует запущенный dev-сервер на localhost:3000.
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const presets = process.argv.slice(2);

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: [
    '--no-sandbox',
    '--enable-unsafe-swiftshader',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--window-size=1500,950',
  ],
});

const page = await browser.newPage();
await page.setViewport({ width: 1500, height: 950, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 400)));

await page.goto('http://localhost:3000/constructor', { waitUntil: 'networkidle2', timeout: 90000 });
await new Promise((r) => setTimeout(r, 9000));

if (presets.length === 0) {
  await page.screenshot({ path: 'preview-default.png' });
} else {
  for (const name of presets) {
    const clicked = await page.evaluate((label) => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        (b.textContent ?? '').includes(label),
      );
      if (!btn) return false;
      btn.click();
      return true;
    }, name);
    await new Promise((r) => setTimeout(r, 6000));
    await page.screenshot({ path: `preview-${name}.png` });
    console.log('preset', name, 'clicked:', clicked);
  }
}

await browser.close();
