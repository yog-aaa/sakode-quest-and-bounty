import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/yogaa/.gemini/antigravity/brain/6a390e28-38bb-40bf-8e57-8405125bb770';
const EDGE_PATH = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const USER_DATA_DIR = path.join(process.env.TEMP || 'C:/temp', 'edge_member_ss');

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function getWsUrl() {
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9222/json');
      const data = await res.json();
      if (data && data.length > 0 && data[0].webSocketDebuggerUrl) {
        return data[0].webSocketDebuggerUrl;
      }
    } catch (e) {
      // wait
    }
    await sleep(500);
  }
  throw new Error('Could not connect to Edge DevTools port 9222');
}

async function run() {
  console.log('Starting Edge headless...');
  const edgeProc = spawn(EDGE_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${USER_DATA_DIR}`,
    '--window-size=1280,850',
    '--disable-gpu',
    'http://localhost:3002/login',
  ], { detached: false, stdio: 'ignore' });

  try {
    const wsUrl = await getWsUrl();
    console.log('Connected to CDP at:', wsUrl);
    const ws = new WebSocket(wsUrl);

    let id = 1;
    const callbacks = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        callbacks.get(msg.id)(msg);
        callbacks.delete(msg.id);
      }
    };

    await new Promise((resolve) => {
      ws.onopen = resolve;
    });

    function send(method, params = {}) {
      return new Promise((resolve) => {
        const curId = id++;
        callbacks.set(curId, resolve);
        ws.send(JSON.stringify({ id: curId, method, params }));
      });
    }

    await send('Page.enable');
    await send('Runtime.enable');

    console.log('Waiting for login page to load...');
    await sleep(3000);

    // Fill form and submit
    console.log('Filling login form...');
    const loginScript = `
      (async () => {
        const emailInput = document.querySelector('input[type="email"]');
        const passInput = document.querySelector('input[type="password"]');
        if (!emailInput || !passInput) return 'inputs not found';
        
        emailInput.value = 'user@sakode.com';
        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
        emailInput.dispatchEvent(new Event('change', { bubbles: true }));
        
        passInput.value = 'user@sakode';
        passInput.dispatchEvent(new Event('input', { bubbles: true }));
        passInput.dispatchEvent(new Event('change', { bubbles: true }));
        
        const form = document.querySelector('form');
        if (form) {
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          return 'submitted';
        }
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.click();
          return 'clicked';
        }
        return 'no submit mechanism';
      })()
    `;

    const loginRes = await send('Runtime.evaluate', { expression: loginScript, awaitPromise: true });
    console.log('Login result:', loginRes.result?.value);

    // Wait for redirect to member dashboard
    console.log('Waiting for authentication and redirect...');
    await sleep(5000);

    // Take screenshot of member dashboard
    console.log('Capturing member dashboard...');
    const ss1 = await send('Page.captureScreenshot', { format: 'png' });
    if (ss1.result?.data) {
      fs.writeFileSync(path.join(ARTIFACT_DIR, 'member_dashboard_before.png'), Buffer.from(ss1.result.data, 'base64'));
      console.log('Saved member_dashboard_before.png');
    }

    // Navigate to tasks
    console.log('Navigating to /member/tasks...');
    await send('Page.navigate', { url: 'http://localhost:3002/member/tasks' });
    await sleep(4000);
    const ss2 = await send('Page.captureScreenshot', { format: 'png' });
    if (ss2.result?.data) {
      fs.writeFileSync(path.join(ARTIFACT_DIR, 'member_tasks_before.png'), Buffer.from(ss2.result.data, 'base64'));
      console.log('Saved member_tasks_before.png');
    }

    // Navigate to rewards
    console.log('Navigating to /member/rewards...');
    await send('Page.navigate', { url: 'http://localhost:3002/member/rewards' });
    await sleep(4000);
    const ss3 = await send('Page.captureScreenshot', { format: 'png' });
    if (ss3.result?.data) {
      fs.writeFileSync(path.join(ARTIFACT_DIR, 'member_rewards_before.png'), Buffer.from(ss3.result.data, 'base64'));
      console.log('Saved member_rewards_before.png');
    }

    // Navigate to notifications
    console.log('Navigating to /member/notifications...');
    await send('Page.navigate', { url: 'http://localhost:3002/member/notifications' });
    await sleep(4000);
    const ss4 = await send('Page.captureScreenshot', { format: 'png' });
    if (ss4.result?.data) {
      fs.writeFileSync(path.join(ARTIFACT_DIR, 'member_notifications_before.png'), Buffer.from(ss4.result.data, 'base64'));
      console.log('Saved member_notifications_before.png');
    }

    ws.close();
  } finally {
    try {
      edgeProc.kill();
    } catch (e) {
      // ignore
    }
  }
}

run().then(() => {
  console.log('Done!');
  process.exit(0);
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
