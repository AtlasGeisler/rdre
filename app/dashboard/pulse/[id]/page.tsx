"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface PulseEvent {
  id: number;
  gp_id: number;
  gp_name: string;
  practice_name: string;
  referral_event_id: number | null;
  script_text: string;
  video_url: string | null;
  status: string;
  email_sent_at: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "#888888",
  ready: "#3A7D44",
  sent: "#4A90D9",
  opened: "#C9A84C",
};

const cardBase = {
  background: "#1E3328",
  border: "1px solid #2A4A38",
  borderRadius: "12px",
  padding: "24px",
  marginBottom: "20px",
};

export default function PulseDetailPage() {
  const params = useParams();
  const id = params.id as string;

  // Pulse data state
  const [pulse, setPulse] = useState<PulseEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [script, setScript] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const gpSlug = (pulse?.gp_name ?? "unknown").toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30);

  // Studio state
  const [studioOpen, setStudioOpen] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [teleprompterVisible, setTeleprompterVisible] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [scrollSpeed, setScrollSpeed] = useState(15); // px per second

  // Refs
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const playbackVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/pulse")
      .then(r => r.json())
      .then(j => {
        const found = (j.data as PulseEvent[]).find(p => String(p.id) === id);
        if (found) {
          setPulse(found);
          setScript(found.script_text ?? "");
        }
        setLoading(false);
      });
  }, [id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    };
  }, []);

  // Auto-scroll effect
  useEffect(() => {
    if (autoScroll && recording && scrollRef.current) {
      scrollIntervalRef.current = setInterval(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop += scrollSpeed / 20;
        }
      }, 50);
    } else {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    }
    return () => {
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    };
  }, [autoScroll, recording, scrollSpeed]);

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setRecording(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  async function startCamera() {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      setCameraActive(true);
      // Use setTimeout to ensure video element is mounted
      setTimeout(() => {
        if (liveVideoRef.current) {
          liveVideoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Camera access denied";
      setCameraError(msg.includes("denied") || msg.includes("Permission")
        ? "Camera access denied. Please allow camera and microphone in your browser settings."
        : "Could not access camera: " + msg);
    }
  }

  function startRecording() {
    if (!streamRef.current) return;
    chunksRef.current = [];
    setRecordedUrl(null);
    setRecordedBlob(null);
    setRecordingSeconds(0);

    const mr = new MediaRecorder(streamRef.current, {
      mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : "video/webm",
    });

    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setRecordedBlob(blob);
      const url = URL.createObjectURL(blob);
      setRecordedUrl(url);
      // Stop the live camera feed so playback element renders
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = null;
      }
      setTimeout(() => {
        if (playbackVideoRef.current) {
          playbackVideoRef.current.src = url;
          playbackVideoRef.current.currentTime = 0;
          playbackVideoRef.current.pause();
        }
      }, 200);
    };

    mr.start(250);
    mediaRecorderRef.current = mr;
    setRecording(true);

    // Reset teleprompter scroll
    if (scrollRef.current) scrollRef.current.scrollTop = 0;

    timerRef.current = setInterval(() => {
      setRecordingSeconds(s => s + 1);
    }, 1000);
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  function downloadRecording() {
    if (!recordedBlob || !recordedUrl) return;
    const gpSlug = pulse?.gp_name.replace(/\s+/g, "-").toLowerCase() ?? "pulse";
    const a = document.createElement("a");
    a.href = recordedUrl;
    a.download = `pulse-${gpSlug}-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }

  async function patch(fields: Partial<PulseEvent>) {
    setSaving(true);
    const res = await fetch(`/api/pulse/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    const j = await res.json();
    setPulse(j.data);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🎬</div>
          <div style={{ color: "#A8A08C", fontSize: 14 }}>Loading pulse script...</div>
        </div>
      </div>
    );
  }
  if (!pulse) {
    return (
      <div style={{ padding: "60px", textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>❌</div>
        <div style={{ color: "#F5F0E8", fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Pulse not found</div>
        <Link href="/dashboard/pulse" style={{ color: "#7CB68A" }}>Back to Pulse Center</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: "#A8A08C", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <Link href="/dashboard/pulse" style={{ color: "#7CB68A", display: "flex", alignItems: "center", gap: 4 }}>
            <span>←</span> Pulse Center
          </Link>
          <span style={{ color: "#2A4A38" }}>/</span>
          <span>Edit Pulse</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#F5F0E8", letterSpacing: "-0.5px" }}>
            Pulse Script for {pulse.gp_name}
          </h1>
          <span style={{
            background: STATUS_COLORS[pulse.status] + "22",
            color: STATUS_COLORS[pulse.status],
            border: `1px solid ${STATUS_COLORS[pulse.status]}44`,
            borderRadius: 20,
            padding: "3px 12px",
            fontSize: 12,
            fontWeight: 700,
            textTransform: "capitalize",
          }}>{pulse.status}</span>
        </div>
        <div style={{ fontSize: 13, color: "#A8A08C", marginTop: 4 }}>{pulse.practice_name}</div>
      </div>

      {/* Script editor */}
      <div style={cardBase}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#F5F0E8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Script
          </h2>
          <span style={{ fontSize: 12, color: "#A8A08C" }}>{script.length} chars</span>
        </div>
        <textarea
          value={script}
          onChange={e => setScript(e.target.value)}
          rows={8}
          placeholder="Script text will appear here after generation..."
          style={{
            width: "100%",
            fontFamily: "inherit",
            lineHeight: 1.75,
            fontSize: 18,
            color: "#F5F0E8",
            background: "#1A1A1A",
            border: "1px solid #2A4A38",
            borderRadius: 8,
            padding: "16px",
            resize: "vertical",
          }}
        />
      </div>

      {/* Recording Studio */}
      <div style={{
        ...cardBase,
        borderColor: studioOpen ? "#C9A84C44" : "#2A4A38",
        borderLeft: studioOpen ? "4px solid #C9A84C" : "1px solid #2A4A38",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: studioOpen ? 20 : 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>📹</span>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "#F5F0E8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Recording Studio
              </h2>
              <div style={{ fontSize: 12, color: "#A8A08C", marginTop: 2 }}>
                Record direct to camera with teleprompter
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              if (studioOpen && cameraActive) stopCamera();
              setStudioOpen(o => !o);
            }}
            style={{
              background: studioOpen ? "#A8884022" : "#C9A84C",
              color: studioOpen ? "#C9A84C" : "#1A1A1A",
              border: studioOpen ? "1px solid #C9A84C" : "none",
              borderRadius: 8,
              padding: "9px 20px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {studioOpen ? "Close Studio" : "Open Studio"}
          </button>
        </div>

        {studioOpen && (
          <div>
            {/* Camera not started yet */}
            {!cameraActive && !cameraError && (
              <div style={{
                background: "#1A1A1A",
                border: "1px solid #2A4A38",
                borderRadius: 10,
                padding: "40px",
                textAlign: "center",
                marginBottom: 16,
              }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎥</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#F5F0E8", marginBottom: 8 }}>
                  Start your camera to begin recording
                </div>
                <div style={{ fontSize: 13, color: "#A8A08C", marginBottom: 24 }}>
                  Your browser will ask for camera and microphone permission.
                </div>
                <button
                  onClick={startCamera}
                  style={{
                    background: "#C9A84C",
                    color: "#1A1A1A",
                    border: "none",
                    borderRadius: 8,
                    padding: "12px 32px",
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Start Camera
                </button>
              </div>
            )}

            {cameraError && (
              <div style={{
                background: "#3A1A1A",
                border: "1px solid #8B2020",
                borderRadius: 8,
                padding: "16px 20px",
                marginBottom: 16,
                color: "#F08080",
                fontSize: 14,
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
              }}>
                <span style={{ fontSize: 18 }}>⚠️</span>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Camera Error</div>
                  {cameraError}
                  <button
                    onClick={() => { setCameraError(""); startCamera(); }}
                    style={{ display: "block", marginTop: 10, background: "none", border: "1px solid #8B2020", borderRadius: 6, color: "#F08080", padding: "6px 14px", fontSize: 12, cursor: "pointer" }}
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {cameraActive && (
              <div style={{ maxWidth: 480, margin: "0 auto" }}>
                {/* Layout: teleprompter ABOVE camera, compact window so doctor looks at camera */}
                <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: 16 }}>

                  {/* Teleprompter - positioned ABOVE camera so doctor looks at lens while reading */}
                  {teleprompterVisible && (
                    <div style={{
                      background: "#000",
                      border: `2px solid ${recording ? "#C9A84C" : "#2A4A38"}`,
                      borderRadius: "10px 10px 0 0",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      maxHeight: 280,
                    }}>
                      {/* Teleprompter header */}
                      <div style={{
                        background: "#111",
                        padding: "10px 16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderBottom: "1px solid #222",
                        flexShrink: 0,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 14 }}>📜</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#C9A84C", textTransform: "uppercase", letterSpacing: "1px" }}>
                            Teleprompter
                          </span>
                          {recording && (
                            <span style={{
                              background: "#C9A84C22",
                              color: "#C9A84C",
                              border: "1px solid #C9A84C44",
                              borderRadius: 4,
                              padding: "1px 6px",
                              fontSize: 10,
                              fontWeight: 700,
                            }}>RECORDING</span>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <label style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}>
                            <input
                              type="checkbox"
                              checked={autoScroll}
                              onChange={e => setAutoScroll(e.target.checked)}
                              style={{ width: 14, height: 14 }}
                            />
                            <span style={{ fontSize: 11, color: "#888", whiteSpace: "nowrap" }}>Auto-scroll</span>
                          </label>
                          {autoScroll && (
                            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                              <span style={{ fontSize: 10, color: "#666" }}>Speed</span>
                              <input
                                type="range"
                                min={5}
                                max={80}
                                value={scrollSpeed}
                                onChange={e => setScrollSpeed(Number(e.target.value))}
                                style={{ width: 60 }}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Script text */}
                      <div
                        ref={scrollRef}
                        style={{
                          flex: 1,
                          overflowY: "auto",
                          padding: "24px 28px",
                          scrollBehavior: "smooth",
                        }}
                      >
                        {script ? (
                          <p style={{
                            fontSize: 30,
                            lineHeight: 1.65,
                            color: "#FFFFFF",
                            fontWeight: 500,
                            letterSpacing: "0.2px",
                            whiteSpace: "pre-wrap",
                            margin: 0,
                          }}>
                            {script}
                          </p>
                        ) : (
                          <p style={{
                            fontSize: 20,
                            color: "#555",
                            textAlign: "center",
                            marginTop: 40,
                            fontStyle: "italic",
                          }}>
                            No script loaded. Add script text above first.
                          </p>
                        )}
                        {/* Spacer so last line stays readable */}
                        <div style={{ height: 160 }} />
                      </div>

                      {/* Reset scroll */}
                      <div style={{
                        background: "#111",
                        padding: "8px 16px",
                        borderTop: "1px solid #222",
                        display: "flex",
                        gap: 8,
                        flexShrink: 0,
                      }}>
                        <button
                          onClick={() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }}
                          style={{ background: "none", border: "1px solid #333", borderRadius: 5, color: "#666", fontSize: 11, padding: "4px 10px", cursor: "pointer" }}
                        >
                          Reset Scroll
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Camera preview - directly below teleprompter so eyes stay near lens */}
                  <div style={{
                    background: "#000",
                    border: `2px solid ${recording ? "#FF4444" : "#2A4A38"}`,
                    borderTop: teleprompterVisible ? "none" : undefined,
                    borderRadius: teleprompterVisible ? "0 0 10px 10px" : "10px",
                    overflow: "hidden",
                    position: "relative",
                    minHeight: 240,
                    maxHeight: 320,
                    display: "flex",
                    flexDirection: "column",
                  }}>
                    {/* Live feed or playback */}
                    {!recordedUrl ? (
                      <video
                        ref={liveVideoRef}
                        autoPlay
                        muted
                        playsInline
                        style={{ width: "100%", flex: 1, objectFit: "cover", display: "block" }}
                      />
                    ) : (
                      <div style={{ width: "100%", flex: 1, position: "relative", background: "#000" }}>
                        <video
                          ref={playbackVideoRef}
                          src={recordedUrl ?? undefined}
                          controls
                          playsInline
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                        <div style={{
                          position: "absolute",
                          top: 12,
                          left: "50%",
                          transform: "translateX(-50%)",
                          background: "rgba(0,0,0,0.8)",
                          borderRadius: 6,
                          padding: "6px 16px",
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#7CB68A",
                          pointerEvents: "none",
                        }}>
                          ▶ Press play to review your video
                        </div>
                      </div>
                    )}

                    {/* Recording indicator overlay */}
                    {recording && (
                      <div style={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        background: "rgba(0,0,0,0.75)",
                        borderRadius: 6,
                        padding: "5px 12px",
                      }}>
                        <div style={{
                          width: 10, height: 10,
                          borderRadius: "50%",
                          background: "#FF4444",
                          animation: "pulse-rec 1s infinite",
                        }} />
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#FFF", fontVariantNumeric: "tabular-nums" }}>
                          {formatTime(recordingSeconds)}
                        </span>
                      </div>
                    )}

                    {/* Camera label */}
                    {!recording && !recordedUrl && (
                      <div style={{
                        position: "absolute",
                        bottom: 12,
                        left: 12,
                        background: "rgba(0,0,0,0.6)",
                        borderRadius: 5,
                        padding: "3px 10px",
                        fontSize: 11,
                        color: "#7CB68A",
                        fontWeight: 600,
                      }}>
                        LIVE PREVIEW — Look here 👆 Read the prompter above
                      </div>
                    )}

                    {/* Playback label */}
                    {recordedUrl && (
                      <div style={{
                        position: "absolute",
                        bottom: 52,
                        left: 12,
                        background: "rgba(0,0,0,0.7)",
                        borderRadius: 5,
                        padding: "3px 10px",
                        fontSize: 11,
                        color: "#C9A84C",
                        fontWeight: 600,
                      }}>
                        ▶ PLAYBACK — Review your recording
                      </div>
                    )}
                  </div>
                </div>

                {/* Studio controls */}
                <div style={{
                  background: "#1A1A1A",
                  border: "1px solid #2A4A38",
                  borderRadius: 10,
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}>
                  {/* Teleprompter toggle */}
                  <button
                    onClick={() => setTeleprompterVisible(v => !v)}
                    style={{
                      background: teleprompterVisible ? "#C9A84C22" : "#2A4A38",
                      color: teleprompterVisible ? "#C9A84C" : "#A8A08C",
                      border: `1px solid ${teleprompterVisible ? "#C9A84C44" : "#3A4A38"}`,
                      borderRadius: 7,
                      padding: "8px 16px",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>📜</span> {teleprompterVisible ? "Hide Prompter" : "Show Prompter"}
                  </button>

                  <div style={{ flex: 1 }} />

                  {/* Record controls */}
                  {!recording && !recordedUrl && (
                    <button
                      onClick={startRecording}
                      style={{
                        background: "#FF4444",
                        color: "#FFF",
                        border: "none",
                        borderRadius: 8,
                        padding: "10px 28px",
                        fontSize: 14,
                        fontWeight: 800,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        letterSpacing: "0.3px",
                      }}
                    >
                      <span style={{
                        width: 10, height: 10,
                        background: "#FFF",
                        borderRadius: "50%",
                        display: "inline-block",
                      }} />
                      Record
                    </button>
                  )}

                  {recording && (
                    <button
                      onClick={stopRecording}
                      style={{
                        background: "#1A1A1A",
                        color: "#FF4444",
                        border: "2px solid #FF4444",
                        borderRadius: 8,
                        padding: "10px 28px",
                        fontSize: 14,
                        fontWeight: 800,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span style={{
                        width: 10, height: 10,
                        background: "#FF4444",
                        borderRadius: 2,
                        display: "inline-block",
                      }} />
                      Stop ({formatTime(recordingSeconds)})
                    </button>
                  )}

                  {recordedUrl && (
                    <>
                      <button
                        onClick={() => {
                          setRecordedUrl(null);
                          setRecordedBlob(null);
                          setRecordingSeconds(0);
                          // Restart live preview
                          setTimeout(() => {
                            if (liveVideoRef.current && streamRef.current) {
                              liveVideoRef.current.srcObject = streamRef.current;
                            }
                          }, 100);
                        }}
                        style={{
                          background: "#2A4A38",
                          color: "#A8A08C",
                          border: "1px solid #3A7D44",
                          borderRadius: 8,
                          padding: "10px 20px",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Re-record
                      </button>
                      <button
                        onClick={downloadRecording}
                        style={{
                          background: "#C9A84C",
                          color: "#1A1A1A",
                          border: "none",
                          borderRadius: 8,
                          padding: "10px 24px",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                        }}
                      >
                        <span>⬇️</span> Download .webm
                      </button>
                      <button
                        onClick={async () => {
                          if (!recordedBlob) return;
                          const fd = new FormData();
                          fd.append("video", recordedBlob, `pulse-${gpSlug}-${Date.now()}.webm`);
                          fd.append("pulseId", id);
                          fd.append("gpName", pulse?.gp_name ?? "unknown");
                          setUploading(true);
                          try {
                            const res = await fetch("/api/videos/upload", { method: "POST", body: fd });
                            const j = await res.json();
                            if (j.success) {
                              // Update the pulse object with new video URL
                              setPulse(prev => prev ? { ...prev, video_url: j.data.url } : prev);
                              setUploadDone(true);
                              setTimeout(() => setUploadDone(false), 3000);
                            }
                          } catch (e) { console.error(e); }
                          setUploading(false);
                        }}
                        disabled={uploading}
                        style={{
                          background: "#3A7D44",
                          color: "#F5F0E8",
                          border: "none",
                          borderRadius: 8,
                          padding: "10px 24px",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: uploading ? "not-allowed" : "pointer",
                          opacity: uploading ? 0.7 : 1,
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                        }}
                      >
                        <span>☁️</span> {uploading ? "Saving..." : uploadDone ? "Saved to Server ✓" : "Save to Server"}
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => { stopCamera(); setRecordedUrl(null); setRecordedBlob(null); }}
                    style={{
                      background: "none",
                      border: "1px solid #3A1A1A",
                      borderRadius: 7,
                      color: "#884444",
                      padding: "8px 14px",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Stop Camera
                  </button>
                </div>

                {recordedUrl && (
                  <div style={{
                    background: "#1A2C1E",
                    border: "1px solid #3A7D4444",
                    borderRadius: 8,
                    padding: "14px 18px",
                    marginTop: 12,
                    fontSize: 13,
                    color: "#A8A08C",
                    lineHeight: 1.6,
                  }}>
                    <span style={{ color: "#7CB68A", fontWeight: 600 }}>Recording complete.</span> Download your video above, then upload it to Loom or YouTube and paste the link in the &ldquo;External Video URL&rdquo; field below. Or mark this pulse ready as-is.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* External video URL */}
      <div style={cardBase}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "#F5F0E8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 14 }}>
          External Video URL
        </h2>
        <div style={{ fontSize: 12, color: "#A8A08C", marginBottom: 10 }}>
          Paste a Loom, YouTube, or other video link after uploading your recording.
        </div>
        <input
          type="url"
          defaultValue={pulse.video_url ?? ""}
          onBlur={e => {
            const val = e.target.value.trim();
            if (val !== (pulse.video_url ?? "")) {
              patch({ video_url: val || null });
            }
          }}
          placeholder="https://loom.com/share/..."
          style={{ width: "100%" }}
        />
      </div>

      {/* Action buttons */}
      <div style={{
        ...cardBase,
        display: "flex",
        gap: 12,
        alignItems: "center",
        flexWrap: "wrap",
        padding: "20px 24px",
      }}>
        <button
          onClick={() => patch({ script_text: script, status: "draft" })}
          disabled={saving}
          style={{
            background: "#2A4A38",
            color: "#F5F0E8",
            border: "1px solid #3A7D44",
            borderRadius: 8,
            padding: "11px 24px",
            fontSize: 14,
            fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          Save Draft
        </button>

        <button
          onClick={() => patch({ script_text: script, status: "ready" })}
          disabled={saving}
          style={{
            background: "#3A7D44",
            color: "#F5F0E8",
            border: "none",
            borderRadius: 8,
            padding: "11px 24px",
            fontSize: 14,
            fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          Mark Ready
        </button>

        {!confirmSend ? (
          <button
            onClick={() => setConfirmSend(true)}
            disabled={saving}
            style={{
              background: "#4A90D9",
              color: "#F5F0E8",
              border: "none",
              borderRadius: 8,
              padding: "11px 24px",
              fontSize: 14,
              fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            Send to GP
          </button>
        ) : (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ color: "#A8A08C", fontSize: 13 }}>Confirm send?</span>
            <button
              onClick={() => { patch({ script_text: script, status: "sent" }); setConfirmSend(false); }}
              style={{ background: "#4A90D9", color: "#F5F0E8", border: "none", borderRadius: 7, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              Yes, Send
            </button>
            <button
              onClick={() => setConfirmSend(false)}
              style={{ background: "#1E3328", color: "#A8A08C", border: "1px solid #2A4A38", borderRadius: 7, padding: "8px 16px", fontSize: 13, cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        )}

        {saved && (
          <span style={{ color: "#7CB68A", fontSize: 13, display: "flex", alignItems: "center", gap: 5 }}>
            <span>✓</span> Saved
          </span>
        )}

        <div style={{ flex: 1 }} />

        <Link
          href={`/dashboard/gps/${pulse.gp_id}`}
          style={{ color: "#A8A08C", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}
        >
          View GP Profile →
        </Link>
      </div>

      <style>{`
        @keyframes pulse-rec {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
