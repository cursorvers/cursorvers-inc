// Cloudflare Turnstile の公開鍵を _site/contact.html に入れ、入ったことを確かめる (deploy の build で使う)
// 使い方: printf '%s' "$SITE_KEY" | node scripts/inject-turnstile-sitekey.mjs [--commit <sha>] <siteDir>
// 鍵は標準入力から読み、値・一部・長さのいずれも出力しない。疑わしいときは exit 1 で deploy を止める
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';

const PLACEHOLDER = 'TURNSTILE_SITE_KEY_PLACEHOLDER';
// Turnstile の site key は英数字と _ - だけ。属性への差し込みも防ぐ
const KEY_RE = /^[0-9A-Za-z_-]+$/;

// data-sitekey="..." / data-sitekey='...' の値を集める
function extractSitekeys(html) {
  const values = [];
  const re = /data-sitekey\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    values.push(m[1] !== undefined ? m[1] : m[2]);
  }
  return values;
}

function countOccurrences(haystack, needle) {
  let n = 0;
  let i = 0;
  while ((i = haystack.indexOf(needle, i)) !== -1) {
    n++;
    i += needle.length;
  }
  return n;
}

// 再帰で全ファイルを集める。symlink はディレクトリなら追わず、ファイルなら中身を検査する
function walkFiles(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isSymbolicLink()) {
      // リンク先が無いときは statSync が投げ、検査失敗として止まる
      if (fs.statSync(full).isFile()) out.push(full);
      continue;
    }
    if (e.isDirectory()) {
      out.push(...walkFiles(full));
    } else if (e.isFile()) {
      out.push(full);
    }
  }
  return out;
}

export function run({ siteDir, key, commit }) {
  if (typeof siteDir !== 'string' || siteDir === '') {
    return { ok: false, error: 'usage: node inject-turnstile-sitekey.mjs [--commit <sha>] <siteDir>' };
  }

  // 鍵の検証 (値は出力しない)
  if (typeof key !== 'string' || key.length === 0) return { ok: false, error: 'sitekey is empty (repo variable TURNSTILE_SITE_KEY)' };
  if (key.trim().length === 0) return { ok: false, error: 'sitekey is whitespace-only' };
  if (/[\r\n]/.test(key)) return { ok: false, error: 'sitekey contains a newline' };
  if (/^\s|\s$/.test(key)) return { ok: false, error: 'sitekey has leading/trailing whitespace' };
  if (key === PLACEHOLDER) return { ok: false, error: 'sitekey equals the placeholder' };
  if (!KEY_RE.test(key)) return { ok: false, error: 'sitekey has characters outside [0-9A-Za-z_-]' };

  const contactPath = path.join(siteDir, 'contact.html');
  const before = fs.readFileSync(contactPath, 'utf8');
  const replaced = countOccurrences(before, PLACEHOLDER);
  if (replaced === 0) {
    return { ok: false, error: 'placeholder not found in contact.html; the page may have changed' };
  }

  // 置換して書き戻し、ディスクから読み直して確かめる
  fs.writeFileSync(contactPath, before.replaceAll(PLACEHOLDER, key), 'utf8');
  const after = fs.readFileSync(contactPath, 'utf8');

  const sitekeys = extractSitekeys(after);
  if (sitekeys.length === 0) {
    return { ok: false, error: 'no data-sitekey attribute found in contact.html' };
  }
  for (const v of sitekeys) {
    if (v.length === 0) return { ok: false, error: 'empty data-sitekey value found in contact.html' };
    if (v === PLACEHOLDER) return { ok: false, error: 'placeholder remains in a data-sitekey attribute' };
    if (v !== key) return { ok: false, error: 'a data-sitekey value in contact.html does not match the injected sitekey' };
  }
  if (after.includes(PLACEHOLDER)) {
    return { ok: false, error: 'placeholder still remains in contact.html' };
  }

  // _site 全体に placeholder が残っていないか。読めないファイルがあれば例外で止まる
  const needle = Buffer.from(PLACEHOLDER, 'utf8');
  const offenders = [];
  let scanned = 0;
  for (const file of walkFiles(siteDir)) {
    scanned++;
    if (fs.readFileSync(file).includes(needle)) offenders.push(path.relative(siteDir, file));
  }
  if (offenders.length > 0) {
    return { ok: false, error: 'placeholder remains in: ' + offenders.join(', ') };
  }

  const sha = crypto.createHash('sha256').update(fs.readFileSync(contactPath)).digest('hex');
  return {
    ok: true,
    lines: [
      `turnstile sitekey injected: contact.html (${replaced} replaced, ${sitekeys.length} data-sitekey verified)`,
      `commit: ${commit || 'unknown'}`,
      `contact.html sha256: ${sha}`,
      `placeholder remaining in ${siteDir}: 0 files (${scanned} files scanned)`,
    ],
  };
}

function main() {
  const argv = process.argv.slice(2);
  let commit;
  const commitIdx = argv.indexOf('--commit');
  if (commitIdx !== -1) {
    commit = argv[commitIdx + 1];
    argv.splice(commitIdx, 2);
  }
  if (argv.length !== 1) {
    process.stderr.write('::error::usage: node inject-turnstile-sitekey.mjs [--commit <sha>] <siteDir>\n');
    process.exit(1);
  }

  let result;
  try {
    const key = fs.readFileSync(0, 'utf8');
    result = run({ siteDir: argv[0], key, commit });
  } catch (err) {
    // 想定外の失敗も必ず止める。fs のエラーは code と path だけを出す (鍵は path に入らない)
    const where = err && err.path ? ` (${err.path})` : '';
    process.stderr.write(`::error::turnstile sitekey check failed: ${(err && err.code) || 'error'}${where}\n`);
    process.exit(1);
  }

  if (!result.ok) {
    process.stderr.write(`::error::${result.error}\n`);
    process.exit(1);
  }
  for (const line of result.lines) process.stdout.write(line + '\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
