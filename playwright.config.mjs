import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  timeout: 90000,
  use: {baseURL: 'http://127.0.0.1:8000', browserName: 'chromium'},
  webServer: {command: 'npm start', url: 'http://127.0.0.1:8000', reuseExistingServer: false, timeout: 30000}
});
