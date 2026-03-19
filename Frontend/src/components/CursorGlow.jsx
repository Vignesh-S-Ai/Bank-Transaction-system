import { useEffect } from 'react';

const GLOW_W = 120;
const GLOW_H = 120;

/**
 * CursorGlow — rendered as a raw DOM node appended directly to document.body.
 * This bypasses any CSS transform/filter ancestor that would break position:fixed,
 * including Framer Motion page-transition transforms on #root children.
 */
const CursorGlow = () => {
    useEffect(() => {
        // Create element outside the React tree entirely
        const el = document.createElement('div');
        el.setAttribute('aria-hidden', 'true');

        Object.assign(el.style, {
            position: 'fixed',
            top: '-1000px', // start hidden
            left: '-1000px',
            width: GLOW_W + 'px',
            height: GLOW_H + 'px',
            borderRadius: '50%',
            background: `radial-gradient(
                circle at center,
                rgba(99,179,237,0.20)  0%,
                rgba(99,179,237,0.09)  40%,
                rgba(167,139,250,0.04) 65%,
                transparent           85%
            )`,
            filter: 'blur(12px)',
            opacity: '0.9',
            pointerEvents: 'none',
            zIndex: '99999',
            willChange: 'left, top, transform',
            transform: 'translate(-50%, -50%)', // Centered around the left/top cord
            transition: 'opacity 0.2s ease, transform 0.2s ease',
        });

        document.body.appendChild(el);

        // Update exact screen coordinates (clientX / clientY are viewport relative)
        const onMove = (e) => {
            el.style.left = e.clientX + 'px';
            el.style.top = e.clientY + 'px';
        };

        // Gentle pulse on interactive elements
        const onEnter = () => {
            el.style.opacity = '1';
            el.style.transform = 'translate(-50%, -50%) scale(1.25)';
        };
        const onLeave = () => {
            el.style.opacity = '0.9';
            el.style.transform = 'translate(-50%, -50%) scale(1)';
        };

        const attachHover = () => {
            document.querySelectorAll('button, .card, .nav-link, .quick-action-btn, a').forEach(n => {
                n.addEventListener('mouseenter', onEnter);
                n.addEventListener('mouseleave', onLeave);
            });
        };

        attachHover();
        const obs = new MutationObserver(attachHover);
        obs.observe(document.body, { childList: true, subtree: true });

        window.addEventListener('mousemove', onMove, { passive: true });

        return () => {
            window.removeEventListener('mousemove', onMove);
            obs.disconnect();
            if (document.body.contains(el)) document.body.removeChild(el);
        };
    }, []);

    // Renders nothing into the React tree — element lives on document.body directly
    return null;
};

export default CursorGlow;
