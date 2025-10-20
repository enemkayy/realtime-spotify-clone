import { usePlayerStore } from "@/stores/usePlayerStore";
import { useEffect, useRef } from "react";
import { useAuth, useClerk } from "@clerk/clerk-react";

const AudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const prevSongRef = useRef<string | null>(null);

  const { currentSong, isPlaying, playNext, forcePause } = usePlayerStore();

  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();

  // block playback if not signed in
  useEffect(() => {
    if (isPlaying && !isSignedIn) {
      forcePause();
      // try Clerk modal; fallback to route
      try {
        openSignIn?.({});
      } catch {
        window.location.href = "/sign-in";
      }
    }
  }, [isPlaying, isSignedIn, forcePause, openSignIn]);

  // handle play/pause logic
  useEffect(() => {
    if (!isSignedIn) return;
    if (isPlaying) audioRef.current?.play().catch(() => {});
    else audioRef.current?.pause();
  }, [isPlaying, isSignedIn]);

  // advance to next song when current ends
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onEnded = () => {
      if (isSignedIn) playNext();
      else forcePause();
    };

    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  }, [playNext, isSignedIn, forcePause]);

  // handle song ends
  useEffect(() => {
    if (!isSignedIn) return;
    if (isPlaying) {
      audioRef.current?.play().catch(() => {}); // avoid console warning
    } else {
      audioRef.current?.pause();
    }
  }, [isPlaying, isSignedIn]);

  // handle song changes
  useEffect(() => {
    if (!audioRef.current || !currentSong) return;

    const audio = audioRef.current;
    const isSongChange = prevSongRef.current !== currentSong?.audioUrl;

    if (isSongChange) {
      audio.src = currentSong?.audioUrl;
      audio.currentTime = 0;
      prevSongRef.current = currentSong?.audioUrl;

      if (isPlaying && isSignedIn) {
        audio.play().catch(() => {});
      }
    }
  }, [currentSong, isPlaying, isSignedIn]);

  return <audio ref={audioRef} />;
};
export default AudioPlayer;
