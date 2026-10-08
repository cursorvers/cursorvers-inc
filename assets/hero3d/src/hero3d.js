import {
  ACESFilmicToneMapping,
  CatmullRomCurve3,
  MathUtils,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer
} from 'three';
import { makeMedCity } from './medcity.js';
import { makeMeter, sampleQuality } from './quality.js';

const LANDING_SECONDS = 4;
const FLIGHT_SECONDS = 60;
const QUALITY_SCALE = [1, 0.9, 0.8, 0.7, 0.6];
const SAMPLES_PER_SEGMENT = 256;
const HEADER_HEIGHT = 80;
const FRAME_MARGIN = 12;

/*
 * 前提:
 * - 同時に更新される medcity.js が { update, keyframes, segments } を返す。
 * - hold は減速に割り当てる秒数。true は 1.2 秒として扱う。
 * - 建物との離隔、代表構図に含めるヘリポート、背景・ライト・霧は
 *   medcity.js が担当する。離隔は制御点間の曲線も含めて確保する。
 *
 * このファイルは経路の時間配分、カメラの表示枠、描画制御を担当する。
 * モバイルでは指定された縦画角をヘッダー下の表示枠へ収める。
 */

function readKeyframes(world) {
  const source = world?.keyframes;

  if (
    typeof world?.update !== 'function' ||
    !Array.isArray(source) ||
    source.length < 8 ||
    source.length > 12
  ) {
    throw new Error('makeMedCity must provide update(t) and 8–12 keyframes.');
  }

  const readVector = value => {
    if (
      !Array.isArray(value) ||
      value.length !== 3 ||
      !value.every(Number.isFinite)
    ) {
      throw new Error('Each keyframe needs finite pos/look coordinates.');
    }
    return new Vector3().fromArray(value);
  };

  const frames = source.map(frame => {
    const pos = readVector(frame.pos);
    const look = readVector(frame.look);

    if (
      !Number.isFinite(frame.fov) ||
      frame.fov <= 0 ||
      frame.fov >= 150 ||
      pos.distanceToSquared(look) < 1e-8
    ) {
      throw new Error('Invalid keyframe camera.');
    }

    const hold = frame.hold === true
      ? 1.2
      : Number.isFinite(frame.hold)
        ? MathUtils.clamp(frame.hold, 0, 4)
        : 0;

    return {
      pos,
      look,
      fov: frame.fov,
      hold,
      still: frame.still === true
    };
  });

  if (frames.filter(frame => frame.still).length !== 4) {
    throw new Error('Exactly four keyframes must have still: true.');
  }

  return frames;
}

function makeState() {
  return {
    pos: new Vector3(),
    look: new Vector3(),
    fov: 40,
    pose: 0,
    flightT: 0
  };
}

function makeFlight(frames) {
  const count = frames.length;
  const divisions = count * SAMPLES_PER_SEGMENT;

  const positionCurve = new CatmullRomCurve3(
    frames.map(frame => frame.pos.clone()),
    true,
    'centripetal'
  );

  const lookCurve = new CatmullRomCurve3(
    frames.map(frame => frame.look.clone()),
    true,
    'centripetal'
  );

  positionCurve.arcLengthDivisions = divisions;
  positionCurve.updateArcLengths();

  const lengths = positionCurve.getLengths(divisions);
  const totalLength = lengths[divisions];

  if (!Number.isFinite(totalLength) || totalLength < 1e-6) {
    throw new Error('The camera path must have a nonzero length.');
  }

  const arc = Float64Array.from(lengths, length => length / totalLength);
  const frameArc = frames.map((_, index) => arc[index * SAMPLES_PER_SEGMENT]);

  const stillIndices = [];
  frames.forEach((frame, index) => {
    if (frame.still) stillIndices.push(index);
  });

  // 減速を除く区間の速度は一定。減速への配分は一周の最大 30%。
  const requestedHold = frames.reduce((sum, frame) => sum + frame.hold, 0);
  const holdScale = requestedHold > 18 ? 18 / requestedHold : 1;
  const cruiseSeconds = FLIGHT_SECONDS - requestedHold * holdScale;

  const holds = frames.map((frame, index) => {
    const here = frameArc[index];
    const previous = index === 0 ? frameArc[count - 1] - 1 : frameArc[index - 1];
    const next = index === count - 1 ? 1 : frameArc[index + 1];

    return {
      center: here,
      seconds: frame.hold * holdScale,
      radius: Math.max(
        1e-5,
        Math.min(0.025, (here - previous) * 0.35, (next - here) * 0.35)
      )
    };
  });

  function secondsPerArc(distance) {
    let density = cruiseSeconds;

    for (const hold of holds) {
      if (hold.seconds <= 0) continue;

      let delta = Math.abs(distance - hold.center);
      delta = Math.min(delta, 1 - delta);

      if (delta < hold.radius) {
        // 周期的な raised cosine。区間の両端で速度変化を滑らかにする。
        density += hold.seconds *
          (1 + Math.cos(Math.PI * delta / hold.radius)) /
          (2 * hold.radius);
      }
    }

    return density;
  }

  // 弧長に対する所要時間を積分し、時刻から曲線パラメータを逆引きする。
  const times = new Float64Array(divisions + 1);
  let previousDensity = secondsPerArc(0);

  for (let index = 1; index <= divisions; index++) {
    const density = secondsPerArc(arc[index]);
    times[index] = times[index - 1] +
      (arc[index] - arc[index - 1]) * (previousDensity + density) * 0.5;
    previousDensity = density;
  }

  const timeScale = FLIGHT_SECONDS / times[divisions];
  for (let index = 1; index <= divisions; index++) {
    times[index] *= timeScale;
  }

  // 各キーフレームに到達する飛行時刻 (60 秒を等分しない実測値)。
  const keyTimes = frames.map((_, index) => times[index * SAMPLES_PER_SEGMENT]);

  function nearestPose(distance) {
    let nearest = 0;
    let smallest = Infinity;

    stillIndices.forEach((frameIndex, pose) => {
      let delta = Math.abs(distance - frameArc[frameIndex]);
      delta = Math.min(delta, 1 - delta);

      if (delta < smallest) {
        smallest = delta;
        nearest = pose;
      }
    });

    return nearest;
  }

  function sample(seconds, state) {
    const wrapped = MathUtils.euclideanModulo(seconds, FLIGHT_SECONDS);
    let low = 0;
    let high = divisions;

    while (high - low > 1) {
      const middle = (low + high) >>> 1;
      if (times[middle] <= wrapped) low = middle;
      else high = middle;
    }

    const duration = times[high] - times[low];
    const fraction = duration > 0
      ? MathUtils.clamp((wrapped - times[low]) / duration, 0, 1)
      : 0;

    const parameter = (low + fraction) / divisions;
    const distance = MathUtils.lerp(arc[low], arc[high], fraction);
    const framePosition = parameter * count;
    const index = Math.min(count - 1, Math.floor(framePosition));
    const local = framePosition - index;
    const blend = local * local * (3 - 2 * local);

    positionCurve.getPoint(parameter, state.pos);

    // 視線にも同じパラメータを使い、各 keyframe の pos/look の対応を保つ。
    lookCurve.getPoint(parameter, state.look);

    state.fov = MathUtils.lerp(
      frames[index].fov,
      frames[(index + 1) % count].fov,
      blend
    );
    state.pose = nearestPose(distance);
    state.flightT = seconds;

    return state;
  }

  function pose(index, state) {
    const frameIndex = stillIndices[index];
    const frame = frames[frameIndex];

    state.pos.copy(frame.pos);
    state.look.copy(frame.look);
    state.fov = frame.fov;
    state.pose = index;
    state.flightT = times[frameIndex * SAMPLES_PER_SEGMENT];

    return state;
  }

  function key(index, state) {
    const frame = frames[index];

    state.pos.copy(frame.pos);
    state.look.copy(frame.look);
    state.fov = frame.fov;
    state.pose = nearestPose(frameArc[index]);
    state.flightT = keyTimes[index];

    return state;
  }

  return { sample, pose, key, keyTimes };
}

function boot() {
  const canvas = document.getElementById('heroFx');
  const hero = document.getElementById('main');
  const pauseBtn = document.getElementById('heroPause');
  if (!canvas || !hero || !pauseBtn) return;

  const root = document.documentElement;
  const params = new URLSearchParams(location.search);
  const coarseMq = matchMedia('(pointer: coarse)');
  const reduceMq = matchMedia('(prefers-reduced-motion: reduce)');

  const mobile = innerWidth < 768 || coarseMq.matches;
  const style = params.get('style') === 'wire' ? 'wire' : 'solid';
  const idsMode = params.get('ids') === '1';
  const stillParam = params.get('still') === '1';
  const debug = params.get('debug') === '1';

  const parsedPose = Number.parseInt(params.get('pose') || '0', 10);
  const poseIndex = MathUtils.clamp(
    Number.isFinite(parsedPose) ? parsedPose : 0,
    0,
    3
  );

  const parsedKey = Number.parseInt(params.get('key') || '', 10);
  const keyIndex = Number.isFinite(parsedKey) &&
    Number.isInteger(parsedKey) &&
    parsedKey >= 0 &&
    parsedKey <= 10
    ? parsedKey
    : null;

  const hasTime = params.has('t');
  const parsedTime = Number(params.get('t'));
  const requestedTime = Number.isFinite(parsedTime)
    ? Math.max(0, parsedTime)
    : 0;

  let reduced = reduceMq.matches;
  let renderer = null;
  let world = null;
  let camera = null;
  let observer = null;
  let debugEl = null;

  let lost = false;
  let ready = false;
  let looping = false;
  let rafId = 0;
  let resizeTimer = 0;
  let mode = 'still';
  let pageActive = true;

  let width = 1;
  let height = 1;
  let compact = mobile;
  let projectionDirty = true;
  let projectionFov = NaN;
  let appliedDpr = 0;

  let particleTime = 0;
  let last = null;
  let lastState = null;
  let pendingRender = false;

  const minimum = mobile ? 1 : 0;
  let quality = minimum;
  let meter = makeMeter(performance.now());
  const cleanups = [];

  let paused = false;
  try {
    paused = sessionStorage.getItem('hero3d-paused') === '1';
  } catch {
    // Storage が使えない場合も、このページ内では停止状態を保持する。
  }

  function listen(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    cleanups.push(() => target.removeEventListener(type, handler, options));
  }

  function intersectsViewport() {
    const rect = hero.getBoundingClientRect();
    return rect.bottom > 0 &&
      rect.right > 0 &&
      rect.top < innerHeight &&
      rect.left < innerWidth &&
      rect.width > 0 &&
      rect.height > 0;
  }

  let visible = intersectsViewport();

  function canRender() {
    return !lost &&
      pageActive &&
      visible &&
      document.visibilityState !== 'hidden';
  }

  function canAnimate() {
    return canRender() && mode === 'animated' && !paused;
  }

  function stopLoop() {
    looping = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
    last = null;
  }

  function disable() {
    if (lost) return;
    lost = true;
    stopLoop();
    clearTimeout(resizeTimer);
    observer?.disconnect();

    for (const cleanup of cleanups.splice(0)) cleanup();

    canvas.dataset.status = 'off';
    root.dataset.hero3d = 'off';
    pauseBtn.hidden = true;
    canvas.remove();
    debugEl?.remove();

    try {
      world?.dispose?.();
    } catch {
      // Context lost 後も DOM のフォールバック処理を完了する。
    }

    try {
      renderer?.dispose();
    } catch {
      // 失われた context の復元は試みない。
    }
  }

  canvas.dataset.status = 'loading';
  listen(canvas, 'webglcontextlost', disable);

  const scene = new Scene();
  let frames;
  let flight;

  try {
    renderer = new WebGLRenderer({
      canvas,
      antialias: !mobile,
      alpha: false,
      powerPreference: 'high-performance'
    });

    renderer.outputColorSpace = SRGBColorSpace;
    if (!idsMode) {
      renderer.toneMapping = ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
    } else {
      // 頂点色をそのまま出すため、識別色の撮影ではトーンマッピングを無効にする。
      renderer.toneMapping = 0;
      renderer.toneMappingExposure = 1;
    }

    world = makeMedCity(scene, { mobile, style, ids: idsMode });
    frames = readKeyframes(world);
    flight = makeFlight(frames);

    const minimumDistance = Math.min(
      ...frames.map(frame => frame.pos.distanceTo(frame.look))
    );
    const extent = Math.max(
      1,
      ...frames.flatMap(frame => [frame.pos.length(), frame.look.length()])
    );
    const fogFar = Number.isFinite(scene.fog?.far) ? scene.fog.far : 0;

    camera = new PerspectiveCamera(
      frames[0].fov,
      1,
      MathUtils.clamp(minimumDistance / 1000, 0.02, 0.5),
      Math.max(2000, extent * 6, fogFar + extent * 2)
    );
    camera.up.set(0, 1, 0);
  } catch (error) {
    if (debug) console.warn('hero3d:', error);
    disable();
    return;
  }

  if (lost) return;

  if (debug) {
    debugEl = document.createElement('div');
    debugEl.setAttribute('aria-hidden', 'true');
    debugEl.style.cssText =
      'position:fixed;right:8px;bottom:8px;pointer-events:none;' +
      'font:12px/1.4 system-ui,sans-serif;color:#222;' +
      'background:rgba(255,255,255,.9);padding:4px 6px;z-index:9999';
    document.body.appendChild(debugEl);
  }

  const animationState = makeState();
  const stillState = makeState();
  const first = frames[0];

  const landingStart = first.pos.clone()
    .sub(first.look)
    .multiplyScalar(1.65)
    .add(first.look);
  landingStart.y += first.pos.distanceTo(first.look) * 0.12;

  const lookTarget = new Vector3();
  const viewDirection = new Vector3();

  function updatePauseButton() {
    pauseBtn.setAttribute('aria-pressed', paused ? 'true' : 'false');
    pauseBtn.textContent = paused ? '動きを再開する' : '動きを止める';
    pauseBtn.dataset.state = paused ? 'paused' : 'playing';
  }

  function setPaused(next) {
    paused = next;
    try {
      sessionStorage.setItem('hero3d-paused', next ? '1' : '0');
    } catch {
      // Storage が使えなくても操作を継続する。
    }
    updatePauseButton();
  }

  updatePauseButton();

  function applyPixelRatio() {
    const cap = mobile || compact ? 1.5 : 2;
    const dpr = Math.min(devicePixelRatio || 1, cap) * QUALITY_SCALE[quality];

    if (Math.abs(dpr - appliedDpr) > 1e-6) {
      renderer.setPixelRatio(dpr);
      appliedDpr = dpr;
    }
  }

  let textTop = Infinity;

  function resize() {
    width = Math.max(1, innerWidth);
    height = Math.max(1, innerHeight);
    compact = width < 768 || coarseMq.matches;

    applyPixelRatio();

    const kicker = hero.querySelector('.hero-mono__kicker');
    if (kicker && kicker.getBoundingClientRect().height > 0) {
      textTop = kicker.getBoundingClientRect().top - hero.getBoundingClientRect().top;
    } else {
      textTop = Infinity;
    }

    renderer.setSize(width, height, false);
    projectionDirty = true;
    visible = intersectsViewport();
  }

  function updateProjection(fov) {
    if (!projectionDirty && Math.abs(fov - projectionFov) < 1e-7) return;

    camera.fov = fov;

    if (compact) {
      const top = HEADER_HEIGHT + FRAME_MARGIN;
      // 文字の上端 (kicker) より 24px 上で枠を止める。スマホでは 0.45 が先に効く
      const bottom = Math.max(top + 1, Math.min(height * 0.45, textTop - 24) - FRAME_MARGIN);
      const frameHeight = bottom - top;

      /*
       * keyframe の縦画角全体を [top, bottom] に写す。
       * canvas は全画面のまま、仮想表示枠をヘッダー下へ移す。
       * 枠の中心だけを移す方法と違い、画角上端もヘッダー下に収まる。
       */
      camera.setViewOffset(
        width,
        frameHeight,
        0,
        -top,
        width,
        height
      );
    } else {
      camera.setViewOffset(
        width,
        height,
        (0.5 - 0.66) * width,
        (0.5 - 0.52) * height,
        width,
        height
      );
    }

    projectionFov = fov;
    projectionDirty = false;
  }

  function applyCamera(state) {
    camera.position.copy(state.pos);
    camera.up.set(0, 1, 0);
    lookTarget.copy(state.look);
    viewDirection.subVectors(lookTarget, camera.position);

    const distance = viewDirection.length();

    if (distance < 1e-6) {
      lookTarget.copy(camera.position);
      lookTarget.z -= 1;
    } else {
      const horizontal = Math.hypot(viewDirection.x, viewDirection.z);
      const minimumHorizontal = distance * 0.005;

      // 真上・真下でも +Y の up と視線が平行にならないようにする。
      if (horizontal < minimumHorizontal) {
        if (horizontal > 1e-8) {
          const scale = minimumHorizontal / horizontal;
          viewDirection.x *= scale;
          viewDirection.z *= scale;
        } else {
          viewDirection.x = 0;
          viewDirection.z = -minimumHorizontal;
        }
        lookTarget.copy(camera.position).add(viewDirection);
      }
    }

    updateProjection(state.fov);
    camera.lookAt(lookTarget);
  }

  function stateAtCurrentTime() {
    if (particleTime >= LANDING_SECONDS) {
      return flight.sample(particleTime - LANDING_SECONDS, animationState);
    }

    flight.sample(0, animationState);
    const progress = MathUtils.clamp(particleTime / LANDING_SECONDS, 0, 1);
    const ease = 1 - Math.pow(1 - progress, 3);

    animationState.pos.lerpVectors(landingStart, first.pos, ease);
    animationState.look.copy(first.look);
    animationState.fov = MathUtils.lerp(
      Math.min(120, first.fov + 6),
      first.fov,
      ease
    );
    animationState.flightT = 0;

    return animationState;
  }

  function writeDataset(state) {
    const info = renderer.info.render;

    canvas.dataset.calls = String(info.calls);
    canvas.dataset.triangles = String(info.triangles);
    canvas.dataset.quality = String(quality);
    canvas.dataset.pose = String(state.pose);
    canvas.dataset.t = state.flightT.toFixed(2);
    canvas.dataset.key = keyIndex === null ? '' : String(keyIndex);
    canvas.dataset.segments = String(world?.segments ?? 0);
    canvas.dataset.keyTimes = flight.keyTimes
      .map(time => time.toFixed(2))
      .join(',');

    if (debugEl) {
      debugEl.textContent =
        `${style}${idsMode ? ' / ids' : ''} / calls ${info.calls}` +
        ` / tris ${info.triangles} / q ${quality} / pose ${state.pose}` +
        ` / t ${state.flightT.toFixed(2)}` +
        (keyIndex === null ? '' : ` / key ${keyIndex}`);
    }
  }

  function renderOnce(state) {
    lastState = state;
    pendingRender = true;
    if (!canRender()) return;

    try {
      applyCamera(state);
      world.update(particleTime);
      if (lost) return;

      renderer.render(scene, camera);
      if (lost) return;

      writeDataset(state);
      pendingRender = false;

      if (!ready) {
        ready = true;
        canvas.dataset.status = 'ready';
        root.dataset.hero3d = 'on';
        canvas.classList.add('is-ready');
      }
    } catch (error) {
      if (debug) console.warn('hero3d:', error);
      disable();
    }
  }

  function frame(now) {
    rafId = 0;
    if (!looping) return;
    rafId = requestAnimationFrame(frame);

    if (!canAnimate()) {
      stopLoop();
      return;
    }

    const elapsed = last === null ? 0 : Math.max(0, now - last);
    last = now;

    // 品質判定には実測値を渡し、シーン時刻だけ長い処理落ちを制限する。
    const result = sampleQuality(meter, now, elapsed, quality, minimum);

    if (result && result.next !== quality) {
      quality = result.next;
      applyPixelRatio();
    }

    particleTime += Math.min(elapsed, 100) / 1000;
    renderOnce(stateAtCurrentTime());
  }

  function startLoop() {
    if (!canAnimate()) return;

    if (!looping) {
      looping = true;
      last = null;
      meter = makeMeter(performance.now());
    }

    if (!rafId) rafId = requestAnimationFrame(frame);
  }

  function syncLoop() {
    if (canAnimate()) startLoop();
    else stopLoop();
  }

  function reconcileActivity() {
    if (lost) return;

    if (canRender() && pendingRender && lastState) {
      renderOnce(lastState);
    }

    syncLoop();
  }

  function enterStill() {
    if (lost) return;
    stopLoop();
    clearTimeout(resizeTimer);

    mode = 'still';
    pauseBtn.hidden = true;

    if (keyIndex !== null) {
      // key は pose より優先。11 視点すべてを静止で撮る。
      flight.key(keyIndex, stillState);
    } else if (stillParam && hasTime) {
      flight.sample(requestedTime, stillState);
    } else {
      flight.pose(poseIndex, stillState);
    }

    if (stillParam) {
      // t は着地後の飛行時刻。粒も動画の同じ瞬間に合わせる。
      particleTime = LANDING_SECONDS + stillState.flightT;
    }

    resize();
    renderOnce(stillState);
  }

  function enterAnimated() {
    if (lost) return;
    stopLoop();
    clearTimeout(resizeTimer);

    mode = 'animated';
    pauseBtn.hidden = false;
    updatePauseButton();

    resize();
    renderOnce(stateAtCurrentTime());
    syncLoop();
  }

  function applyMode() {
    if (lost) return;
    if (stillParam || reduced) enterStill();
    else enterAnimated();
  }

  function redrawAfterResize() {
    resizeTimer = 0;
    if (lost) return;

    resize();
    meter = makeMeter(performance.now());

    if (lastState) renderOnce(lastState);
    syncLoop();
  }

  function onResize() {
    if (lost) return;
    clearTimeout(resizeTimer);

    // 静止・停止中は resize 後の一枚をその場で描く。
    if (mode === 'still' || paused) {
      redrawAfterResize();
    } else {
      resizeTimer = setTimeout(redrawAfterResize, 120);
    }
  }

  listen(pauseBtn, 'click', () => {
    if (lost || mode !== 'animated') return;

    setPaused(!paused);
    syncLoop();

    if (lastState) renderOnce(lastState);
  });

  listen(reduceMq, 'change', event => {
    reduced = event.matches;
    if (reduced) enterStill();
    else applyMode();
  });

  listen(coarseMq, 'change', onResize);
  listen(window, 'resize', onResize, { passive: true });

  listen(document, 'visibilitychange', () => {
    visible = intersectsViewport();
    reconcileActivity();
  });

  listen(window, 'pagehide', () => {
    pageActive = false;
    stopLoop();
    clearTimeout(resizeTimer);
  });

  listen(window, 'pageshow', () => {
    if (lost) return;
    pageActive = true;
    redrawAfterResize();
  });

  if (typeof IntersectionObserver !== 'undefined') {
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.target === hero) {
          visible = entry.isIntersecting && entry.intersectionRatio > 0;
        }
      }
      reconcileActivity();
    }, { threshold: 0 });

    observer.observe(hero);
  } else {
    listen(window, 'scroll', () => {
      visible = intersectsViewport();
      reconcileActivity();
    }, { passive: true });
  }

  applyMode();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
