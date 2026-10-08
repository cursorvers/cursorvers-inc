// Warm-up is discarded after startup, resume and every quality change.
export function makeMeter(now = 0) {
  return { after: now + 600, duration: 0, frames: 0, fastWindows: 0, cooldown: now + 4000 };
}

export function sampleQuality(meter, now, elapsed, level, minimum) {
  // Discard a frame that began during warm-up, even if compilation ended after it.
  if (elapsed <= 0 || now - elapsed < meter.after) return null;
  if (elapsed > 250) {
    meter.after = now + 600; meter.duration = 0; meter.frames = 0;
    meter.fastWindows = 0;
    return null;
  }
  meter.duration += elapsed; meter.frames++;
  if (meter.duration < 1000 || meter.frames < 12) return null;
  const average = meter.duration / meter.frames;
  meter.duration = 0; meter.frames = 0;
  let next = level;
  if (average > 25 && level < 4) { next++; meter.fastWindows = 0; }
  else if (average < 18.5 && level > minimum) {
    meter.fastWindows++;
    if (meter.fastWindows >= 3 && now >= meter.cooldown) { next--; meter.fastWindows = 0; }
  } else meter.fastWindows = 0;
  if (next !== level) { meter.after = now + 600; meter.cooldown = now + 6500; }
  return { average, next };
}
