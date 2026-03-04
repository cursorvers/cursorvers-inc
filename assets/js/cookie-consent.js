(function() {
  if (localStorage.getItem('cv-cookie-ok')) return;

  var bar = document.createElement('div');
  bar.id = 'cookie-bar';
  bar.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9999;background:#fff;border-top:1px solid rgba(0,0,0,0.08);padding:16px 24px;padding-bottom:calc(16px + env(safe-area-inset-bottom));display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap;font-size:14px;color:#424245;box-shadow:0 -2px 8px rgba(0,0,0,0.06);';

  var msg = document.createElement('span');
  msg.textContent = '当サイトではGoogle Analyticsを使用しています。詳しくは';

  var link = document.createElement('a');
  link.href = location.pathname.indexOf('/news/') !== -1 ? '../privacy.html' : 'privacy.html';
  link.textContent = 'プライバシーポリシー';
  link.style.cssText = 'color:#0071e3;text-decoration:underline';

  var suffix = document.createTextNode('をご覧ください。');

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
