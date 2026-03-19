import { useEffect, useRef } from 'react';

// ── Configuration ─────────────────────────────────────────────
const CONFIG = {
    PARTICLE_COUNT: 65,
    MAX_SPEED: 0.35,
    CONNECTION_DIST: 130,    // px — max distance to draw connection line
    MOUSE_REPEL_DIST: 110,   // px — radius where mouse pushes particles
    MOUSE_REPEL_FORCE: 0.55, // strength of repulsion
    MIN_RADIUS: 1.2,
    MAX_RADIUS: 2.8,
    COLORS: [
        'rgba(99,179,237,',   // blue
        'rgba(167,139,250,',  // purple
        'rgba(103,232,249,',  // cyan
        'rgba(52,211,153,',   // teal (rare)
    ],
    // Colour weight: blue 50%, purple 30%, cyan 15%, teal 5%
    COLOR_WEIGHTS: [0.50, 0.30, 0.15, 0.05],
};

// Weighted random colour picker
const pickColor = () => {
    const r = Math.random();
    let acc = 0;
    for (let i = 0; i < CONFIG.COLORS.length; i++) {
        acc += CONFIG.COLOR_WEIGHTS[i];
        if (r <= acc) return CONFIG.COLORS[i];
    }
    return CONFIG.COLORS[0];
};

// Ease-in-out for speed variation
const easeInOut = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

class Particle {
    constructor(w, h) {
        this.reset(w, h, true);
    }

    reset(w, h, initial = false) {
        this.x = Math.random() * w;
        this.y = initial ? Math.random() * h : (Math.random() > 0.5 ? -5 : h + 5);
        this.radius = CONFIG.MIN_RADIUS + Math.random() * (CONFIG.MAX_RADIUS - CONFIG.MIN_RADIUS);
        this.color = pickColor();

        // Random angle & speed
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.08 + Math.random() * CONFIG.MAX_SPEED;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        // Subtle oscillation
        this.phase = Math.random() * Math.PI * 2;
        this.phaseSpeed = 0.004 + Math.random() * 0.008;

        // Visual
        this.baseAlpha = 0.25 + Math.random() * 0.45;
        this.alpha = 0;      // fade in
        this.fadingIn = true;
        this.w = w;
        this.h = h;
    }

    update(mouse) {
        // Fade in on appear
        if (this.fadingIn) {
            this.alpha = Math.min(this.alpha + 0.008, this.baseAlpha);
            if (this.alpha >= this.baseAlpha) this.fadingIn = false;
        }

        // Oscillation wobble
        this.phase += this.phaseSpeed;
        const wobble = Math.sin(this.phase) * 0.12;

        // Mouse repulsion
        let repelX = 0, repelY = 0;
        if (mouse.x !== null) {
            const dx = this.x - mouse.x;
            const dy = this.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < CONFIG.MOUSE_REPEL_DIST && dist > 0) {
                const force = (1 - dist / CONFIG.MOUSE_REPEL_DIST) * CONFIG.MOUSE_REPEL_FORCE;
                repelX = (dx / dist) * force;
                repelY = (dy / dist) * force;
            }
        }

        this.x += this.vx + wobble + repelX;
        this.y += this.vy + repelY;

        // Wrap around edges (with buffer)
        const buf = this.radius + 5;
        if (this.x < -buf) this.x = this.w + buf;
        else if (this.x > this.w + buf) this.x = -buf;
        if (this.y < -buf) this.y = this.h + buf;
        else if (this.y > this.h + buf) this.y = -buf;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color + this.alpha + ')';
        ctx.fill();

        // Tiny glow halo
        const grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 4);
        grd.addColorStop(0, this.color + (this.alpha * 0.6) + ')');
        grd.addColorStop(1, this.color + '0)');
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 4, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
    }
}

// ── Component ─────────────────────────────────────────────────
const ParticleBackground = () => {
    const canvasRef = useRef(null);
    const stateRef = useRef({
        particles: [],
        mouse: { x: null, y: null },
        animId: null,
        w: 0,
        h: 0,
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const state = stateRef.current;

        // ── Resize handler ──
        const resize = () => {
            state.w = canvas.width = window.innerWidth;
            state.h = canvas.height = window.innerHeight;
            // Recreate particles on resize
            state.particles = Array.from(
                { length: CONFIG.PARTICLE_COUNT },
                () => new Particle(state.w, state.h)
            );
        };

        // ── Mouse tracking ──
        const onMouseMove = (e) => {
            state.mouse.x = e.clientX;
            state.mouse.y = e.clientY;
        };
        const onMouseLeave = () => {
            state.mouse.x = null;
            state.mouse.y = null;
        };

        // ── Draw connections ──
        const drawConnections = (particles) => {
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const a = particles[i];
                    const b = particles[j];
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < CONFIG.CONNECTION_DIST) {
                        // Opacity fades as particles get farther
                        const lineAlpha = (1 - dist / CONFIG.CONNECTION_DIST) * 0.18;
                        // Boost alpha if mouse is nearby
                        let boost = 1;
                        if (state.mouse.x !== null) {
                            const mDist = Math.sqrt(
                                (a.x - state.mouse.x) ** 2 + (a.y - state.mouse.y) ** 2
                            );
                            if (mDist < CONFIG.MOUSE_REPEL_DIST * 1.5) boost = 2.2;
                        }

                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.strokeStyle = `rgba(99,179,237,${lineAlpha * boost})`;
                        ctx.lineWidth = 0.6;
                        ctx.stroke();
                    }
                }
            }
        };

        // ── Animation loop ──
        const loop = () => {
            ctx.clearRect(0, 0, state.w, state.h);

            // Optional very subtle vignette darkness at edges
            const vignette = ctx.createRadialGradient(
                state.w / 2, state.h / 2, state.h * 0.2,
                state.w / 2, state.h / 2, state.w * 0.9
            );
            vignette.addColorStop(0, 'rgba(6,11,24,0)');
            vignette.addColorStop(1, 'rgba(6,11,24,0.35)');
            ctx.fillStyle = vignette;
            ctx.fillRect(0, 0, state.w, state.h);

            // Update + draw connections first (behind particles)
            for (const p of state.particles) p.update(state.mouse);
            drawConnections(state.particles);
            for (const p of state.particles) p.draw(ctx);

            state.animId = requestAnimationFrame(loop);
        };

        // ── Boot ──
        resize();
        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseleave', onMouseLeave);
        state.animId = requestAnimationFrame(loop);

        return () => {
            cancelAnimationFrame(state.animId);
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseleave', onMouseLeave);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 0,
                pointerEvents: 'none',
                display: 'block',
            }}
            aria-hidden="true"
        />
    );
};

export default ParticleBackground;
