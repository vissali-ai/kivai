"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type Phase = "idle" | "requesting" | "recording" | "finishing";
type Capture = { streams: MediaStream[]; audio?: AudioContext; recorder?: MediaRecorder };

function release(session: Capture) {
  if (session.recorder && session.recorder.state !== "inactive") session.recorder.stop();
  for (const stream of session.streams) for (const track of stream.getTracks()) track.stop();
  if (session.audio && session.audio.state !== "closed") void session.audio.close().catch(() => {});
}

export default function Recorder() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [mic, setMic] = useState(false);
  const [sound, setSound] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<{url:string; filename:string} | null>(null);
  const active = useRef<Capture | null>(null);
  const resultUrl = useRef("");
  const live = useRef<HTMLVideoElement>(null);
  const resultSection = useRef<HTMLDivElement>(null);
  useEffect(() => () => {
    const session = active.current;
    active.current = null;
    if (session) release(session);
    if (resultUrl.current) URL.revokeObjectURL(resultUrl.current);
  }, []);

  function finish() {
    const recorder = active.current?.recorder;
    if (recorder?.state === "recording") {
      setPhase("finishing");
      recorder.stop();
    }
  }

  async function start() {
    if (active.current) return;
    if (!navigator.mediaDevices?.getDisplayMedia || typeof MediaRecorder === "undefined") {
      setMessage("Este navegador não oferece gravação de tela. Abra o gravador em um navegador compatível no computador.");
      return;
    }
    const session: Capture = { streams: [] };
    active.current = session;
    setPhase("requesting"); setMessage("");
    // A permission prompt can resolve after navigation. Release that stream immediately.
    function keep(stream: MediaStream) {
      session.streams.push(stream);
      if (active.current !== session) { release(session); throw new Error(); }
      return stream;
    }
    try {
      const screen = keep(await navigator.mediaDevices.getDisplayMedia({video:true, audio:sound}));
      const microphone = mic ? keep(await navigator.mediaDevices.getUserMedia({audio:true})) : null;
      const video = screen.getVideoTracks()[0];
      const tracks = [video];
      const audioInputs = [screen, microphone].filter((s): s is MediaStream => !!s?.getAudioTracks().length);
      if (audioInputs.length === 2) {
        const context = session.audio = new AudioContext();
        const mix = context.createMediaStreamDestination();
        keep(mix.stream);
        for (const source of audioInputs) context.createMediaStreamSource(source).connect(mix);
        await context.resume();
        tracks.push(...mix.stream.getAudioTracks());
      } else if (audioInputs.length) tracks.push(...audioInputs[0].getAudioTracks());
      if (active.current !== session || video.readyState === "ended") throw new Error();
      const mimeType = ["video/webm;codecs=vp8,opus", "video/webm", "video/mp4"].find(type => MediaRecorder.isTypeSupported(type));
      const stream = new MediaStream(tracks);
      const recorder = session.recorder = new MediaRecorder(stream, mimeType ? {mimeType} : undefined);
      const chunks: Blob[] = [];
      let interrupted = false;
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onerror = () => { interrupted = true; finish(); };
      recorder.onstop = () => {
        if (active.current !== session) return;
        active.current = null;
        release(session);
        if (live.current) live.current.srcObject = null;
        setPhase("idle");
        if (!chunks.length) { setMessage("A captura terminou sem gerar vídeo. Tente novamente."); return; }
        const type = chunks[0].type || recorder.mimeType;
        const url = URL.createObjectURL(new Blob(chunks, {type}));
        if (resultUrl.current) URL.revokeObjectURL(resultUrl.current);
        resultUrl.current = url;
        setResult({url, filename:"gravacao-de-tela." + (type.includes("mp4") ? "mp4" : "webm")});
        setMessage(interrupted ? "A captura foi interrompida. Confira o trecho disponível." : "Gravação pronta para baixar.");
        window.focus();
        window.setTimeout(() => resultSection.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
      };
      video.addEventListener("ended", finish, {once:true});
      recorder.start(1000);
      if (live.current) live.current.srcObject = screen;
      setPhase("recording");
      setMessage(sound && !screen.getAudioTracks().length ? "Gravando. A fonte selecionada não compartilhou áudio." : "Gravação em andamento.");
    } catch {
      release(session);
      if (active.current !== session) return;
      active.current = null;
      setPhase("idle");
      setMessage("A gravação não iniciou. Selecione uma fonte e autorize o acesso à tela e, se escolhido, ao microfone.");
    }
  }
  return <section className="space-y-5 rounded-xl border bg-card p-5 sm:p-8">
    <fieldset disabled={phase !== "idle"} className="space-y-2"><legend className="mb-2 font-semibold">Áudio da gravação</legend>
      <label className="flex items-center gap-2"><input type="checkbox" checked={sound} onChange={e=>setSound(e.target.checked)}/>Som compartilhado da aba ou do sistema</label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={mic} onChange={e=>setMic(e.target.checked)}/>Microfone</label>
    </fieldset>
    <p className="text-sm text-muted-foreground">Ao iniciar, escolha a tela, janela ou aba no navegador. Para incluir o som da fonte, autorize também o áudio no seletor.</p>
    {(phase === "recording" || phase === "finishing") && <p role="note" className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm font-medium">Retorne ao site Kivai para baixar a gravação da tela quando terminar de compartilhar.</p>}
    {phase === "recording" ? <Button onClick={finish}>Encerrar gravação</Button> :
      <Button disabled={phase !== "idle"} onClick={start}>{phase === "requesting" ? "Aguardando permissão…" : phase === "finishing" ? "Preparando vídeo…" : "Iniciar gravação"}</Button>}
    <p role="status">{message}</p>
    <video ref={live} autoPlay muted playsInline hidden={phase !== "recording"} aria-label="Prévia ao vivo" className="max-h-96 w-full rounded-lg bg-black" />
    {result && <div ref={resultSection} className="space-y-4"><h2 className="font-semibold">Última gravação</h2>
      <video src={result.url} controls playsInline aria-label="Gravação concluída" className="max-h-96 w-full rounded-lg bg-black"/>
      <a className="inline-block rounded-md bg-primary px-5 py-2 font-semibold text-primary-foreground" href={result.url} download={result.filename}>Baixar gravação</a></div>}
  </section>;
}
