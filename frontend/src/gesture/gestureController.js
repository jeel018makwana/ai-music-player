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

        if (now - lastActionTimeRef.current < 1000) return;
        if (lastGestureRef.current === gestureName) return;

        lastGestureRef.current = gestureName;
        lastActionTimeRef.current = now;

        setGesture(gestureName);
        action();

        setTimeout(() => {
            lastGestureRef.current = "";
        }, 800);
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
        const middleTip = landmarks[12];

        const distance = Math.hypot(
            thumbTip.x - indexTip.x,
            thumbTip.y - indexTip.y
        );

        // ================= VOLUME DOWN =================
        if (distance < 0.04) {
            triggerGesture("Volume Down", () => {
                if (mode === "spotify") {
                    fetch("https://ai-music-player-3zcp.onrender.com/spotify/volume-down", {
                        method: "POST"
                    });
                } else {
                    onVolumeDown();
                }
            });
            return;
        }

        // ================= VOLUME UP =================
        if (distance > 0.18) {
            triggerGesture("Volume Up", () => {
                if (mode === "spotify") {
                    fetch("https://ai-music-player-3zcp.onrender.com/spotify/volume-up", {
                        method: "POST"
                    });
                } else {
                    onVolumeUp();
                }
            });
            return;
        }

        // ================= PLAY =================
        const isThumbUp =
            thumbTip.y < landmarks[3].y &&
            indexTip.y > landmarks[6].y &&
            middleTip.y > landmarks[10].y;

        if (isThumbUp) {
            triggerGesture("Play", () => {
                if(mode === "spotify") {
                    fetch("https://ai-music-player-3zcp.onrender.com/spotify/play", {metohd:"POST"});
                }else {
                    onPlay();
                }
            });
            return;
        }

        // ================= PAUSE =================
        const isFist =
            landmarks[8].y > landmarks[6].y &&
            landmarks[12].y > landmarks[10].y &&
            landmarks[16].y > landmarks[14].y &&
            landmarks[20].y > landmarks[18].y;

        if (isFist) {
            triggerGesture("Pause", onPause);
            return;
        }

        // ================= NEXT =================
        const isNext =
            landmarks[8].y < landmarks[6].y &&
            landmarks[12].y < landmarks[10].y &&
            Math.abs(indexTip.x - middleTip.x) < 0.12;

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

        // ================= PREVIOUS =================
        const isPrevious =
            landmarks[8].y < landmarks[6].y &&
            landmarks[12].y > landmarks[10].y;

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

        // ================= THUMB DOWN =================
        const isThumbDown =
            thumbTip.y > landmarks[3].y &&
            indexTip.y > landmarks[6].y;

        if (isThumbDown) {
            triggerGesture("Dislike", onNext);
            return;
        }
    });

    const camera = new Camera(videoElement, {
        onFrame: async () => {
            if (!isMounted) return;

            try {
                if (videoElement.readyState >= 2 && videoElement.videoWidth > 0) {
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

            if(videoElement.srcObject) {
                videoElement.srcObject.getTracks().forEach(track => track.stop());
                videoElement.srcObject = null;
            }
        } catch (err) {
            console.log("Camera cleanup error:",err)
        }
    };
};