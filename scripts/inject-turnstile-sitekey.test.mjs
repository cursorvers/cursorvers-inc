// inject-turnstile-sitekey.mjs を子プロセスで動かし、標準入力・終了コード・出力を確かめる (deploy はしない)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const script = path.join(import.meta.dirname, 'inject-turnstile-sitekey.mjs');
const PLACEHOLDER = 'TURNSTILE_SITE_KEY_PLACEHOLDER';
const KEY = '0x4AAAAAAATestKey_ab-12';

function makeSiteDir(t, contactHtml) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'turnstile-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  if (contactHtml !== null) {
    fs.writeFileSync(
      path.join(dir, 'contact.html'),
      contactHtml ?? `<!doctype html><html><body>\n<div class="cf-turnstile" data-sitekey="${PLACEHOLDER}" data-action="contact_submit"></div>\n</body></html>\n`
    );
  }
  return dir;
}

function runScript(args, input) {
  return spawnSync(process.execPath, [script, ...args], { input, encoding: 'utf8' });
}

// 渡した鍵 (空白を除いた中身) が stdout / stderr に出ていないこと
function assertNoKeyLeak(res, key) {
  const core = key.trim();
  if (core.length < 4) return;
  assert.ok(!res.stdout.includes(core), 'stdout must not contain the key');
  assert.ok(!res.stderr.includes(core), 'stderr must not contain the key');
}

function assertFails(res, key, pattern) {
  assert.equal(res.status, 1, res.stdout + res.stderr);
  assert.match(res.stderr, /::error::/);
  if (pattern) assert.match(res.stderr, pattern);
  assertNoKeyLeak(res, key);
}

test('正しい鍵: 置換し、data-sitekey が鍵と一致し、commit と sha256 を出す', (t) => {
  const dir = makeSiteDir(t);
  const res = runScript(['--commit', 'abc1234', dir], KEY);
  assert.equal(res.status, 0, res.stderr);
  const html = fs.readFileSync(path.join(dir, 'contact.html'), 'utf8');
  assert.ok(html.includes(`data-sitekey="${KEY}"`));
  assert.ok(!html.includes(PLACEHOLDER));
  assert.match(res.stdout, /\(1 replaced, 1 live widget\(s\) verified\)/);
  assert.match(res.stdout, /^commit: abc1234$/m);
  assert.match(res.stdout, /^contact\.html sha256: [0-9a-f]{64}$/m);
  assert.match(res.stdout, /0 files \(1 files scanned\)/);
  assertNoKeyLeak(res, KEY);
});

test('空の鍵は止め、contact.html を変えない', (t) => {
  const dir = makeSiteDir(t);
  const before = fs.readFileSync(path.join(dir, 'contact.html'), 'utf8');
  assertFails(runScript([dir], ''), '', /empty/);
  assert.equal(fs.readFileSync(path.join(dir, 'contact.html'), 'utf8'), before);
});

test('空白だけの鍵は止める', (t) => {
  const dir = makeSiteDir(t);
  assertFails(runScript([dir], '   \n'), '   \n', /whitespace-only/);
  assertFails(runScript([dir], '\t'), '\t', /whitespace-only/);
});

test('前後に空白・改行がある鍵は止める', (t) => {
  const dir = makeSiteDir(t);
  assertFails(runScript([dir], ` ${KEY} `), KEY, /leading\/trailing whitespace/);
  assertFails(runScript([dir], `${KEY}\n`), KEY, /newline/);
});

test('属性に差し込める文字を含む鍵は止める', (t) => {
  const dir = makeSiteDir(t);
  const bad = 'abc" onload="x';
  assertFails(runScript([dir], bad), bad, /characters outside/);
  assert.ok(fs.readFileSync(path.join(dir, 'contact.html'), 'utf8').includes(PLACEHOLDER));
});

test('placeholder と同じ鍵は止める', (t) => {
  const dir = makeSiteDir(t);
  assertFails(runScript([dir], PLACEHOLDER), PLACEHOLDER, /equals the placeholder/);
});

test('contact.html が無ければ止める', (t) => {
  const dir = makeSiteDir(t, null);
  assertFails(runScript([dir], KEY), KEY, /ENOENT/);
});

test('contact.html に placeholder が無ければ止める', (t) => {
  const dir = makeSiteDir(t, '<div class="cf-turnstile" data-sitekey="existingkey_01"></div>\n');
  assertFails(runScript([dir], KEY), KEY, /placeholder not found/);
});

test('ほかのファイルに placeholder が残れば止め、そのファイルを名指しする', (t) => {
  const dir = makeSiteDir(t);
  fs.mkdirSync(path.join(dir, 'news'));
  fs.writeFileSync(path.join(dir, 'news', 'other.html'), `<p>${PLACEHOLDER}</p>`);
  assertFails(runScript([dir], KEY), KEY, /news\/other\.html/);
});

test('symlink の先のファイルに placeholder が残れば止める', (t) => {
  const dir = makeSiteDir(t);
  const outside = makeSiteDir(t, null);
  fs.writeFileSync(path.join(outside, 'target.html'), `<p>${PLACEHOLDER}</p>`);
  fs.symlinkSync(path.join(outside, 'target.html'), path.join(dir, 'linked.html'));
  assertFails(runScript([dir], KEY), KEY, /linked\.html/);
});

test('リンク先の無い symlink があれば止める', (t) => {
  const dir = makeSiteDir(t);
  fs.symlinkSync(path.join(dir, 'missing.html'), path.join(dir, 'dangling.html'));
  assertFails(runScript([dir], KEY), KEY, /ENOENT/);
});

test('鍵と違う data-sitekey が別にあれば止める', (t) => {
  const dir = makeSiteDir(
    t,
    `<div class="cf-turnstile" data-sitekey="${PLACEHOLDER}"></div>\n<div class="cf-turnstile" data-sitekey="differentkey_99"></div>\n`
  );
  assertFails(runScript([dir], KEY), KEY, /does not match/);
});

test('空の data-sitekey が別にあれば止める', (t) => {
  const dir = makeSiteDir(t, `<div class="cf-turnstile" data-sitekey="${PLACEHOLDER}"></div>\n<div data-sitekey=""></div>\n`);
  // widget でない要素の空の data-sitekey も、鍵と一致しないとして止まる
  assertFails(runScript([dir], KEY), KEY, /does not match/);
});

test('読めないファイルがあれば止める (検査の失敗を成功扱いしない)', { skip: process.getuid?.() === 0 }, (t) => {
  const dir = makeSiteDir(t);
  const f = path.join(dir, 'unreadable.txt');
  fs.writeFileSync(f, 'x');
  fs.chmodSync(f, 0o000);
  const res = runScript([dir], KEY);
  // 後片付けで消せるよう、判定の前に権限を戻す
  fs.chmodSync(f, 0o644);
  assertFails(res, KEY, /EACCES/);
});

test('siteDir の指定が無い・多すぎるときは止める', (t) => {
  const dir = makeSiteDir(t);
  assertFails(runScript([], KEY), KEY, /usage/);
  assertFails(runScript([dir, dir], KEY), KEY, /usage/);
});

test('実際の contact.html: placeholder がちょうど 1 つあり、置換と検証が通る', (t) => {
  const dir = makeSiteDir(t, null);
  fs.copyFileSync(path.join(import.meta.dirname, '..', 'contact.html'), path.join(dir, 'contact.html'));
  const res = runScript(['--commit', 'abc1234', dir], KEY);
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /\(1 replaced, 1 live widget\(s\) verified\)/);
  assertNoKeyLeak(res, KEY);
});

test('コメントの中にしか widget が無ければ止める', (t) => {
  const site = makeSiteDir(t, `<!doctype html><html><body><!-- <div class="cf-turnstile" data-sitekey="${PLACEHOLDER}"></div> --></body></html>`);
  const res = runScript([site], KEY);
  assertFails(res, KEY, /no live \.cf-turnstile widget/);
});

test('script の文字列の中にしか widget が無ければ止める', (t) => {
  const site = makeSiteDir(t, `<!doctype html><html><body><script>const s = '<div class="cf-turnstile" data-sitekey="${PLACEHOLDER}"></div>';</script></body></html>`);
  const res = runScript([site], KEY);
  assertFails(res, KEY, /no live/);
});

test('placeholder が文字として在るだけで widget が無ければ止める', (t) => {
  const site = makeSiteDir(t, `<!doctype html><html><body><p>${PLACEHOLDER}</p></body></html>`);
  const res = runScript([site], KEY);
  assertFails(res, KEY, /no live/);
});

test('本物の widget とコメントの widget があれば、本物の 1 つだけを数えて通す', (t) => {
  const site = makeSiteDir(t, `<!doctype html><html><body><div class="cf-turnstile" data-sitekey="${PLACEHOLDER}"></div><!-- <div class="cf-turnstile" data-sitekey="${PLACEHOLDER}"></div> --></body></html>`);
  const res = runScript([site], KEY);
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /1 live widget/);
});

test('フォルダの symlink があれば止める (走査できない対象を成功扱いしない)', (t) => {
  const site = makeSiteDir(t, `<!doctype html><html><body><div class="cf-turnstile" data-sitekey="${PLACEHOLDER}"></div></body></html>`);
  fs.mkdirSync(path.join(site, 'realdir'));
  fs.symlinkSync(path.join(site, 'realdir'), path.join(site, 'linkeddir'), 'dir');
  const res = runScript([site], KEY);
  assertFails(res, KEY, /symlinked directory not allowed/);
});

test('data-class は widget とみなさない', (t) => {
  const dir = makeSiteDir(t, `<div data-class="cf-turnstile" data-sitekey="${PLACEHOLDER}"></div>`);
  assertFails(runScript([dir], KEY), KEY, /no live/);
});

test('属性値中の class= は widget とみなさない', (t) => {
  const dir = makeSiteDir(t, `<div title='class="cf-turnstile"' data-sitekey="${PLACEHOLDER}"></div>`);
  assertFails(runScript([dir], KEY), KEY, /no live/);
});

test('template の中身は無視する', (t) => {
  const dir = makeSiteDir(t, `<template><div class="cf-turnstile" data-sitekey="${PLACEHOLDER}"></div></template>`);
  assertFails(runScript([dir], KEY), KEY, /no live/);
});

test('大文字属性名は parse5 が小文字化するので通る', (t) => {
  const dir = makeSiteDir(t, `<div CLASS="x cf-turnstile" data-sitekey="${PLACEHOLDER}"></div>`);
  const res = runScript([dir], KEY);
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /1 live widget/);
});
