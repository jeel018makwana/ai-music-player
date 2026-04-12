export function initVoice({
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
}) {
    const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.log("speech Recognition not supported in this browser");
        return;
    }
    const speak = (text) => {
        const speech = new SpeechSynthesisUtterance(text);
        speech.lang = "en-US";
        window.speechSynthesis.speak(speech);
    };

    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    let isListening = true;
    let isRecognizing = false;

    const startRecognition = () => {
            if (isRecognizing) return;

            try {
                recognition.start();
                isRecognizing = true;
            } catch (err) {
                console.log("start error",err);
            }
        };
    recognition.onstart = () => {
        console.log("Voice recognition started");
        isRecognizing = true;
    };
    recognition.onresult = (event) => {
        const transcript =
            event.results[0][0].transcript
                .toLowerCase()
                .trim();

        console.log("Voice:", transcript);

        if (transcript.includes("kiki")) {
            const command = transcript.replace("kiki", "").trim();
            console.log("Command:", command);
            setVoiceText(command);
            if (command.includes("play song")) {
                const songName = command.replace("play song", "").trim();

                const index = songs.findIndex((song) =>
                    song.name.toLowerCase().includes(songName)
                );

                if (index !== -1) {
                    setCurrentIndex(index);
                    handlePlay();
                    setAssistantText(`Playing ${songName}`);
                    speak(`Playing ${songName}`);
                } else {
                    console.log("song not in local -> spotify");
                    if (mode === "spotify") {
                        handleSpotifyPlaySong(songName);
                        setAssistantText(`Playing ${songName} on Spotify`);
                        speak(`Playing ${songName} on Spotify`);
                    } else {
                        handleSpotifyPlay();
                        setAssistantText(`Playing music on Spotify`);
                        speak(`Playing music on Spotify`)
                    }
                }
            } else if (command.includes("play")) {
                handlePlay();
                setAssistantText("Playing");
                speak("Playing");
            } else if (command.includes("pause")) {
                handlePause();
                setAssistantText("Paused");
                speak("Paused");
            } else if (command.includes("next")) {
                handleNext();
                setAssistantText("Next Song");
                speak("Next Song");
            } else if (command.includes("previous")) {
                handlePrev();
                setAssistantText("Previous song");
                speak("Previous song");
            } else if (command.includes("volume up")) {
                volumeUp();
                setAssistantText("Volume increased");
                speak("Volume increased");
            } else if (command.includes("volume down")) {
                volumeDown();
                setAssistantText("Volume decreased");
                speak("Volume decreased");
            }
        }
        setVoiceText(transcript);

        // ✅ FORCE RESTART AFTER EACH RESULT
        try {
            recognition.stop();
        } catch (e) {}

        setTimeout(() => {
            if (isListening) {
                try {
                    recognition.start();
                } catch (err) {
                    console.log("Restart error:", err);
                }
            }
        }, 300);
    };
    
    recognition.onerror = (err) => {
        console.log("Speech recognition error:",err);
        isRecognizing = false;

        setTimeout(() => {
            startRecognition();
        },500)
    };

    recognition.onend = () => {
        isRecognizing = false;
        if (isListening) {
            console.log("voice restarted...");
            setTimeout(() => {
                startRecognition();
            }, 500);
        }
    };

    startRecognition();

    return () => {
        isListening = false;
        recognition.stop();
    };
}