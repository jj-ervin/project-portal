import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  outputDir: '.scratch/playwright',
  timeout: 90000,
  use: {baseURL: `http://127.0.0.1:${process.env.PORT || 8000}`, browserName: 'chromium'},
  webServer: {command: 'npm start', env:{PROPRO_CHAT_STORE:'.scratch/browser-agent-sessions.json',PROPRO_BOOTDOG_STORE:'.scratch/browser-bootdog.json',PROPRO_RUN_STORE:'.scratch/browser-agent-runs.json',PROPRO_NEWSROOM_STORE:'.scratch/browser-newsroom.json'}, url: `http://127.0.0.1:${process.env.PORT || 8000}`, reuseExistingServer: false, timeout: 30000}
});
