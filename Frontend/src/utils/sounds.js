/**
 * useSoundFX — subtle Web Audio API sound effects for financial actions.
 * Falls back silently if AudioContext is unavailable.
 */
const ctx = (() => {
    try { return new (window.AudioContext || window.webkitAudioContext)(); }
    catch { return null; }
})();

const play = (type = 'success') => {
    if (!ctx) return;
    // Resume if suspended (browser policy)
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const t = ctx.currentTime;

    if (type === 'success') {
        // Ascending chime: C5 → E5 → G5
        const freqs = [523.25, 659.25, 783.99];
        freqs.forEach((f, i) => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.connect(g); g.connect(ctx.destination);
            o.type = 'sine';
            o.frequency.value = f;
            g.gain.setValueAtTime(0, t + i * 0.1);
            g.gain.linearRampToValueAtTime(0.12, t + i * 0.1 + 0.02);
            g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.35);
            o.start(t + i * 0.1);
            o.stop(t + i * 0.1 + 0.4);
        });
        return;
    }

    if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.linearRampToValueAtTime(120, t + 0.25);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.start(t); osc.stop(t + 0.3);
        return;
    }

    if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.06, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc.start(t); osc.stop(t + 0.1);
    }
};

export const useSoundFX = () => ({ success: () => play('success'), error: () => play('error'), click: () => play('click') });
export default useSoundFX;
