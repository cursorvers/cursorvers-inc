/**
 * Mobile Navigation Menu
 * Cursorvers Inc. - Shared navigation component
 */
document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.querySelector('[data-mobile-menu-open]');
    const nav = document.querySelector('[data-desktop-nav]');
    const header = document.querySelector('[data-mobile-menu-root]');
    const brandLink = document.querySelector('[data-mobile-brand]');

    if (header) {
        // Keep fixed header stable on iOS/Safari where backdrop-filter + fixed can flicker.
        header.style.top = '0';
        header.style.left = '0';
        header.style.right = '0';
        header.style.transform = 'translateZ(0)';
        header.style.webkitTransform = 'translateZ(0)';
        header.style.backfaceVisibility = 'hidden';
        header.style.webkitBackfaceVisibility = 'hidden';
    }

    if (!menuBtn || !nav) return;

    let mobileMenu = null;
    let lastFocusedElement = null;

    const brandHref = (brandLink && brandLink.getAttribute('href')) || 'index.html';
    const brandImg = brandLink ? brandLink.querySelector('img') : null;
    const brandSource = brandLink ? brandLink.querySelector('source[type="image/webp"]') : null;
    const brandImgSrc = (brandImg && brandImg.getAttribute('src')) || 'Cursorvers_logo_navy.jpeg';
    const brandImgAlt = (brandImg && brandImg.getAttribute('alt')) || 'Cursorvers Logo';
    const brandWebpSrc = brandSource ? brandSource.getAttribute('srcset') : '';
    const contactCta = document.querySelector('[data-mobile-contact]');
    const contactHref = (contactCta && contactCta.getAttribute('href')) || 'contact.html';

    const closeMenu = () => {
        if (mobileMenu) mobileMenu.style.display = 'none';
        document.body.style.overflow = '';
        menuBtn.setAttribute('aria-expanded', 'false');
        if (lastFocusedElement) {
            lastFocusedElement.focus();
            lastFocusedElement = null;
        }
    };

    const createMenu = () => {
        if (mobileMenu) return;

        mobileMenu = document.createElement('div');
        mobileMenu.id = 'mobile-menu';
        mobileMenu.className = 'fixed inset-0 z-[60] bg-white flex flex-col';
        mobileMenu.setAttribute('role', 'navigation');
        mobileMenu.setAttribute('aria-label', 'Mobile navigation');

        mobileMenu.innerHTML = `
            <div class="flex items-center justify-between h-24 px-6 border-b border-gray-200">
                <a href="${brandHref}" class="flex items-center gap-3">
                    <picture>
                        ${brandWebpSrc ? `<source srcset="${brandWebpSrc}" type="image/webp">` : ''}
                        <img src="${brandImgSrc}" onerror="this.style.display='none'" alt="${brandImgAlt}" class="h-10 w-10 mix-blend-multiply">
                    </picture>
                    <span class="text-xl font-bold tracking-widest font-en text-brand-black uppercase">Cursorvers</span>
                </a>
                <button type="button" class="text-black text-2xl leading-none font-light" aria-label="メニューを閉じる" id="mobile-menu-close">
                    ✕
                </button>
            </div>
            <nav class="flex-1 flex flex-col items-center justify-center gap-8 text-lg font-medium text-gray-700 font-en" id="mobile-nav-links"></nav>
            <div class="px-6 pb-10 text-center">
                <a href="${contactHref}" class="inline-block text-xs font-bold border border-brand-black px-8 py-4 rounded-full hover:bg-brand-black hover:text-white transition text-brand-black uppercase tracking-wider font-en">無料で相談する</a>
            </div>
        `;

        document.body.appendChild(mobileMenu);

        const navLinks = mobileMenu.querySelector('#mobile-nav-links');
        nav.querySelectorAll('a').forEach(link => {
            const a = document.createElement('a');
            a.href = link.href;
            a.textContent = link.textContent.trim();
            a.className = 'text-xl font-semibold text-brand-black hover:text-brand-blue transition py-2 text-center';
            if (link.target) a.target = link.target;
            a.addEventListener('click', closeMenu);
            navLinks.appendChild(a);
        });

        mobileMenu.querySelector('#mobile-menu-close').addEventListener('click', closeMenu);
    };

    const openMenu = () => {
        lastFocusedElement = document.activeElement;
        createMenu();
        mobileMenu.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        menuBtn.setAttribute('aria-expanded', 'true');
        // Focus close button for accessibility
        const closeBtn = mobileMenu.querySelector('#mobile-menu-close');
        if (closeBtn) closeBtn.focus();
    };

    menuBtn.addEventListener('click', openMenu);
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeMenu();
    });
});
