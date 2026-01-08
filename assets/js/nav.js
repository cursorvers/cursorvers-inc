/**
 * Mobile Navigation Menu
 * Cursorvers Inc. - Shared navigation component
 */
document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.querySelector('[data-mobile-menu-open]');
    const nav = document.querySelector('[data-desktop-nav]');

    if (!menuBtn || !nav) return;

    let mobileMenu = null;
    let lastFocusedElement = null;

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
                <a href="index.html" class="flex items-center gap-3">
                    <img src="Cursorvers_logo_navy.jpeg" onerror="this.style.display='none'" alt="Cursorvers" class="h-10 w-10 mix-blend-multiply">
                    <span class="text-xl font-bold tracking-widest font-en text-brand-black uppercase">Cursorvers</span>
                </a>
                <button type="button" class="text-black text-2xl" aria-label="メニューを閉じる" id="mobile-menu-close">
                    <svg width="1em" height="1em" fill="currentColor" aria-hidden="true"><use href="/assets/icons.svg#icon-xmark"></use></svg>
                </button>
            </div>
            <nav class="flex-1 flex flex-col items-center justify-center gap-8 text-lg font-medium text-gray-700 font-en" id="mobile-nav-links"></nav>
            <div class="px-6 pb-10 text-center">
                <a href="contact.html" class="inline-block text-xs font-bold border border-brand-black px-8 py-4 rounded-full hover:bg-brand-black hover:text-white transition text-brand-black uppercase tracking-wider font-en">Contact</a>
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
