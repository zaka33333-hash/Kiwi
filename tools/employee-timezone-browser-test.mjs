#!/usr/bin/env node
// Render the actual employee planning asset and click the leave action at a
// store/device date split; no production account or financial writes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const ROOT = path.resolve(import.meta.dirname, '..');
const require = createRequire(import.meta.url);
let puppeteer;
try { puppeteer = require(require.resolve('puppeteer-core', { paths:[path.join(ROOT,'app'),ROOT] })); }
catch { console.log('○ skip: puppeteer-core unavailable'); process.exit(process.env.CI ? 1 : 0); }
const executablePath = process.env.KIWI_CHROMIUM_BIN
  || ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/usr/bin/google-chrome','/usr/bin/chromium'].find(fs.existsSync);
if (!executablePath) { console.log('○ skip: Chromium unavailable'); process.exit(process.env.CI ? 1 : 0); }
const server = http.createServer((req,res) => {
  if (req.url === '/employee-planning.js') {
    res.setHeader('Content-Type','text/javascript');
    res.end(process.env.EMPLOYEE_TIMEZONE_BASELINE === '1'
      ? execFileSync('git',['show','HEAD:assets/employee-planning.js'],{cwd:ROOT})
      : fs.readFileSync(path.join(ROOT,'assets/employee-planning.js')));
  } else {
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.end('<!doctype html><html lang="fr"><meta name="viewport" content="width=device-width,initial-scale=1"><style>:root{--surface:white;--surface-2:#f5f6f4;--ink:#14231b;--ink-2:#3b5345;--ink-3:#666;--line:#dce5df;--r-xl:16px;--r-md:8px;--rim:0 2px 12px #ddd;--shadow-2:0 20px 60px #0004;--tint:#e6f7ed;--forest-ink:#064329;--fill-strong:#064329;--on-strong:white}body{font:16px system-ui;margin:16px;background:#f5f6f4}#kg-sched-card{padding:18px;background:white;border-radius:14px}</style><div id="kg-sched-card">Mon planning</div></html>');
  }
});
await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
const browser = await puppeteer.launch({executablePath,headless:true,args:['--no-sandbox']});
try {
  const page = await browser.newPage();
  await page.setViewport({width:390,height:844});
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.evaluate(() => {
    const RealDate = Date;
    window.__now = Date.parse('2026-09-26T12:30:00Z');
    window.Date = class extends RealDate { constructor(...args){super(...(args.length?args:[window.__now]));} static now(){return window.__now;} };
    window.KiwiEmployeeLive = { refresh:async()=>({ store:{timezone:'Pacific/Auckland'}, schedule:{
      '2026-09-26':{start:'09:00',end:'17:00'}, '2026-09-27':{start:'09:00',end:'17:00'},
    }, planning:{requests:[],openShifts:[],swapRequests:[],notices:[]} }) };
  });
  await page.addScriptTag({url:'/employee-planning.js'});
  await page.evaluate(() => window.dispatchEvent(new Event('load')));
  await page.waitForSelector('#kep-card .kep-metric');
  assert.equal(await page.$eval('#kep-card .kep-metric b',el=>el.textContent),'1');
  await page.click('[data-kep="leave"]');
  assert.equal(await page.$eval('[name="startDate"]',el=>el.min),'2026-09-27');
  assert.equal(await page.$eval('[name="endDate"]',el=>el.min),'2026-09-27');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=390),true);
  await page.click('[data-kep-close]');
  await page.evaluate(() => { window.__now = Date.parse('2026-09-27T12:30:00Z'); window.dispatchEvent(new Event('focus')); });
  assert.equal(await page.$eval('#kep-card .kep-metric b',el=>el.textContent),'0', 'open page drops yesterday at store midnight');
  await page.click('[data-kep="leave"]');
  assert.equal(await page.$eval('[name="startDate"]',el=>el.min),'2026-09-28', 'date picker advances without reload');
  if (process.env.KIWI_TEST_SCREENSHOT) await page.screenshot({path:process.env.KIWI_TEST_SCREENSHOT,fullPage:true});
  console.log('employee timezone browser: 6 rendered assertions passed');
} finally { await browser.close(); await new Promise(resolve=>server.close(resolve)); }
