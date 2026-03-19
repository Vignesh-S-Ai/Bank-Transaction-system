// ── Page Transitions ──────────────────────────────────────────
export const pageTransition = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.4, 0, 0.2, 1] } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } },
};

// ── Stagger Container ──────────────────────────────────────────
export const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.05 },
    },
};

// ── Card Slide Up  ──────────────────────────────────────────
export const cardSlideUp = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } },
    hover: { y: -4, transition: { duration: 0.2, ease: 'easeOut' } },
};

// ── Card Glow Hover ──────────────────────────────────────────
export const cardGlowHover = {
    rest: { boxShadow: '0 4px 24px rgba(0,0,0,0.3)' },
    hover: { boxShadow: '0 8px 40px rgba(99,179,237,0.18), 0 4px 24px rgba(0,0,0,0.3)', transition: { duration: 0.25 } },
};

// ── List Item Anim ──────────────────────────────────────────
export const listItemAnim = {
    hidden: { opacity: 0, x: -12 },
    show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 380, damping: 28 } },
};

// ── Fade Scale (modals, popovers) ──────────────────────────────────────────
export const fadeScale = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 340, damping: 26 } },
    exit: { opacity: 0, scale: 0.96, transition: { duration: 0.15 } },
};

// ── Slide In Right (sidebar panels) ──────────────────────────────────────────
export const slideInRight = {
    hidden: { opacity: 0, x: 30 },
    show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

// ── Number ticker (for balance updates) ──────────────────────────────────────────
export const numberPop = {
    initial: { scale: 1 },
    pop: { scale: [1, 1.08, 1], transition: { duration: 0.4, times: [0, 0.4, 1] } },
};

// ── Button press effect ──────────────────────────────────────────
export const btnTap = { scale: 0.96 };
export const btnHover = { scale: 1.02, transition: { duration: 0.15 } };
