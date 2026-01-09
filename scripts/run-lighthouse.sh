#!/bin/sh

CHROME_PATH=${CHROME_PATH:-"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"}
OUTPUT_DIR=${OUTPUT_DIR:-"$(pwd)/lighthouse-reports"}

mkdir -p "$OUTPUT_DIR"

URLS="https://cursorvers.com/ https://cursorvers.com/services.html https://cursorvers.com/consulting.html https://cursorvers.com/gov-lead.html https://cursorversweb.vercel.app/apply/advisor https://cursorversweb.vercel.app/apply/48h https://cursorversweb.vercel.app/selfcheck"

for url in $URLS; do
  slug=$(echo "$url" | sed 's#https://##; s#[^a-zA-Z0-9]#_#g')
  outfile="$OUTPUT_DIR/lh_${slug}.json"
  CHROME_PATH="$CHROME_PATH" npx lighthouse "$url" \
    --chrome-flags="--headless=new --disable-gpu --no-sandbox --disable-dev-shm-usage" \
    --only-categories=performance,accessibility,best-practices,seo \
    --output=json \
    --output-path="$outfile" \
    --quiet
  if [ -f "$outfile" ]; then
    node -e "const lhr=require('$outfile'); const c=lhr.categories; const scores=[c.performance.score,c.accessibility.score,c['best-practices'].score,c.seo.score].map(s=>Math.round(s*100)); console.log('${url}\t'+scores.join('\t'));"
  else
    echo "${url}\tFAILED"
  fi
  sleep 2
done
