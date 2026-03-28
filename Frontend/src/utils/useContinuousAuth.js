import { useEffect, useRef } from 'react';
import { sendTelemetry } from '../services/auth.service';

/**
 * Continuous Authentication Hook
 * Runs silently in the background capturing rolling biometrics
 * Sends data to backend every 15 seconds. If anomaly detected, forces logout.
 */
export const useContinuousAuth = (onAnomalyDetected) => {
    const trackingWindowRef = useRef({
        moves: 0,
        clickCount: 0,
        scrolls: 0,
        lastMousePos: { x: 0, y: 0 }
    });

    useEffect(() => {
        let isMounted = true;

        const handleMouseMove = (e) => {
            const current = trackingWindowRef.current;
            if (current.lastMousePos.x !== 0) {
                const dx = e.pageX - current.lastMousePos.x;
                const dy = e.pageY - current.lastMousePos.y;
                current.moves += Math.sqrt(dx * dx + dy * dy);
            }
            current.lastMousePos = { x: e.pageX, y: e.pageY };
        };

        const handleClick = () => {
            trackingWindowRef.current.clickCount += 1;
        };

        const handleScroll = (e) => {
            trackingWindowRef.current.scrolls += Math.abs(window.scrollY); // basic magnitude
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('click', handleClick);
        window.addEventListener('scroll', handleScroll);

        // Every 15 seconds, ping backend with the rolling telemetry
        const intervalId = setInterval(async () => {
            if (!isMounted) return;

            const current = trackingWindowRef.current;

            // Normalize exactly as per interval duration
            const durationMins = 15 / 60;
            const payload = {
                mouseVelocity: current.moves / durationMins,
                clickCadence: current.clickCount / durationMins,
                scrollVelocity: current.scrolls / durationMins
            };

            // Reset the rolling window
            trackingWindowRef.current = {
                moves: 0,
                clickCount: 0,
                scrolls: 0,
                lastMousePos: { x: 0, y: 0 }
            };

            // Don't send completely empty payloads if user is AFK
            if (payload.mouseVelocity === 0 && payload.clickCadence === 0) return;

            try {
                const res = await sendTelemetry(payload);
                if (res.force_logout) {
                    onAnomalyDetected(res.message);
                }
            } catch (err) {
                if (err.response?.status === 401 && err.response?.data?.force_logout) {
                    onAnomalyDetected(err.response.data.message);
                }
            }

        }, 15000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('click', handleClick);
            window.removeEventListener('scroll', handleScroll);
        };
    }, [onAnomalyDetected]);
};
