import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const lintPath = path.join(import.meta.dirname, 'lint-media-asset-policy.mjs');

function runLintWithFiles(files) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lint-test-'));
  
  try {
    for (const [filename, content] of Object.entries(files)) {
      fs.writeFileSync(path.join(tmpDir, filename), content);
    }

    const result = spawnSync('node', [lintPath], {
      cwd: tmpDir,
      encoding: 'utf8',
    });

    return (result.stdout || '') + (result.stderr || '');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

test('R7 skipped when no hero video exists', () => {
  const output = runLintWithFiles({
    'index.html': '<!doctype html><html><body><canvas id="auroraFx"></canvas></body></html>'
  });
  assert.equal(output.includes('Rule R7'), false);
});

test('R7 fires when hero video exists but arming script is missing', () => {
  const output = runLintWithFiles({
    'index.html': '<!doctype html><html><body>\n<video class="hero-video" autoplay muted loop playsinline webkit-playsinline preload="auto" src="a.mp4" data-src-mobile="a.mp4" data-src-desktop="b.mp4"></video>\n</body></html>'
  });
  assert.equal(output.includes('Rule R7'), true);
});

test('R7 gate stays closed when data-hero-video appears only inside a comment', () => {
  const output = runLintWithFiles({
    'index.html': '<!doctype html><html><body>\n<canvas id="auroraFx"></canvas>\n<script>/* legacy data-hero-video-armed reference */</script>\n</body></html>'
  });
  assert.equal(output.includes('Rule R7'), false);
});

test('R7 reports the file that actually holds the hero video, not index.html', () => {
  const output = runLintWithFiles({
    'index.html': '<!doctype html><html><body><canvas id="auroraFx"></canvas></body></html>',
    'services.html': '<!doctype html><html><body>\n<video data-hero-video autoplay muted loop playsinline webkit-playsinline preload="auto" src="a.mp4" data-src-mobile="a.mp4" data-src-desktop="b.mp4"></video>\n</body></html>'
  });

  assert.equal(output.includes('Rule R7'), true);
  
  const r7Line = output.split('\n').find(line => line.includes('Rule R7'));
  assert.ok(r7Line, 'Expected a line containing Rule R7');
  assert.equal(r7Line.includes('file=services.html'), true);
  assert.equal(r7Line.includes('file=index.html'), false);
});
