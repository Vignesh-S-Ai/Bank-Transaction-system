import { useEffect, useRef } from 'react';

/**
 * Custom Hook for tracking user behavior telemetry (typing speed, mouse velocity).
 * Optimized to prevent zero-value pollution and noisy events.
 */
export const useBehaviorTracker = () => {
    // We use refs to avoid triggering re-renders on every keystroke/mouse movement
    const sessionStartTime = useRef(Date.now());
    const firstKeystrokeTime = useRef(null);
    const keyCount = useRef(0);
    const mouseMovement = useRef(0);
    const lastMousePos = useRef({ x: 0, y: 0 });
    const isTracking = useRef(true);

    const resetTracking = () => {
        sessionStartTime.current = Date.now();
        firstKeystrokeTime.current = null;
        keyCount.current = 0;
        mouseMovement.current = 0;
        lastMousePos.current = { x: 0, y: 0 };
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isTracking.current) return;

            if (lastMousePos.current.x !== 0 && lastMousePos.current.y !== 0) {
                const dx = e.pageX - lastMousePos.current.x;
                const dy = e.pageY - lastMousePos.current.y;
                mouseMovement.current += Math.sqrt(dx * dx + dy * dy);
            }
            lastMousePos.current = { x: e.pageX, y: e.pageY };
        };

        const handleKeyPress = (e) => {
            if (!isTracking.current) return;

            // Ignore non-character keys like Shift, Control, etc.
            if (e?.key?.length === 1 || e?.key === 'Backspace') {
                if (!firstKeystrokeTime.current) {
                    firstKeystrokeTime.current = Date.now();
                }
                keyCount.current += 1;
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('keydown', handleKeyPress);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, []);

    const getBehavioralData = () => {
        const now = Date.now();

        // Calculate typing speed based ONLY on time spent typing, not total time on page
        let typingSpeed = 0;
        if (keyCount.current > 0 && firstKeystrokeTime.current) {
            // How long between first keypress and submission?
            let typingDurationMins = (now - firstKeystrokeTime.current) / 60000;
            // Cap minimum duration to avoid extreme spikes on very fast single keystrokes
            if (typingDurationMins < 0.01) typingDurationMins = 0.01;

            typingSpeed = keyCount.current / typingDurationMins;
        }

        // Mouse velocity over total session duration
        let sessionDurationMins = (now - sessionStartTime.current) / 60000;
        if (sessionDurationMins < 0.01) sessionDurationMins = 0.01;

        const mouseVelocity = mouseMovement.current / sessionDurationMins;

        return {
            typingSpeed: parseFloat(typingSpeed.toFixed(2)),
            mouseVelocity: parseFloat(mouseVelocity.toFixed(2)),
            sampleSize: keyCount.current // Useful for backend to determine confidence
        };
    };

    return { getBehavioralData, resetTracking };
};
