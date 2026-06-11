(function () {
  'use strict';

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;
  if (!('IntersectionObserver' in window)) return;

  var selector = [
    'section > h2',
    'section .section-h2',
    'section .section-eyebrow',
    'section .section-sub',
    'section .content-card',
    'section .card-hover',
    'section .card-premium',
    'section .service-card',
    'section .news-card-v2',
    'section article'
  ].join(',');

  function armReveal() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll(selector));
    nodes.forEach(function (node) {
      if (node.closest('.hero-wrapper, .hero-section--video')) return;
      node.classList.add('reveal');
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });

    nodes.forEach(function (node) {
      var parent = node.parentElement;
      if (parent) {
        var peers = Array.prototype.filter.call(parent.children, function (child) {
          return child.classList && child.classList.contains('reveal');
        });
        var index = peers.indexOf(node);
        if (index > 0) node.style.setProperty('--reveal-delay', Math.min(index * 70, 420) + 'ms');
      }
      observer.observe(node);
    });

    function forceVisibleAfterLoad() {
      window.setTimeout(function () {
        Array.prototype.forEach.call(document.querySelectorAll('.reveal:not(.is-visible)'), function (node) {
          node.classList.add('is-visible');
        });
        observer.disconnect();
      }, 1500);
    }

    if (document.readyState === 'complete') {
      forceVisibleAfterLoad();
    } else {
      window.addEventListener('load', forceVisibleAfterLoad, { once: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', armReveal, { once: true });
  } else {
    armReveal();
  }
})();
