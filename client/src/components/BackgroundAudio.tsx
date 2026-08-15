import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

const AUDIO_SRC = "/manus-storage/saraswati-mantra.mp3";

export default function BackgroundAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.35;
    audio.muted = muted;

    const tryPlay = () => {
      audio.play().catch(() => {
        // Chrome may block audible autoplay until the first user gesture.
      });
    };

    const resumeAfterGesture = () => {
      tryPlay();
      window.removeEventListener("pointerdown", resumeAfterGesture);
      window.removeEventListener("keydown", resumeAfterGesture);
    };

    tryPlay();
    window.addEventListener("pointerdown", resumeAfterGesture, { once: true });
    window.addEventListener("keydown", resumeAfterGesture, { once: true });

    return () => {
      window.removeEventListener("pointerdown", resumeAfterGesture);
      window.removeEventListener("keydown", resumeAfterGesture);
    };
  }, [muted]);

  const toggleMute = async () => {
    const audio = audioRef.current;
    const nextMuted = !muted;

    setMuted(nextMuted);
    if (audio) {
      audio.muted = nextMuted;
      audio.volume = 0.35;
      await audio.play().catch(() => {});
    }
  };

  if (failed) return null;

  return (
    <>
      <audio
        ref={audioRef}
        src={AUDIO_SRC}
        autoPlay
        loop
        preload="metadata"
        onCanPlay={() => setReady(true)}
        onError={() => setFailed(true)}
      />
      <button
        type="button"
        className={`audio-toggle ${ready ? "is-ready" : ""}`}
        onClick={toggleMute}
        aria-label={muted ? "Unmute background music" : "Mute background music"}
        title={muted ? "Unmute music" : "Mute music"}
      >
        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>
    </>
  );
}
