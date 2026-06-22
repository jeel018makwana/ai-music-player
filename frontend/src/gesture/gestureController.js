import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

export const initGestureController = ({
    videoElement,
    songs,
    setCurrentIndex,
    setGesture,
    setVolume,
    onPlay,
    onPause,
    onNext,
    onPrev,
    onVolumeUp,
    onVolumeDown,
    mode
}) => {

    let isMounted = true;

    const lastGestureRef = { current: "" };
    const lastActionTimeRef = { current: 0 };

    const triggerGesture = (gestureName, action) => {
        const now = Date.now();

        // Prevent multiple triggers
        if (now - lastActionTimeRef.current < 1200) return;
        if (lastGestureRef.current === gestureName) return;

        lastGestureRef.current = gestureName;
        lastActionTimeRef.current = now;

        console.log("Gesture:", gestureName);

        setGesture(gestureName);
        action();

        setTimeout(() => {
            lastGestureRef.current = "";
        }, 1000);
    };

    const hands = new Hands({
        locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`
    });

    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7
    });

    hands.onResults((results) => {
        if (
            !results.multiHandLandmarks ||
            results.multiHandLandmarks.length === 0 ||
            !isMounted
        ) return;

        const landmarks = results.multiHandLandmarks[0];
        if (!landmarks || landmarks.length < 21) return;

        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];

        const isFingerUp = (tip, pip) =>
            landmarks[tip].y < landmarks[pip].y;

        const isFingerDown = (tip, pip) =>
            landmarks[tip].y > landmarks[pip].y;

        // ----------------- PLAY (Thumb Up) -----------------
        const isPlay =
            thumbTip.y < landmarks[3].y &&
            isFingerDown(8, 6) &&
            isFingerDown(12, 10);

        if (isPlay) {
            triggerGesture("Play", () => {
                if (mode === "spotify") {
                    fetch(
                        "https://ai-music-player-3zcp.onrender.com/spotify/play",
                        { method: "POST" }
                    );
                } else {
                    onPlay();
                }
            });
            return;
        }

        // ----------------- PAUSE (Fist) -----------------
        const isPause =
            isFingerDown(8, 6) &&
            isFingerDown(12, 10) &&
            isFingerDown(16, 14) &&
            isFingerDown(20, 18);

        if (isPause) {
            triggerGesture("Pause", () => {
                if (mode === "spotify") {
                    fetch(
                        "https://ai-music-player-3zcp.onrender.com/spotify/pause",
                        { method: "POST" }
                    );
                } else {
                    onPause();
                }
            });
            return;
        }

        // ----------------- NEXT (Only Index Finger) -----------------
        const isNext =
            isFingerUp(8, 6) &&
            isFingerDown(12, 10) &&
            isFingerDown(16, 14) &&
            isFingerDown(20, 18);

        if (isNext) {
            triggerGesture("Next", () => {
                if (mode === "spotify") {
                    onNext();
                } else {
                    setCurrentIndex((prev) =>
                        prev === songs.length - 1 ? 0 : prev + 1
                    );
                }
            });
            return;
        }

        // ----------------- PREVIOUS (Index + Middle Finger) -----------------
        const isPrevious =
            isFingerUp(8, 6) &&
            isFingerUp(12, 10) &&
            isFingerDown(16, 14) &&
            isFingerDown(20, 18);

        if (isPrevious) {
            triggerGesture("Previous", () => {
                if (mode === "spotify") {
                    onPrev();
                } else {
                    setCurrentIndex((prev) =>
                        prev === 0 ? songs.length - 1 : prev - 1
                    );
                }
            });
            return;
        }

        // ----------------- VOLUME DOWN (Pinch In) -----------------
        const pinchDistance = Math.hypot(
            thumbTip.x - indexTip.x,
            thumbTip.y - indexTip.y
        );

        if (pinchDistance < 0.05) {
            triggerGesture("Volume Down", () => {
                if (mode === "spotify") {
                    fetch(
                        "https://ai-music-player-3zcp.onrender.com/spotify/volume-down",
                        { method: "POST" }
                    );
                } else {
                    onVolumeDown();
                }
            });
            return;
        }

        // ----------------- VOLUME UP (Pinch Out) -----------------
        if (pinchDistance > 0.25) {
            triggerGesture("Volume Up", () => {
                if (mode === "spotify") {
                    fetch(
                        "https://ai-music-player-3zcp.onrender.com/spotify/volume-up",
                        { method: "POST" }
                    );
                } else {
                    onVolumeUp();
                }
            });
            return;
        }

        // ----------------- THUMB DOWN -----------------
        const isThumbDown =
            thumbTip.y > landmarks[3].y &&
            isFingerDown(8, 6);

        if (isThumbDown) {
            triggerGesture("Dislike", onNext);
        }
    });

    const camera = new Camera(videoElement, {
        onFrame: async () => {
            if (!isMounted) return;

            try {
                if (
                    videoElement.readyState >= 2 &&
                    videoElement.videoWidth > 0
                ) {
                    await hands.send({ image: videoElement });
                }
            } catch (err) {
                console.log(err);
            }
        },
        width: 640,
        height: 480
    });

    camera.start();

    return () => {
        isMounted = false;

        try {
            camera.stop();

            if (videoElement.srcObject) {
                videoElement.srcObject
                    .getTracks()
                    .forEach(track => track.stop());

                videoElement.srcObject = null;
            }
        } catch (err) {
            console.log("Camera cleanup error:", err);
        }
    };
};