import React, { useEffect, useState, useRef } from "react";
import "../styles/dashboard.css";
import { useNavigate } from "react-router-dom";
import { initGestureController } from "../gesture/gestureController";
import { initVoice } from "../gesture/voiceController";

function Dashboard() {
    const navigate = useNavigate();
    const [songs,setSongs] = useState([]);
    const [volume, setVolume] = useState(1);
    const [hasInteracted, setHasInteracted] = useState(false);
    const [gesture, setGesture] = useState("");
    const [currentIndex, setCurrentIndex] = useState(0);
    const audioRef = useRef(null);
    const videoRef = useRef(null);
    const [gestureEnabled, setGestureEnabled] = useState(false);
    const hasInteractedRef = useRef(false);
    const [mode, setMode] = useState("local")
    const [voiceText, setVoiceText] = useState("");
    const [assistantText, setAssistantText] = useState("");
    useEffect(() => {
        if (mode === "spotify"){
            if ( audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = "";
            }
        } else if (mode === "local") {
            fetch("https://ai-music-player-3zcp.onrender.com/spotify/pause", {method: "POST"}).catch (() => {});
        }
        
    }, [mode]);

    useEffect(() => {
        if (mode !== "spotify") return;

        fetch("https://ai-music-player-3zcp.onrender.com/spotify/devices")
            .then(res => res.json())
            .then(data => {
                if (!data.devices || data.devices.length === 0) {
                    window.location.href = "https://ai-music-player-3zcp.onrender.com/spotify/login";
                }
            })
            .catch(() => {
                window.location.href = "https://ai-music-player-3zcp.onrender.com/spotify/login";
            });
    }, [mode]);

    useEffect(() => {
        console.log("Current Mode:", mode);
    }, [mode]);

    const fetchSongs = async ()=> {
        try {
            const res = await fetch("https://ai-music-player-3zcp.onrender.com/songs");
            const data = await res.json();
            setSongs(data);
        } catch (err) {
            console.log(err);
        }
    };
    useEffect(() => {
        fetchSongs();
    }, []);

    useEffect(() => {
        if (audioRef.current && mode === "local") {
            audioRef.current.volume = volume;
        }
    }, [volume, mode]);

    useEffect(() => {
        if (!audioRef.current || songs.length === 0 || mode !== "local") return;
        const audio = audioRef.current;

        audio.crossOrigin = "anonymous";
        audio.preload = "auto";

        if (audio.src !== songs[currentIndex]?.url) {
            audio.pause();
            audio.src = songs[currentIndex]?.url;
            audio.load();
            if (hasInteracted) {
                audio.play().catch(() => {});
            }
        }
    },[currentIndex,songs, hasInteracted,mode]);

    const lastSpotifyAction = useRef(0);

    const canCallSpotify = () => {
        const now = Date.now();
        if (now - lastSpotifyAction < 1000) return false;
        lastSpotifyAction.current = now;
        return true;
    }
    const handleSpotifyPlaySong = async (songName) => {
        await fetch("https://ai-music-player-3zcp.onrender.com/spotify/play-song", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ song: songName })
        });
    };
    const handleSpotifyPlay = async () => {
        if (!canCallSpotify()) return;
        await fetch("https://ai-music-player-3zcp.onrender.com/spotify/play", { method: "POST"});
    };

    const handleSpotifyPause = async () => {
        if (!canCallSpotify()) return;
        await fetch("https://ai-music-player-3zcp.onrender.com/spotify/pause", {method: "POST"});
    };

    const handleSpotifyNext = async () => {
        if (!canCallSpotify()) return;
        await fetch("https://ai-music-player-3zcp.onrender.com/spotify/next", {method: "POST"});
    };

    const handleSpotifyPrev = async () => {
        if (!canCallSpotify()) return;
        await fetch("https://ai-music-player-3zcp.onrender.com/spotify/previous", {method: "POST"});
    };
    const handleSpotifyVolumeUp = async () => {
        if (!canCallSpotify()) return;
        await fetch("https://ai-music-player-3zcp.onrender.com/spotify/volume-up", {method:"POST"})
    };
    const handleSpotifyVolumeDown = async () => {
        if (!canCallSpotify()) return;
        await fetch("https://ai-music-player-3zcp.onrender.com/spotify/volume-down", {method:"POST"})
    };

    const handleVolumeChange = (e) => {
        const vol = parseFloat(e.target.value);
        setVolume(vol);
        
    };

    useEffect(() => {
        const token = localStorage.getItem("token");

        if(!token) {
            navigate("/");
        }
    }, [navigate]);

    const handleLogout = async () => {
        try {
            await fetch("https://ai-music-player-3zcp.onrender.com/spotify/pause", {method: "POST"});
        } catch (err) {
            console.log("Spotify pause failed (Ignore");
        }
        localStorage.removeItem("token");
        navigate("/");
    }; 
    const handlePlay = () => {
        if (mode === "spotify") {
            handleSpotifyPlay();
        } else {
            setHasInteracted(true);   // 🔥 mark interaction
            hasInteractedRef.current = true;
            audioRef.current.play().catch(()=>{});
        }
    };
    const handlePause = () => {
        if (mode === "spotify") {
           handleSpotifyPause();
        } else {
            audioRef.current.pause();
        }
    };
    const handleNext = () => {
        if (songs.length === 0) return;
        if (mode === "spotify") {
            handleSpotifyNext();
        } else{
            setCurrentIndex((prev) =>
                prev === songs.length - 1 ? 0 : prev + 1
            );
        }
    };
    const handlePrev = () => {
        if (songs.length === 0) return;
        if (mode === "spotify") {
            handleSpotifyPrev();
        } else{
            setCurrentIndex((prev) =>
            prev === 0 ? songs.length -1 : prev -1
            );
        }
    };
    const volumeUp = () => {
        if (mode === "spotify") {
            handleSpotifyVolumeUp();
            return;
        }
        setVolume((prev) => {
            let newVol = prev + 0.05;
            if (newVol > 1) newVol = 1;
            return newVol;
        });
    };
    const volumeDown = () => {
        if (mode === "spotify") {
            handleSpotifyVolumeDown();
            return;
        }
        setVolume((prev) => {
            let newVol = prev - 0.05;
            if (newVol < 0) newVol = 0;
            return newVol;
        });
    };
    useEffect(() => {
        if (!gestureEnabled || !videoRef.current) return;

        const cleanup = initGestureController({
            videoElement: videoRef.current,
            songs,
            setCurrentIndex,
            setGesture,
            setVolume,
            onPlay: handlePlay,
            onPause: handlePause,
            onNext: handleNext,
            onPrev: handlePrev,
            onVolumeUp : volumeUp,
            onVolumeDown : volumeDown,
            mode
        });

        return () => cleanup && cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gestureEnabled,songs, mode]);

    useEffect(() => {
        const cleanup = initVoice({
            handlePlay,
            handlePause,
            handleNext,
            handlePrev,
            handleSpotifyPlaySong,
            handleSpotifyPlay,
            songs,
            setCurrentIndex,
            mode,
            volumeUp,
            volumeDown,
            setVoiceText,
            setAssistantText
        });
        return () => cleanup && cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [songs, mode]);

    useEffect (() => {
        const handleKey = (e) => {
            if (e.key === "q") {
                window.location.reload();
            }
        };

        window.addEventListener("keydown", handleKey);

        return () => window.removeEventListener("keydown", handleKey);
    }, []);

    return (
        <div className="dashboard">
            <div className="bg-image"></div>
            <div className="bg-overlay"></div>
            {/* Navbar */}
            <div className="navbar">
                <h2>AI Music Player</h2>
                <button className="logout-btn" onClick={handleLogout}>
                    Logout
                </button>
            </div>
            <div className="top-controls">
                <div className="song-section">
                    <select onChange={(e) => {
                        const index = e.target.selectedIndex - 1;
                        if(index>=0) setCurrentIndex(index);
                    }}>
                        <option>Select Song</option>
                        {songs.map((song, index) => (
                            <option key={index} value={song.url}>
                                {song.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="mode-switch">
                <button className={`mode-btn ${mode === "local" ? "active" : ""}`} 
                onClick={() => setMode("local")}>Local</button>
                <button className={`mode-btn ${mode === "spotify" ? "active" : ""}`}
                onClick={async () => {
                    setMode("spotify");
                    try{
                        const res =await fetch("https://ai-music-player-3zcp.onrender.com/spotify/devices");
                        const data = await res.json();
                        if(!data.devices || data.error || data.devices.length === 0) {
                            window.location.href = "https://ai-music-player-3zcp.onrender.com/spotify/login";
                        }
                    } catch (err) {
                        window.location.href = "https://ai-music-player-3zcp.onrender.com/spotify/login";
                    }
                }}>Spotify</button>
            </div>
            <div className="main-grid">
                <div className="glass-card left-panel">
                    <h3>Gesture Control</h3>
                    <div className="gesture-buttons">
                        <button onClick={() => setGestureEnabled(true)}>Start Gesture</button>
                        <button onClick={() => setGestureEnabled(false)}>Stop Gesture</button>
                    </div>
                    {gestureEnabled && (
                        <video ref={videoRef} autoPlay playsInline style={{width:"300px", borderRadius:"10px"}}/>         
                    )}
                    <div className="gesture-box">
                        <h3>Gesture Detected</h3>
                        <p>{gesture || "No gesture yet"}</p>
                    </div>
                </div> 
                <div className="glass-card player-card">
                    <h2>Now Playing</h2>
                    <div className="controls">
                        <button onClick={handlePrev}>Previous</button>
                        <button onClick={handlePlay}>Play</button>
                        <button onClick={handlePause}>Pause</button>
                        <button onClick={handleNext}>Next</button>
                    </div>
                    <div className="volume-controls">
                        <button onClick={volumeDown}>🔉</button>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={handleVolumeChange}
                        />
                        <button onClick={volumeUp}>🔊</button>
                    </div>
                    <audio ref={audioRef} onEnded={handleNext} preload="metadata"/>
                </div>
                <div className="right-panel">
                    <div className="glass-card info-card">
                        <h3>Voice Commands</h3>
                        <p><strong>You:</strong> {voiceText || "Say 'kiki...'"}</p>
                        <p><strong>AI:</strong> {assistantText || "Waiting..."}</p>
                        <ul>
                            <li>Kiki, Play</li>
                            <li>Kiki, Pause</li>
                            <li>Kiki, Next</li>
                            <li>Kiki, Previous</li>
                            <li>Kiki, Play song Song_name</li>
                            <li>Kiki, Volume Up</li>
                            <li>Kiki, Volume Down</li>
                        </ul>
                    </div>

                    <div className="info-card">
                        <h3> Gesture Controls</h3>
                        <ul>
                            <li>Thumb Up -- Play</li>
                            <li>Fist -- Pause</li>
                            <li>Pinch In -- Volume Down</li>
                            <li>Pinch Out -- Volume Up</li>
                            <li>Swipe Left -- Previous</li>
                            <li>Swipe Right -- Next</li>
                            <li>Thumb Down -- Dislike</li>
                        </ul>
                    </div>
                </div>

            </div>

    </div>    
)};
export default Dashboard;
