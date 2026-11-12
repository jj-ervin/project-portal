import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {copyFile, mkdir, mkdtemp, readFile, rm} from 'node:fs/promises';
import {dirname, join, relative, resolve, sep} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const scratch = join(projectRoot, '.scratch');

test('runtime packages install offline from this repository alone', async () => {
  assert.ok(process.env.npm_execpath, 'run this check through npm test');
  await mkdir(scratch, {recursive: true});
  const root = await mkdtemp(join(scratch, 'propro-package-'));
  try {
    const manifest = JSON.parse(await readFile(join(projectRoot, 'package.json'), 'utf8'));
    const lock = JSON.parse(await readFile(join(projectRoot, 'package-lock.json'), 'utf8'));
    for (const [name, spec] of Object.entries(manifest.dependencies)) {
      assert.match(spec, /^file:vendor\/[\w.-]+\.tgz$/, `${name} uses a checked-in archive`);
      assert.equal(lock.packages[''].dependencies[name], spec);
      const archive = spec.slice('file:'.length);
      await mkdir(dirname(join(root, archive)), {recursive: true});
      await copyFile(join(projectRoot, archive), join(root, archive));
    }
    await copyFile(join(projectRoot, 'package.json'), join(root, 'package.json'));
    await copyFile(join(projectRoot, 'package-lock.json'), join(root, 'package-lock.json'));
    execFileSync(process.execPath, [process.env.npm_execpath, 'ci', '--offline', '--omit=dev',
      '--ignore-scripts', '--no-audit', '--no-fund', '--cache', join(root, 'npm-cache')], {
      cwd: root,
      stdio: 'pipe',
      timeout: 120000,
    });
    const requireFromConsumer = createRequire(join(root, 'package.json'));
    const entryPoints = {
      '@cockpit/gui': '@cockpit/gui/workbench',
      '@governancecommons/observatory-core': '@governancecommons/observatory-core/src/discovery/newsroom.mjs',
    };
    for (const [name, entryPoint] of Object.entries(entryPoints)) {
      assert.ok(Object.hasOwn(manifest.dependencies, name));
      const resolved = requireFromConsumer.resolve(entryPoint);
      const installed = join(root, 'node_modules', ...name.split('/'));
      const within = relative(installed, resolved);
      assert.ok(within && within !== '..' && !within.startsWith('..' + sep) && !within.startsWith('..' + '/'),
        `${name} resolves inside the isolated install`);
    }
    assert.equal(typeof requireFromConsumer('@cockpit/gui/workbench'), 'function');
    assert.equal(typeof requireFromConsumer('@cockpit/gui/tabbed-explorer'), 'function');
    const newsroom = await import(pathToFileURL(requireFromConsumer.resolve(entryPoints['@governancecommons/observatory-core'])).href);
    assert.equal(typeof newsroom.NewsroomDiscovery, 'function');
  } finally {
    const within = relative(scratch, root);
    assert.ok(within && within !== '..' && !within.startsWith('..' + sep),
      'cleanup stays within repository .scratch');
    await rm(root, {recursive: true, force: true});
  }
});
