import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, rm} from 'node:fs/promises';
import {join} from 'node:path';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const {waitForFiles, startupMessage} = require('../desktop/startup.cjs');

test('portable startup waits for a delayed bundled module', async () => {
  await mkdir('.scratch', {recursive:true});
  const root = await mkdtemp('.scratch/propro-startup-');
  try {
    const pending = waitForFiles(root, ['server.mjs', 'chat-service.mjs'],
      {timeoutMs: 2000, intervalMs: 20, stableMs: 40});
    await mkdir(root, {recursive: true});
    await writeFile(join(root, 'server.mjs'), 'export {}');
    await new Promise(resolve => setTimeout(resolve, 80));
    await writeFile(join(root, 'chat-service.mjs'), 'export {}');
    await pending;
  } finally { await rm(root, {recursive: true, force: true}); }
});

test('portable startup names a module that never arrives', async () => {
  await mkdir('.scratch', {recursive:true});
  const root = await mkdtemp('.scratch/propro-startup-');
  try {
    await assert.rejects(
      waitForFiles(root, ['chat-service.mjs'], {timeoutMs: 60, intervalMs: 20, stableMs: 20}),
      /did not finish unpacking: chat-service\.mjs/
    );
  } finally { await rm(root, {recursive: true, force: true}); }
});

test('startup messages distinguish a busy port from missing files', () => {
  assert.match(startupMessage(new Error('EADDRINUSE'), 8765), /Port 8765 is already in use/);
  assert.match(startupMessage(new Error('ERR_MODULE_NOT_FOUND'), 8765), /files are incomplete/);
  assert.doesNotMatch(startupMessage(new Error('ERR_MODULE_NOT_FOUND'), 8765), /Port 8765/);
});
