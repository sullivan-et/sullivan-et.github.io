// toc.js – robust scroll spy using getBoundingClientRect()
(function() {
    document.addEventListener('DOMContentLoaded', function() {
        // Select all elements that have a data-toc attribute (any value)
        const tocElements = document.querySelectorAll('[data-toc]');
        if (tocElements.length === 0) return;

        // Generate stable IDs for elements that lack one
        tocElements.forEach((el, idx) => {
            if (!el.id) {
                let baseId = el.textContent.trim().toLowerCase()
                    .replace(/[^\w\u00C0-\u024F]+/g, '-')
                    .replace(/^-+|-+$/g, '');
                if (!baseId) baseId = `toc-section-${idx}`;
                let finalId = baseId;
                let counter = 1;
                while (document.getElementById(finalId)) {
                    finalId = `${baseId}-${counter++}`;
                }
                el.id = finalId;
            }
        });

        // Build the Table of Contents HTML
        const tocContainer = document.createElement('aside');
        tocContainer.className = 'toc-container';
        tocContainer.setAttribute('aria-label', 'Table of Contents');

        const tocTitle = document.createElement('div');
        tocTitle.className = 'toc-title';
        tocTitle.textContent = 'Contents';
        tocContainer.appendChild(tocTitle);

        const tocList = document.createElement('ul');
        tocList.className = 'toc-list';

        tocElements.forEach(el => {
            const li = document.createElement('li');
            const link = document.createElement('a');
            link.href = `#${el.id}`;
            // Use data-toc-title if provided, otherwise element's text
            let title = el.getAttribute('data-toc');
            if (!title) {
                title = el.textContent.trim();
                if (!title) return; // skip empty elements
                if (title.length > 60) title = title.substring(0, 57) + '...';
            }
            link.textContent = title;
            link.setAttribute('data-target', el.id);
            li.appendChild(link);
            tocList.appendChild(li);
        });

        tocContainer.appendChild(tocList);
        // Insert at the very top of body (above everything)
        document.body.insertBefore(tocContainer, document.body.firstChild);

        // ----- Scroll Spy using getBoundingClientRect() -----
        const tocLinks = document.querySelectorAll('.toc-list a');
        const sections = tocElements; // same order as ToC

        function getActiveSection() {
            const viewportTop = window.scrollY;
            const viewportBottom = viewportTop + window.innerHeight;
            let bestMatch = null;
            let bestDistance = Infinity;

            // First, try to find a section that is currently crossing the "active zone"
            // Active zone: from 100px below viewport top to 200px above viewport bottom
            const activeTop = viewportTop;
            const activeBottom = viewportBottom - 200;

            for (let i = 0; i < sections.length; i++) {
                const rect = sections[i].getBoundingClientRect();
                const sectionTop = rect.top + window.scrollY;
                const sectionBottom = rect.bottom + window.scrollY;

                // If the section overlaps the active zone, it's a candidate
                if (sectionBottom > activeTop && sectionTop < activeBottom) {
                    // Among overlapping sections, pick the one whose top is closest to activeTop
                    const distance = Math.abs(sectionTop - activeTop);
                    if (distance < bestDistance) {
                        bestDistance = distance;
                        bestMatch = sections[i];
                    }
                }
            }

            // Fallback: if no overlap, pick the section that is above the viewport and closest to the top
            if (!bestMatch) {
                for (let i = sections.length - 1; i >= 0; i--) {
                    const rect = sections[i].getBoundingClientRect();
                    if (rect.top <= 150) { // section top is near or above viewport top
                        bestMatch = sections[i];
                        break;
                    }
                }
            }

            return bestMatch ? bestMatch.id : null;
        }

        function updateActiveSection() {
            const activeId = getActiveSection();
            tocLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('data-target') === activeId) {
                    link.classList.add('active');
                    // Optional: auto-scroll the ToC container to keep active link visible
                    if (window.innerWidth >= 768) {
                        const container = document.querySelector('.toc-container');
                        if (container) {
                            const linkRect = link.getBoundingClientRect();
                            const containerRect = container.getBoundingClientRect();
                            if (linkRect.top < containerRect.top || linkRect.bottom > containerRect.bottom) {
                                link.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                            }
                        }
                    }
                }
            });
        }

        // ----- Dynamic top offset for fixed sidebar (desktop/tablet) -----
        function adjustTocPosition() {
            const toc = document.querySelector('.toc-container');
            if (window.innerWidth < 1024){
                toc.style.removeProperty('top');
                return;
            }
            if (!toc) return;
            const breadcrumb = document.querySelector('.breadcrumb-top');
            if (!breadcrumb) {
                toc.style.top = '1rem';
                return;
            }
            const breadcrumbRect = breadcrumb.getBoundingClientRect();
            const scrollY = window.scrollY;
            let newTop;
            if (scrollY === 0) {
                newTop = breadcrumbRect.bottom + 10;
            } else {
                newTop = Math.max(10, breadcrumbRect.bottom - scrollY);
                if (newTop < 10) newTop = 10;
            }
            toc.style.top = newTop + 'px';
        }

        // Initial calls
        updateActiveSection();
        adjustTocPosition();

        // Throttled event handlers
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    updateActiveSection();
                    adjustTocPosition();
                    ticking = false;
                });
                ticking = true;
            }
        });
        window.addEventListener('resize', () => {
            adjustTocPosition();
            updateActiveSection();
        });

        // Smooth scroll when clicking ToC links
        tocLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('data-target');
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    // Update after scroll starts
                    setTimeout(() => {
                        updateActiveSection();
                        adjustTocPosition();
                    }, 100);
                }
            });
        });
    });
})();