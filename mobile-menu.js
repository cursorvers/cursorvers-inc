(() => {
    const initMobileMenu = () => {
        const header = document.querySelector('[data-mobile-menu-root]');
        if (!header) return;

        const openTrigger = header.querySelector('[data-mobile-menu-open]');
        const nav = header.querySelector('[data-desktop-nav]');
        if (!openTrigger || !nav) return;

        const theme = header.dataset.mobileMenuTheme || 'light';
        const brand = header.querySelector('[data-mobile-brand]');
        const contact = header.querySelector('[data-mobile-contact]');

        const overlayTone = theme === 'dark' ? 'bg-black/70' : 'bg-black/30';
        const borderTone = theme === 'dark' ? 'border-white/10' : 'border-gray-200';
        const panelTone = theme === 'dark'
            ? 'bg-[#050505]/95 text-white'
            : 'bg-white/95 text-brand-black';
        const closeTone = theme === 'dark' ? 'text-white' : 'text-brand-black';

        const mobileMenu = document.createElement('div');
        mobileMenu.id = 'mobile-menu';
        mobileMenu.setAttribute('aria-hidden', 'true');
        mobileMenu.className = 'fixed inset-0 z-[60] hidden';
        mobileMenu.innerHTML = `
            <div class="absolute inset-0 ${overlayTone}" data-menu-overlay="true"></div>
            <div class="relative z-10 h-full w-full ${panelTone} backdrop-blur-2xl flex flex-col">
                <div class="flex items-center justify-between h-24 px-6 border-b ${borderTone}">
                    ${brand ? brand.outerHTML : ''}
                    <button type="button" class="${closeTone} text-2xl" aria-label="メニューを閉じる" data-mobile-menu-close>
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="flex-1 overflow-y-auto">
                    <nav class="flex flex-col items-center gap-6 py-12 px-6 text-lg font-en" data-mobile-menu-links></nav>
                </div>
                <div class="px-6 pb-10">
                    ${contact ? contact.cloneNode(true).outerHTML : ''}
                </div>
            </div>
        `;

        document.body.appendChild(mobileMenu);

        const closeTrigger = mobileMenu.querySelector('[data-mobile-menu-close]');
        const overlay = mobileMenu.querySelector('[data-menu-overlay]');
        const linkContainer = mobileMenu.querySelector('[data-mobile-menu-links]');

        const focusableSelector = 'a[href], button:not([disabled])';
        const body = document.body;

        const setAria = (expanded) => {
            mobileMenu.setAttribute('aria-hidden', expanded ? 'false' : 'true');
            openTrigger.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        };

        const navLinks = nav.querySelectorAll('a');
        navLinks.forEach((link) => {
            const clone = link.cloneNode(true);
            clone.classList.add('w-full', 'text-center', 'text-lg', 'font-semibold', 'tracking-wide', 'py-2');
            if (theme === 'dark') {
                clone.classList.add('text-white', 'hover:text-white');
            } else {
                clone.classList.add('text-brand-black', 'hover:text-brand-blue');
            }
            clone.addEventListener('click', () => toggleMenu(false));
            linkContainer.appendChild(clone);
        });

        const toggleMenu = (shouldOpen) => {
            if (shouldOpen) {
                mobileMenu.classList.remove('hidden');
                body.classList.add('overflow-hidden');
                setAria(true);
                closeTrigger?.focus();
            } else {
                mobileMenu.classList.add('hidden');
                body.classList.remove('overflow-hidden');
                setAria(false);
                openTrigger.focus();
            }
        };

        const clonedContact = mobileMenu.querySelector('[data-mobile-contact]');
        clonedContact?.addEventListener('click', () => toggleMenu(false));

        openTrigger.addEventListener('click', () => toggleMenu(true));
        closeTrigger?.addEventListener('click', () => toggleMenu(false));
        overlay?.addEventListener('click', () => toggleMenu(false));

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && mobileMenu.getAttribute('aria-hidden') === 'false') {
                toggleMenu(false);
            }
        });

        mobileMenu.addEventListener('keydown', (event) => {
            if (event.key !== 'Tab') return;
            const focusable = mobileMenu.querySelectorAll(focusableSelector);
            if (focusable.length === 0) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                last.focus();
                event.preventDefault();
            } else if (!event.shiftKey && document.activeElement === last) {
                first.focus();
                event.preventDefault();
            }
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobileMenu);
    } else {
        initMobileMenu();
    }
})();

