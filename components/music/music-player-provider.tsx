"use client";

import Image from "next/image";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, SkipBack, SkipForward, Volume2 } from "lucide-react";
import type { MusicTrack } from "@/lib/music/types";

type Item = MusicTrack & { artistName: string; albumTitle: string; coverUrl: string };
type State = { queue: Item[]; index: number; playing: boolean; isStreamingHost: boolean; play: (q: Item[], i: number) => void };
const C = createContext<State | null>(null);
function fmt(n: number) {
  if (!Number.isFinite(n)) return "0:00";
  return `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, "0")}`;
}
export function useMusicPlayer() {
  const value = useContext(C);
  if (!value) throw new Error("Music player provider missing");
  return value;
}

export function MusicPlayerProvider({ children, isStreamingHost }: { children: React.ReactNode; isStreamingHost: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const listenedSecondsRef = useRef(0);
  const lastPlaybackTimeRef = useRef<number | null>(null);
  const countedTrackRef = useRef<string | null>(null);
  const queueRef = useRef<Item[]>([]);
  const indexRef = useRef(-1);
  const [queue, setQueue] = useState<Item[]>([]);
  const [index, setIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackError, setPlaybackError] = useState(false);
  const item = queue[index];

  const selectTrack = useCallback((nextQueue: Item[], nextIndex: number, start: boolean) => {
    const audio = audioRef.current;
    const next = nextQueue[nextIndex];
    if (!audio || !next) return;

    queueRef.current = nextQueue;
    indexRef.current = nextIndex;
    setQueue(nextQueue);
    setIndex(nextIndex);
    setCurrent(0);
    setDuration(0);
    listenedSecondsRef.current = 0;
    lastPlaybackTimeRef.current = null;
    countedTrackRef.current = null;
    setPlaybackError(false);

    // Change the source and request playback in the same call path. This matters
    // on mobile browsers, which can reject play() after a deferred state/effect.
    if (audio.src !== next.audioUrl) {
      audio.src = next.audioUrl;
      audio.load();
    }
    if (!start) {
      audio.pause();
      return;
    }
    void audio.play().then(() => {
      setPlaying(true);
      lastPlaybackTimeRef.current = audio.currentTime;
    }).catch(() => {
      setPlaying(false);
      setPlaybackError(true);
    });
  }, []);

  const play = useCallback((nextQueue: Item[], nextIndex: number) => {
    if (!nextQueue.length || nextIndex < 0 || nextIndex >= nextQueue.length) return;
    selectTrack(nextQueue, nextIndex, true);
  }, [selectTrack]);

  const change = useCallback((nextIndex: number) => {
    const activeQueue = queueRef.current;
    if (!activeQueue.length || nextIndex < 0 || nextIndex >= activeQueue.length) return;
    selectTrack(activeQueue, nextIndex, true);
  }, [selectTrack]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      setPlaybackError(false);
      void audio.play().then(() => setPlaying(true)).catch(() => {
        setPlaying(false);
        setPlaybackError(true);
      });
    } else {
      audio.pause();
    }
  }, []);

  useEffect(() => {
    if (!item || !("mediaSession" in navigator) || typeof MediaMetadata === "undefined") return;
    const session = navigator.mediaSession;
    try {
      session.metadata = new MediaMetadata({
        title: item.title,
        artist: item.artistName,
        album: item.albumTitle,
        artwork: item.coverUrl ? [{ src: item.coverUrl, sizes: "512x512", type: "image/jpeg" }] : [],
      });
      session.playbackState = playing ? "playing" : "paused";
      session.setActionHandler("play", toggle);
      session.setActionHandler("pause", () => audioRef.current?.pause());
      session.setActionHandler("previoustrack", () => change(Math.max(indexRef.current - 1, 0)));
      session.setActionHandler("nexttrack", () => {
        const nextIndex = indexRef.current + 1;
        if (nextIndex < queueRef.current.length) change(nextIndex);
      });
      session.setActionHandler("seekbackward", (event) => {
        const audio = audioRef.current;
        if (audio) audio.currentTime = Math.max(0, audio.currentTime - (event.seekOffset ?? 10));
      });
      session.setActionHandler("seekforward", (event) => {
        const audio = audioRef.current;
        if (audio) audio.currentTime = Math.min(audio.duration || Infinity, audio.currentTime + (event.seekOffset ?? 10));
      });
    } catch {
      // Media Session is optional and varies by browser.
    }
  }, [item, playing, toggle, change]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !("mediaSession" in navigator) || !navigator.mediaSession.setPositionState) return;
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
    try {
      navigator.mediaSession.setPositionState({ duration: audio.duration, playbackRate: audio.playbackRate, position: Math.min(audio.currentTime, audio.duration) });
    } catch {
      // Position state is optional.
    }
  }, [current, duration]);

  const ctx = useMemo(() => ({ queue, index, playing, isStreamingHost, play }), [queue, index, playing, isStreamingHost, play]);
  const nextTrack = () => {
    const nextIndex = indexRef.current + 1;
    if (nextIndex < queueRef.current.length) change(nextIndex);
  };
  const previousTrack = () => {
    const activeQueue = queueRef.current;
    if (activeQueue.length) change(Math.max(indexRef.current - 1, 0));
  };

  return (
    <C.Provider value={ctx}>
      {children}
      <audio
        ref={audioRef}
        preload="auto"
        onPlay={(event) => {
          setPlaying(true);
          setPlaybackError(false);
          lastPlaybackTimeRef.current = event.currentTarget.currentTime;
        }}
        onPause={() => {
          setPlaying(false);
          lastPlaybackTimeRef.current = null;
        }}
        onSeeking={(event) => {
          lastPlaybackTimeRef.current = event.currentTarget.currentTime;
        }}
        onSeeked={(event) => {
          lastPlaybackTimeRef.current = event.currentTarget.currentTime;
        }}
        onTimeUpdate={(event) => {
          const audio = event.currentTarget;
          setCurrent(audio.currentTime);
          const previous = lastPlaybackTimeRef.current;
          lastPlaybackTimeRef.current = audio.currentTime;
          if (audio.paused || audio.seeking || previous === null) return;
          const elapsed = audio.currentTime - previous;
          if (elapsed > 0 && elapsed <= 2) listenedSecondsRef.current += elapsed;
          const activeTrack = queueRef.current[indexRef.current];
          if (activeTrack && countedTrackRef.current !== activeTrack.id && listenedSecondsRef.current >= 15) {
            countedTrackRef.current = activeTrack.id;
            void fetch("/api/music/play", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ trackId: activeTrack.id }),
            }).catch(() => undefined);
          }
        }}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onError={() => { setPlaying(false); setPlaybackError(true); }}
        onEnded={nextTrack}
      />
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background px-3 py-2 shadow-2xl sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center gap-2 sm:gap-3">
          <div className="relative size-11 shrink-0 overflow-hidden rounded-md bg-muted">
            {item?.coverUrl && <Image src={item.coverUrl} alt="" fill sizes="44px" className="object-cover" />}
          </div>
          <div className="min-w-0 w-28 sm:w-48">
            <p className="truncate text-xs font-semibold">{item?.title ?? "Escolha uma música"}</p>
            <p className="truncate text-[11px] text-muted-foreground">{item?.artistName ?? "Kivai Música"}</p>
          </div>
          <button aria-label="Faixa anterior" className="rounded-full p-2 hover:bg-muted disabled:opacity-40" disabled={!item} onClick={previousTrack}><SkipBack className="size-4" /></button>
          <button aria-label={playing ? "Pausar" : "Reproduzir"} className="rounded-full bg-primary p-2 text-primary-foreground" disabled={!item} onClick={toggle}>{playing ? <Pause className="size-4" /> : <Play className="size-4" />}</button>
          <button aria-label="Próxima faixa" className="rounded-full p-2 hover:bg-muted disabled:opacity-40" disabled={!item || index >= queue.length - 1} onClick={nextTrack}><SkipForward className="size-4" /></button>
          <span className="hidden text-[10px] tabular-nums text-muted-foreground sm:block">{fmt(current)}</span>
          <input aria-label="Progresso da faixa" type="range" min="0" max={duration || 0} step="1" value={Math.min(current, duration || 0)} onChange={(event) => { if (audioRef.current) audioRef.current.currentTime = Number(event.target.value); }} disabled={!item || !duration} className="min-w-0 flex-1 accent-primary" />
          <span className="hidden text-[10px] tabular-nums text-muted-foreground sm:block">{fmt(duration)}</span>
          <Volume2 className="hidden size-4 text-muted-foreground sm:block" />
          <input aria-label="Volume" type="range" min="0" max="1" step="0.05" defaultValue="1" onChange={(event) => { if (audioRef.current) audioRef.current.volume = Number(event.target.value); }} className="hidden w-20 accent-primary sm:block" />
        </div>
        {playbackError && <p role="status" className="mx-auto mt-1 max-w-7xl text-xs text-destructive">O navegador interrompeu a reprodução. Toque em Reproduzir para continuar.</p>}
      </div>
    </C.Provider>
  );
}

