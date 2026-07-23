import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import * as parse5 from 'parse5';

const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.m4v', '.ogv'];
const EXCLUDED_DIRS = new Set(['.git', 'node_modules', '_site', 'dist']);
const POLICY_REF = '.claude/CLAUDE.md "メディア資産デプロイ — iOS Safari cache 落とし穴"';

const findings = [];

function isExternalUrl(value) {
  return /^https?:\/\//i.test(value);
}

function videoExtensionFromPathname(value) {
  const withoutHash = value.split('#')[0];
  const pathname = withoutHash.split('?')[0].toLowerCase();
  return VIDEO_EXTENSIONS.find((ext) => pathname.endsWith(ext));
}

function addFinding(rule, level, file, line, message) {
  findings.push({
    rule,
    level,
    file,
    line: line || 1,
    message: `Rule ${rule}: ${message} See ${POLICY_REF}.`,
  });
}

function walkFiles(dir, predicate, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDED_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, predicate, acc);
    } else if (entry.isFile() && predicate(fullPath)) {
      acc.push(fullPath);
    }
  }
  return acc;
}

function relativePath(filePath) {
  return path.relative(process.cwd(), filePath) || filePath;
}

function getAttr(node, name) {
  return node.attrs?.find((attr) => attr.name.toLowerCase() === name.toLowerCase())?.value;
}

function hasAttr(node, name) {
  return node.attrs?.some((attr) => attr.name.toLowerCase() === name.toLowerCase()) || false;
}

function getAttrLine(node, name) {
  return node.sourceCodeLocation?.attrs?.[name]?.startLine || node.sourceCodeLocation?.startLine || 1;
}

function visit(node, callback) {
  callback(node);
  for (const child of node.childNodes || []) {
    visit(child, callback);
  }
}

function lintHtmlSources() {
  const heroVideoFiles = new Set();
  const htmlFiles = walkFiles(process.cwd(), (file) => file.toLowerCase().endsWith('.html'));

  for (const file of htmlFiles) {
    const rel = relativePath(file);
    const html = readFileSync(file, 'utf8');
    const document = parse5.parse(html, { sourceCodeLocationInfo: true });

    visit(document, (node) => {
      if (node.nodeName === 'source') {
        const src = getAttr(node, 'src');
        if (!src || isExternalUrl(src)) return;

        if (videoExtensionFromPathname(src) && src.includes('?')) {
          addFinding(
            'R1',
            'error',
            rel,
            getAttrLine(node, 'src'),
            `Local video source "${src}" uses a query string. iOS Safari AVPlayer cache is path-keyed, so rename the file path instead, e.g. "git mv old.mp4 old_v2.mp4" and update <source src="old_v2.mp4">.`
          );
        }
      }

      if (node.nodeName === 'video') {
        lintVideoSourceOrder(node, rel);
        lintHeroVideoAutoplayContract(node, rel);
        const className = getAttr(node, 'class') || '';
        if (/\bhero-video\b/.test(className) || hasAttr(node, 'data-hero-video')) heroVideoFiles.add(rel);
      }
    });
  }
  return heroVideoFiles;
}

function lintHeroVideoAutoplayContract(videoNode, rel) {
  const className = getAttr(videoNode, 'class') || '';
  const isHeroVideo = /\bhero-video\b/.test(className) || hasAttr(videoNode, 'data-hero-video');
  if (!isHeroVideo) return;

  const requiredBooleanAttrs = ['autoplay', 'muted', 'loop', 'playsinline', 'webkit-playsinline'];
  for (const attr of requiredBooleanAttrs) {
    if (!hasAttr(videoNode, attr)) {
      addFinding(
        'R6',
        'error',
        rel,
        getAttrLine(videoNode, 'class'),
        `Hero background video is missing "${attr}". iPhone Safari background autoplay needs muted inline playback attributes on the element.`
      );
    }
  }

  for (const attr of ['data-src-mobile', 'data-src-desktop']) {
    if (!getAttr(videoNode, attr)) {
      addFinding(
        'R6',
        'error',
        rel,
        getAttrLine(videoNode, 'class'),
        `Hero background video is missing "${attr}". Set the video src directly from JavaScript instead of relying on <source media> selection in iPhone Safari.`
      );
    }
  }

  const sources = (videoNode.childNodes || []).filter((child) => child.nodeName === 'source');
  if (sources.length > 0) {
    addFinding(
      'R6',
      'error',
      rel,
      getAttrLine(sources[0], 'src'),
      'Hero background video should not use <source media> children; iPhone Safari has been observed to show the first frame without reliably playing. Use data-src-mobile/data-src-desktop and set video.src directly.'
    );
  }

  const preload = getAttr(videoNode, 'preload');
  if (preload !== 'auto') {
    addFinding(
      'R6',
      'error',
      rel,
      getAttrLine(videoNode, 'preload'),
      'Hero background video should use preload="auto" so iPhone Safari can begin fetching media as soon as the hero video element is parsed.'
    );
  }

  const initialSrc = getAttr(videoNode, 'src');
  const mobileSrc = getAttr(videoNode, 'data-src-mobile');
  if (!initialSrc || initialSrc !== mobileSrc) {
    addFinding(
      'R6',
      'error',
      rel,
      getAttrLine(videoNode, 'src'),
      'Hero background video should set src to the mobile asset in HTML so iPhone Safari starts fetching before JavaScript reaches DOMContentLoaded.'
    );
  }
}

function lintVideoSourceOrder(videoNode, rel) {
  const sources = (videoNode.childNodes || []).filter((child) => child.nodeName === 'source');
  const sourceMeta = sources.map((source) => ({
    node: source,
    media: getAttr(source, 'media') || '',
    src: getAttr(source, 'src') || '',
  }));

  for (let index = 0; index < sourceMeta.length; index += 1) {
    const current = sourceMeta[index];
    if (!/min-width/i.test(current.media)) continue;

    const laterMax = sourceMeta.slice(index + 1).find((candidate) => /max-width/i.test(candidate.media));
    if (laterMax) {
      addFinding(
        'R5',
        'error',
        rel,
        getAttrLine(current.node, 'media'),
        `Desktop/min-width source "${current.src || current.media}" appears before mobile/max-width source "${laterMax.src || laterMax.media}". Put mobile max-width <source> first, then desktop min-width.`
      );
    }
  }
}

function resolveDiffRange() {
  const envBase = process.env.PR_BASE_SHA;
  const envHead = process.env.PR_HEAD_SHA;
  if (envBase && envHead) return { base: envBase, head: envHead };

  const candidates = ['origin/main', 'main', 'origin/master', 'master'];
  for (const candidate of candidates) {
    try {
      const base = execFileSync('git', ['merge-base', 'HEAD', candidate], { encoding: 'utf8' }).trim();
      if (base) return { base, head: 'HEAD' };
    } catch {
      // Try the next candidate.
    }
  }

  return null;
}

function lintVideoModifyWithoutRename() {
  const range = resolveDiffRange();
  if (!range) {
    addFinding(
      'R2',
      'warning',
      'git',
      1,
      'Could not resolve PR_BASE_SHA/PR_HEAD_SHA or a local merge-base; skipped video modify-without-rename diff check.'
    );
    return;
  }

  let output = '';
  try {
    output = execFileSync('git', ['diff', '--name-status', `${range.base}...${range.head}`], { encoding: 'utf8' });
  } catch (error) {
    addFinding('R2', 'error', 'git', 1, `Failed to run git diff for ${range.base}...${range.head}: ${error.message}`);
    return;
  }

  for (const line of output.split('\n').filter(Boolean)) {
    const fields = line.split('\t');
    const status = fields[0];
    const file = fields.at(-1);
    if (status === 'M' && file && videoExtensionFromPathname(file)) {
      addFinding(
        'R2',
        'error',
        file,
        1,
        `Video file "${file}" was modified in place. iOS Safari may keep the old path-keyed media cache; rename instead, e.g. "git mv ${file} ${file.replace(/(\.[^.]+)$/i, '_v2$1')}" and update HTML references.`
      );
    }
  }
}

function lintServiceWorkerBypass() {
  const swPath = path.join(process.cwd(), 'sw.js');
  if (!existsSync(swPath)) return;

  const source = readFileSync(swPath, 'utf8');
  const hasVideoExtensionCheck = VIDEO_EXTENSIONS.some((ext) => source.toLowerCase().includes(ext));
  const hasFetchBypass = /fetch\s*\(\s*event\.request\s*\)/.test(source);

  if (!hasVideoExtensionCheck || !hasFetchBypass) {
    addFinding(
      'R3',
      'warning',
      'sw.js',
      1,
      'Service Worker should bypass cache for video paths with "event.respondWith(fetch(event.request))" near mp4/webm/mov/m4v/ogv handling.'
    );
  }
}

function lintHeroVideoAutoplayScript(heroVideoFiles) {
  if (!heroVideoFiles || heroVideoFiles.size === 0) return;

  for (const rel of heroVideoFiles) {
    const filePath = path.join(process.cwd(), rel);
    if (!existsSync(filePath)) continue;

    const source = readFileSync(filePath, 'utf8');
    const hasHeroTarget = /data-hero-video/.test(source);
    const hasMutedFixup = /defaultMuted\s*=\s*true/.test(source) && /muted\s*=\s*true/.test(source);
    const hasDirectSourceSelection = /matchMedia\s*\(\s*['"]\(max-width:\s*767px\)['"]\s*\)/.test(source)
      && /setAttribute\s*\(\s*['"]src['"]/.test(source);
    const hasPlayRetry = /\.play\s*\(\s*\)/.test(source) && /pageshow/.test(source) && /visibilitychange/.test(source) && /touchstart/.test(source);
    const hasMobilePreload = /<link\s+rel="preload"\s+as="video"\s+href="hero_v\d+_mobile\.mp4"[^>]*fetchpriority="high"/.test(source);
    const hasDesktopPreload = /<link\s+rel="preload"\s+as="video"\s+href="hero_v\d+_pc\.mp4"[^>]*fetchpriority="high"/.test(source);
    const earlyArmIndex = source.indexOf("performance.mark('hero-video-armed')");
    const followupIndex = source.indexOf('<!-- Hero Follow-up Section -->');
    const domContentLoadedIndex = source.indexOf("document.addEventListener('DOMContentLoaded'");
    const hasEarlyArm = earlyArmIndex > -1
      && followupIndex > -1
      && domContentLoadedIndex > -1
      && earlyArmIndex < followupIndex
      && earlyArmIndex < domContentLoadedIndex;

    if (!hasHeroTarget || !hasMutedFixup || !hasDirectSourceSelection || !hasPlayRetry || !hasMobilePreload || !hasDesktopPreload || !hasEarlyArm) {
      addFinding(
        'R7',
        'error',
        rel,
        1,
        'Hero background video needs high-priority preload links and an iOS Safari autoplay arming script immediately after the hero video element: fix muted/defaultMuted, set video.src directly, call play(), mark hero-video-armed before DOMContentLoaded, and retry on pageshow/visibilitychange/touchstart.'
      );
    }
  }
}

function lintHeroVideoAssets() {
  const indexPath = path.join(process.cwd(), 'index.html');
  if (!existsSync(indexPath)) return;

  const source = readFileSync(indexPath, 'utf8');
  const assetMatches = Array.from(source.matchAll(/data-src-(mobile|desktop)="([^"]+\.mp4)"/g));
  const assets = new Map(assetMatches.map((match) => [match[1], match[2]]));

  for (const required of ['mobile', 'desktop']) {
    const src = assets.get(required);
    if (!src) continue;

    const filePath = path.join(process.cwd(), src);
    if (!existsSync(filePath)) {
      addFinding('R8', 'error', src, 1, `Hero ${required} video asset "${src}" does not exist.`);
      continue;
    }

    lintHeroVideoFastStart(src, filePath);
    lintHeroVideoCodec(required, src, filePath);
  }
}

function lintHeroVideoFastStart(src, filePath) {
  const bytes = readFileSync(filePath);
  const moovOffset = bytes.indexOf(Buffer.from('moov'));
  const mdatOffset = bytes.indexOf(Buffer.from('mdat'));

  if (moovOffset < 0 || mdatOffset < 0 || moovOffset > mdatOffset) {
    addFinding(
      'R8',
      'error',
      src,
      1,
      `Hero video "${src}" is not faststart. Encode with "-movflags +faststart" so iPhone Safari can start playback without downloading the full file.`
    );
  }
}

function lintHeroVideoCodec(kind, src, filePath) {
  let probe;
  try {
    probe = JSON.parse(execFileSync('ffprobe', [
      '-v', 'error',
      '-show_entries', 'stream=index,codec_type,codec_name,profile,pix_fmt,width,height',
      '-of', 'json',
      filePath,
    ], { encoding: 'utf8' }));
  } catch (error) {
    addFinding('R8', 'warning', src, 1, `Could not inspect hero video codec with ffprobe: ${error.message}`);
    return;
  }

  const streams = Array.isArray(probe.streams) ? probe.streams : [];
  const videoStreams = streams.filter((stream) => stream.codec_type === 'video');
  const audioStreams = streams.filter((stream) => stream.codec_type === 'audio');
  const video = videoStreams[0];

  if (audioStreams.length > 0) {
    addFinding('R8', 'error', src, 1, `Hero video "${src}" has an audio track. iPhone Safari background autoplay is more reliable with video-only MP4.`);
  }

  if (videoStreams.length !== 1 || !video) {
    addFinding('R8', 'error', src, 1, `Hero video "${src}" must contain exactly one video stream.`);
    return;
  }

  if (video.codec_name !== 'h264' || !/baseline/i.test(video.profile || '') || video.pix_fmt !== 'yuv420p') {
    addFinding(
      'R8',
      'error',
      src,
      1,
      `Hero video "${src}" should be H.264 Constrained Baseline yuv420p for older iPhone Safari compatibility; found codec=${video.codec_name}, profile=${video.profile}, pix_fmt=${video.pix_fmt}.`
    );
  }

  const maxWidth = kind === 'mobile' ? 960 : 1280;
  if (Number(video.width) > maxWidth) {
    addFinding('R8', 'error', src, 1, `Hero ${kind} video "${src}" is ${video.width}px wide; keep it at or below ${maxWidth}px for iPhone Safari startup reliability.`);
  }
}

function lintCursorversCurlProbe() {
  const targetExtensions = new Set(['.sh', '.yml', '.mjs', '.js']);
  const files = walkFiles(process.cwd(), (file) => targetExtensions.has(path.extname(file).toLowerCase()));

  for (const file of files) {
    const rel = relativePath(file);
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, index) => {
      if (!/curl\b.*https:\/\/cursorvers\.com/i.test(line)) return;
      if (line.includes('# probe-after-deploy')) return;
      addFinding(
        'R4',
        'warning',
        rel,
        index + 1,
        'Found a curl probe against https://cursorvers.com. Avoid pre-deploy live URL probes that can poison CDN 404 cache, or mark an allowed post-deploy probe with "# probe-after-deploy".'
      );
    });
  }
}

function hasOverrideLabel() {
  try {
    const labels = JSON.parse(process.env.PR_LABELS || '[]');
    return Array.isArray(labels) && labels.some((label) => label?.name === 'media-asset-policy-ack');
  } catch {
    addFinding('Override', 'warning', 'PR_LABELS', 1, 'Could not parse PR_LABELS JSON; media-asset-policy-ack override was not applied.');
    return false;
  }
}

function emitFindings(override) {
  let errorCount = 0;
  let warningCount = 0;

  for (const finding of findings) {
    const annotationLevel = finding.level === 'error' && !override ? 'error' : 'warning';
    if (finding.level === 'error') errorCount += 1;
    if (finding.level === 'warning' || annotationLevel === 'warning') warningCount += 1;

    const output = `${annotationLevel === 'error' ? '::error' : '::warning'} file=${finding.file},line=${finding.line}::${finding.message}`;
    if (annotationLevel === 'error') {
      console.error(output);
    } else {
      console.warn(output);
    }
  }

  const status = errorCount === 0 ? 'PASS' : override ? 'PASS_WITH_OVERRIDE' : 'FAIL';
  console.log(`Media Asset Policy summary: ${status}; errors=${errorCount}; warnings=${warningCount}; override=${override ? 'media-asset-policy-ack' : 'none'}`);

  if (errorCount > 0 && !override) process.exitCode = 1;
}

const heroVideoFiles = lintHtmlSources();
lintVideoModifyWithoutRename();
lintServiceWorkerBypass();
lintHeroVideoAutoplayScript(heroVideoFiles);
lintHeroVideoAssets();
lintCursorversCurlProbe();
emitFindings(hasOverrideLabel());
