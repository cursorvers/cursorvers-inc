(function() {
  if (localStorage.getItem('cv-cookie-ok')) return;

  var bar = document.createElement('div');
  bar.id = 'cookie-bar';
  bar.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9999;background:#fff;border-top:1px solid rgba(0,0,0,0.08);padding:16px 24px;padding-bottom:calc(16px + env(safe-area-inset-bottom));display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap;font-size:14px;color:#424245;box-shadow:0 -2px 8px rgba(0,0,0,0.06);';

  var style = document.createElement('style');
  style.textContent = '@media (max-width: 767px) { #cookie-bar { left: 12px !important; right: 12px !important; bottom: 12px !important; border: 1px solid rgba(0,0,0,0.1) !important; border-radius: 12px !important; padding: 10px 10px 10px 12px !important; padding-bottom: calc(10px + env(safe-area-inset-bottom)) !important; align-items: flex-start !important; justify-content: space-between !important; gap: 10px !important; flex-wrap: nowrap !important; font-size: 12px !important; line-height: 1.5 !important; box-shadow: 0 12px 30px rgba(0,0,0,0.14) !important; } #cookie-bar span { flex: 1 1 auto !important; min-width: 0 !important; } #cookie-bar button { flex: 0 0 auto !important; min-width: 52px !important; min-height: 40px !important; padding: 8px 14px !important; border-radius: 8px !important; } }';
  document.head.appendChild(style);

  var msg = document.createElement('span');
  msg.textContent = 'アクセス解析を使用しています。';

  var link = document.createElement('a');
  link.href = location.pathname.indexOf('/news/') !== -1 ? '../privacy.html' : 'privacy.html';
  link.textContent = '詳細';
  link.style.cssText = 'color:#0071e3;text-decoration:underline';

  var suffix = document.createTextNode('');

  msg.appendChild(link);
  msg.appendChild(suffix);

  var btn = document.createElement('button');
  btn.textContent = 'OK';
  btn.style.cssText = 'background:#1d1d1f;color:#fff;border:none;padding:8px 24px;border-radius:980px;font-size:14px;font-weight:600;cursor:pointer;white-space:nowrap';
  btn.addEventListener('click', function() {
    localStorage.setItem('cv-cookie-ok', '1');
    bar.remove();
  });

  bar.appendChild(msg);
  bar.appendChild(btn);
  document.body.appendChild(bar);
})();
