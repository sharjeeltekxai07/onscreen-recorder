import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  VideoIcon,
  SquareIcon,
  PlayIcon,
  DownloadIcon,
  TrashIcon,
  UploadIcon,
  MicIcon,
  MicOffIcon,
  CameraIcon,
  CameraOffIcon,
} from "./icons";
import "./ScreenRecorder.css";

const MAX_CONSOLE_LOGS = 100;
const CHUNK_LOG_EVERY_N = 5;
const CAMERA_PIP_SIZE = 0.2;
const CAMERA_PIP_INSET = 16;
const CAPTURE_FPS = 30;

export interface ScreenRecorderProps {
  /** Callback when recording starts */
  onRecordingStart?: () => void;
  /** Callback when recording stops */
  onRecordingStop?: (blob: Blob) => void;
  /** Callback when video is downloaded */
  onDownload?: (blob: Blob) => void;
  /** Callback when upload button is clicked - receives the video blob for custom upload handling */
  onUpload?: (blob: Blob) => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
  /** Enable/disable microphone by default */
  defaultMicEnabled?: boolean;
  /** Enable/disable camera (webcam) by default – records as PiP and a separate camera video file */
  defaultCameraEnabled?: boolean;
  /** Seconds to count down after user selects screen (3, 2, 1 then record). Set to 0 to record immediately after selection. */
  countdownSeconds?: number;
  /** Custom class name for the container */
  className?: string;
}

export const ScreenRecorder: React.FC<ScreenRecorderProps> = ({
  onRecordingStart,
  onRecordingStop,
  onDownload,
  onUpload,
  onError,
  defaultMicEnabled = true,
  defaultCameraEnabled = false,
  countdownSeconds = 3,
  className = "",
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoURL, setRecordedVideoURL] = useState<string | null>(null);
  const [recordedCameraURL, setRecordedCameraURL] = useState<string | null>(null);
  const [consoleLogs, setConsoleLogs] = useState<Array<{ message: string; type: string; timestamp: string }>>([]);
  const [micEnabled, setMicEnabled] = useState(defaultMicEnabled);
  const [cameraEnabled, setCameraEnabled] = useState(defaultCameraEnabled);
  const [hasMicPermission, setHasMicPermission] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const cameraRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const cameraChunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const recordedBlobRef = useRef<Blob | null>(null);
  const recordedCameraBlobRef = useRef<Blob | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const combinedStreamRef = useRef<MediaStream | null>(null);
  const countdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chunkCountRef = useRef(0);
  const drawLoopIdRef = useRef<number | null>(null);
  const canvasStreamRef = useRef<MediaStream | null>(null);
  const cameraPreviewRef = useRef<HTMLVideoElement>(null);

  const addLog = useCallback((message: string, type: "info" | "success" | "error" = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setConsoleLogs((prev) => {
      const next = [...prev, { message, type, timestamp }];
      return next.length > MAX_CONSOLE_LOGS ? next.slice(-MAX_CONSOLE_LOGS) : next;
    });
  }, []);

  const requestMicPermission = async (): Promise<MediaStream | null> => {
    try {
      addLog("Requesting microphone permission...", "info");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      setHasMicPermission(true);
      addLog("Microphone permission granted", "success");
      return stream;
    } catch (err) {
      const error = err as Error;
      addLog(`Microphone permission denied: ${error.message}`, "error");
      setHasMicPermission(false);
      if (onError) onError(error);
      return null;
    }
  };

  const requestCameraPermission = async (): Promise<MediaStream | null> => {
    try {
      addLog("Requesting camera permission...", "info");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      cameraStreamRef.current = stream;
      setHasCameraPermission(true);
      addLog("Camera permission granted", "success");
      return stream;
    } catch (err) {
      const error = err as Error;
      addLog(`Camera permission denied: ${error.message}`, "error");
      setHasCameraPermission(false);
      if (onError) onError(error);
      return null;
    }
  };

  const releaseAllStreams = useCallback(() => {
    if (drawLoopIdRef.current != null) {
      cancelAnimationFrame(drawLoopIdRef.current);
      drawLoopIdRef.current = null;
    }
    if (canvasStreamRef.current) {
      canvasStreamRef.current.getTracks().forEach((t) => t.stop());
      canvasStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
      setHasCameraPermission(false);
      setCameraEnabled(false);
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
      setHasMicPermission(false);
    }
    if (combinedStreamRef.current) {
      combinedStreamRef.current.getTracks().forEach((t) => t.stop());
      combinedStreamRef.current = null;
    }
  }, []);

  const compositeScreenWithCamera = useCallback(
    (screenStream: MediaStream, cameraStream: MediaStream): MediaStream => {
      const screenTrack = screenStream.getVideoTracks()[0];
      const settings = screenTrack?.getSettings();
      const w = settings?.width ?? 1920;
      const h = settings?.height ?? 1080;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return screenStream;
      const screenVideo = document.createElement("video");
      screenVideo.srcObject = new MediaStream([screenTrack]);
      screenVideo.muted = true;
      screenVideo.play().catch(() => { });
      const cameraVideo = document.createElement("video");
      cameraVideo.srcObject = cameraStream;
      cameraVideo.muted = true;
      cameraVideo.play().catch(() => { });
      const camW = Math.floor(w * CAMERA_PIP_SIZE);
      const camH = Math.floor(h * CAMERA_PIP_SIZE);
      const camX = CAMERA_PIP_INSET;
      const camY = h - camH - CAMERA_PIP_INSET;
      const draw = () => {
        if (screenVideo.readyState >= 2) {
          ctx.drawImage(screenVideo, 0, 0, w, h);
          if (cameraVideo.readyState >= 2) ctx.drawImage(cameraVideo, camX, camY, camW, camH);
        }
        drawLoopIdRef.current = requestAnimationFrame(draw);
      };
      draw();
      const stream = canvas.captureStream(CAPTURE_FPS);
      canvasStreamRef.current = stream;
      return stream;
    },
    []
  );

  const handleCameraButtonClick = useCallback(async () => {
    if (cameraEnabled) {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
        cameraStreamRef.current = null;
      }
      setCameraEnabled(false);
      setHasCameraPermission(false);
      addLog("Camera disabled", "info");
      return;
    }
    const stream = await requestCameraPermission();
    if (stream) setCameraEnabled(true);
  }, [cameraEnabled, addLog]);

  const acquireStreamAndStartCountdown = async () => {
    try {
      addLog("Requesting screen capture...", "info");

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: "screen" } as MediaTrackConstraints,
        audio: true,
      });

      screenStreamRef.current = screenStream;
      addLog("Screen selected. Starting countdown...", "success");

      let videoStream: MediaStream = screenStream;
      if (cameraEnabled) {
        let camStream = cameraStreamRef.current;
        if (!camStream) camStream = await requestCameraPermission();
        if (camStream) {
          videoStream = compositeScreenWithCamera(screenStream, camStream);
          addLog("Camera added as picture-in-picture", "success");
        }
      }

      const audioTracks: MediaStreamTrack[] = [];
      if (screenStream.getAudioTracks().length > 0) audioTracks.push(...screenStream.getAudioTracks());

      // Request microphone if enabled
      if (micEnabled) {
        const micStream = await requestMicPermission();
        if (micStream) {
          const screenAudioTracks = screenStream.getAudioTracks();
          const micAudioTracks = micStream.getAudioTracks();
          if (screenAudioTracks.length > 0 && micAudioTracks.length > 0) {
            try {
              const audioContext = new AudioContext();
              const screenAudioSource = audioContext.createMediaStreamSource(new MediaStream(screenAudioTracks));
              const micAudioSource = audioContext.createMediaStreamSource(micStream);
              const destination = audioContext.createMediaStreamDestination();
              screenAudioSource.connect(destination);
              micAudioSource.connect(destination);
              audioTracks.length = 0;
              audioTracks.push(...destination.stream.getAudioTracks());
              addLog("Screen and microphone audio combined", "success");
            } catch (audioErr) {
              const err = audioErr as Error;
              addLog(`Audio mixing failed: ${err.message}, using microphone only`, "info");
              audioTracks.length = 0;
              audioTracks.push(...micAudioTracks);
            }
          } else if (micAudioTracks.length > 0) {
            audioTracks.length = 0;
            audioTracks.push(...micAudioTracks);
            addLog("Using microphone audio only", "info");
          }
        } else {
          addLog("Recording without microphone audio", "info");
        }
      }

      const combinedStream =
        audioTracks.length > 0
          ? new MediaStream([...videoStream.getVideoTracks(), ...audioTracks])
          : new MediaStream(videoStream.getVideoTracks());
      combinedStreamRef.current = combinedStream;
      const seconds = Math.max(0, Math.min(10, countdownSeconds ?? 0));

      if (seconds > 0) {
        addLog(`Recording starts in ${seconds}...`, "info");
        setIsPreparing(true);
        setCountdown(seconds);
      } else {
        startMediaRecorderWithStream();
      }
    } catch (err) {
      const error = err as Error;
      addLog(`Error: ${error.message}`, "error");
      if (onError) onError(error);
      releaseAllStreams();
      setIsPreparing(false);
      setCountdown(null);
    }
  };

  const startMediaRecorderWithStream = () => {
    const stream = combinedStreamRef.current;
    const screenStream = screenStreamRef.current;
    if (!stream || !screenStream) {
      addLog("No stream available to record", "error");
      releaseAllStreams();
      setIsPreparing(false);
      setCountdown(null);
      return;
    }

    chunksRef.current = [];
    chunkCountRef.current = 0;
    mediaRecorderRef.current = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp8,opus",
    });

    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
        chunkCountRef.current += 1;
        if (chunkCountRef.current === 1 || chunkCountRef.current % CHUNK_LOG_EVERY_N === 0) {
          addLog(`Data chunk ${chunkCountRef.current}: ${(e.data.size / 1024).toFixed(1)} KB`, "info");
        }
      }
    };

    const camStream = cameraStreamRef.current;
    if (camStream && camStream.getVideoTracks().length > 0) {
      cameraChunksRef.current = [];
      cameraRecorderRef.current = new MediaRecorder(camStream, { mimeType: "video/webm;codecs=vp8" });
      cameraRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) cameraChunksRef.current.push(e.data);
      };
      cameraRecorderRef.current.onstop = () => {
        const camBlob = new Blob(cameraChunksRef.current, { type: "video/webm" });
        recordedCameraBlobRef.current = camBlob;
        setRecordedCameraURL(URL.createObjectURL(camBlob));
        addLog(`Camera video ready: ${(camBlob.size / 1024).toFixed(1)} KB`, "success");
      };
      cameraRecorderRef.current.start(1000);
    }

    mediaRecorderRef.current.onstop = () => {
      addLog("Recording stopped, processing video...", "info");
      if (cameraRecorderRef.current?.state === "recording") {
        cameraRecorderRef.current.stop();
      }
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setRecordedVideoURL(url);
      recordedBlobRef.current = blob;
      addLog(`Video ready! Size: ${(blob.size / 1024 / 1024).toFixed(2)} MB`, "success");
      releaseAllStreams();
      if (onRecordingStop) onRecordingStop(blob);
    };

    mediaRecorderRef.current.onerror = () => {
      addLog("Recording error – stopping and releasing microphone", "error");
      releaseAllStreams();
      setIsRecording(false);
      if (onError) onError(new Error("MediaRecorder error"));
    };

    screenStream.getVideoTracks().forEach((track) => {
      track.onended = () => {
        addLog("Screen sharing stopped by browser – releasing microphone", "info");
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
      };
    });

    mediaRecorderRef.current.start(1000);
    setIsRecording(true);
    setIsPreparing(false);
    setCountdown(null);
    combinedStreamRef.current = null;
    addLog("Recording in progress...", "success");
    if (onRecordingStart) onRecordingStart();
  };

  const startRecording = useCallback(() => {
    acquireStreamAndStartCountdown();
  }, []);

  const cancelCountdown = useCallback(() => {
    if (countdownTimeoutRef.current) {
      clearTimeout(countdownTimeoutRef.current);
      countdownTimeoutRef.current = null;
    }
    releaseAllStreams();
    setIsPreparing(false);
    setCountdown(null);
    addLog("Countdown cancelled", "info");
  }, [releaseAllStreams, addLog]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      if (cameraRecorderRef.current?.state === "recording") {
        cameraRecorderRef.current.stop();
      }
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      addLog("Stop recording requested", "info");
    }
  }, [isRecording, addLog]);

  const downloadVideo = useCallback(() => {
    if (recordedVideoURL && recordedBlobRef.current) {
      const a = document.createElement("a");
      a.href = recordedVideoURL;
      a.download = `screen-recording-${Date.now()}.webm`;
      a.click();
      addLog("Video download initiated", "success");
      if (onDownload && recordedBlobRef.current) {
        onDownload(recordedBlobRef.current);
      }
    }
  }, [recordedVideoURL, onDownload, addLog]);

  const downloadCameraVideo = useCallback(() => {
    if (recordedCameraURL && recordedCameraBlobRef.current) {
      const a = document.createElement("a");
      a.href = recordedCameraURL;
      a.download = `camera-recording-${Date.now()}.webm`;
      a.click();
      addLog("Camera video download initiated", "success");
    }
  }, [recordedCameraURL, addLog]);

  const clearRecording = useCallback(() => {
    if (recordedVideoURL) {
      URL.revokeObjectURL(recordedVideoURL);
      setRecordedVideoURL(null);
      recordedBlobRef.current = null;
    }
    if (recordedCameraURL) {
      URL.revokeObjectURL(recordedCameraURL);
      setRecordedCameraURL(null);
      recordedCameraBlobRef.current = null;
    }
    addLog("Recording cleared", "info");
  }, [recordedVideoURL, recordedCameraURL, addLog]);

  const handleUpload = useCallback(() => {
    if (!recordedBlobRef.current) {
      addLog("No video to upload", "error");
      return;
    }

    addLog("Upload button clicked", "info");
    if (onUpload) {
      onUpload(recordedBlobRef.current);
    } else {
      addLog("No upload handler provided. Implement onUpload prop to handle uploads.", "info");
    }
  }, [onUpload, addLog]);

  const clearConsole = useCallback(() => {
    setConsoleLogs([]);
  }, []);

  useEffect(() => {
    addLog("Screen Recorder initialized", "success");
    return () => {
      if (countdownTimeoutRef.current) clearTimeout(countdownTimeoutRef.current);
    };
  }, [addLog]);

  useEffect(() => {
    if (countdown === 0) {
      setCountdown(null);
      startMediaRecorderWithStream();
      return;
    }
    if (countdown === null || countdown <= 0) return;
    countdownTimeoutRef.current = setTimeout(() => {
      setCountdown((prev) => (prev !== null && prev > 0 ? prev - 1 : null));
      countdownTimeoutRef.current = null;
    }, 1000);
    return () => {
      if (countdownTimeoutRef.current) {
        clearTimeout(countdownTimeoutRef.current);
        countdownTimeoutRef.current = null;
      }
    };
    // startMediaRecorderWithStream is stable (refs/state); only run when countdown changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  useEffect(() => {
    const video = cameraPreviewRef.current;
    const stream = cameraStreamRef.current;
    if (video && stream && cameraEnabled && hasCameraPermission) {
      video.srcObject = stream;
      video.play().catch(() => { });
    } else if (video) {
      video.srcObject = null;
    }
  }, [cameraEnabled, hasCameraPermission]);

  useEffect(() => {
    return () => {
      if (recordedVideoURL) URL.revokeObjectURL(recordedVideoURL);
      if (recordedCameraURL) URL.revokeObjectURL(recordedCameraURL);
    };
  }, [recordedVideoURL, recordedCameraURL]);

  return (
    <div className={`onscreen-recorder-container ${className}`}>
      {isPreparing && countdown !== null && (
        <div
          className="onscreen-recorder-countdown-overlay"
          role="dialog"
          aria-modal="true"
          aria-live="polite"
          aria-label={`Recording starts in ${countdown} seconds`}
        >
          <div className="onscreen-recorder-countdown-backdrop" />
          <div className="onscreen-recorder-countdown-content">
            <p className="onscreen-recorder-countdown-label">
              {countdown > 0 ? "Recording starts in" : ""}
            </p>
            <div className="onscreen-recorder-countdown-number" key={countdown}>
              {countdown > 0 ? countdown : "Go!"}
            </div>
            <p className="onscreen-recorder-countdown-hint">Screen selected – get ready</p>
            <button
              type="button"
              onClick={cancelCountdown}
              className="onscreen-recorder-button onscreen-recorder-button-secondary onscreen-recorder-countdown-cancel"
              aria-label="Cancel countdown"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      <div className="onscreen-recorder-wrapper">
        <div className="onscreen-recorder-header">
          <h1 className="onscreen-recorder-title">
            <VideoIcon className="onscreen-recorder-title-icon" size={40} />
            Screen Recorder
          </h1>
          <p className="onscreen-recorder-subtitle">Record your screen and view the playback</p>
        </div>

        <div className="onscreen-recorder-grid">
          {/* Recording Controls & Preview */}
          <div className="onscreen-recorder-card">
            <h2 className="onscreen-recorder-card-title">Recording</h2>

            <div className="onscreen-recorder-controls">
              {/* Control Buttons */}
              <div className="onscreen-recorder-button-group">
                {!isRecording && !isPreparing ? (
                  <>
                    <button onClick={startRecording} className="onscreen-recorder-button onscreen-recorder-button-primary">
                      <PlayIcon className="onscreen-recorder-button-icon" size={20} />
                      Start Recording
                    </button>
                    <button
                      onClick={() => setMicEnabled(!micEnabled)}
                      className={`onscreen-recorder-button ${micEnabled ? "onscreen-recorder-button-success" : "onscreen-recorder-button-secondary"}`}
                      title={micEnabled ? "Microphone on" : "Microphone off"}
                      type="button"
                    >
                      {micEnabled ? <MicIcon className="onscreen-recorder-button-icon" size={20} /> : <MicOffIcon className="onscreen-recorder-button-icon" size={20} />}
                    </button>
                    <button
                      onClick={handleCameraButtonClick}
                      className={`onscreen-recorder-button ${cameraEnabled ? "onscreen-recorder-button-success" : "onscreen-recorder-button-secondary"}`}
                      title={cameraEnabled ? "Camera on (PiP + separate file)" : "Enable camera – record as PiP and separate video"}
                      type="button"
                    >
                      {cameraEnabled ? <CameraIcon className="onscreen-recorder-button-icon" size={20} /> : <CameraOffIcon className="onscreen-recorder-button-icon" size={20} />}
                      <span className="onscreen-recorder-button-label">{cameraEnabled ? "Camera on" : "Camera"}</span>
                    </button>
                  </>
                ) : isPreparing ? (
                  <div className="onscreen-recorder-preparing-indicator">
                    <div className="onscreen-recorder-preparing-dot" />
                    <p className="onscreen-recorder-preparing-text">Preparing…</p>
                  </div>
                ) : (
                  <button onClick={stopRecording} className="onscreen-recorder-button onscreen-recorder-button-danger onscreen-recorder-recording">
                    <SquareIcon className="onscreen-recorder-button-icon" size={20} />
                    Stop Recording
                  </button>
                )}
              </div>

              {/* Camera live preview (when enabled, not recording) */}
              {!isRecording && !isPreparing && cameraEnabled && hasCameraPermission && (
                <div className="onscreen-recorder-camera-preview">
                  <p className="onscreen-recorder-camera-preview-label">Camera preview</p>
                  <video
                    ref={cameraPreviewRef}
                    className="onscreen-recorder-camera-preview-video"
                    muted
                    playsInline
                    aria-label="Camera preview"
                  />
                </div>
              )}

              {/* Screen + PiP recorded video */}
              {recordedVideoURL && (
                <div className="onscreen-recorder-video-section">
                  <h3 className="onscreen-recorder-video-title">Screen recording</h3>
                  <video ref={videoRef} src={recordedVideoURL} controls className="onscreen-recorder-video" />

                  <div className="onscreen-recorder-button-group">
                    <button onClick={downloadVideo} className="onscreen-recorder-button onscreen-recorder-button-success" type="button">
                      <DownloadIcon className="onscreen-recorder-button-icon" size={16} />
                      Download screen
                    </button>
                    {recordedCameraURL && (
                      <button onClick={downloadCameraVideo} className="onscreen-recorder-button onscreen-recorder-button-success" type="button">
                        <CameraIcon className="onscreen-recorder-button-icon" size={16} />
                        Download camera
                      </button>
                    )}
                    {onUpload && (
                      <button onClick={handleUpload} className="onscreen-recorder-button onscreen-recorder-button-purple" type="button">
                        <UploadIcon className="onscreen-recorder-button-icon" size={16} />
                        Upload
                      </button>
                    )}
                    <button onClick={clearRecording} className="onscreen-recorder-button onscreen-recorder-button-secondary" type="button">
                      <TrashIcon className="onscreen-recorder-button-icon" size={16} />
                      Clear
                    </button>
                  </div>
                </div>
              )}

              {/* Camera-only recorded video */}
              {recordedCameraURL && (
                <div className="onscreen-recorder-video-section onscreen-recorder-camera-section">
                  <h3 className="onscreen-recorder-video-title">Camera recording</h3>
                  <video ref={cameraVideoRef} src={recordedCameraURL} controls className="onscreen-recorder-video" />
                </div>
              )}

              {!recordedVideoURL && !isRecording && !isPreparing && (
                <div className="onscreen-recorder-empty-state">
                  <VideoIcon className="onscreen-recorder-empty-icon" size={64} />
                  <p className="onscreen-recorder-empty-text">No recording yet</p>
                  <p className="onscreen-recorder-empty-subtext">Click "Start Recording" to begin</p>
                </div>
              )}

              {isRecording && (
                <div className="onscreen-recorder-recording-indicator">
                  <div className="onscreen-recorder-recording-dot" />
                  <p className="onscreen-recorder-recording-text">Recording…</p>
                  <p className="onscreen-recorder-recording-subtext">
                    {[micEnabled && hasMicPermission && "🎤 Mic", cameraEnabled && hasCameraPermission && "📷 Camera"].filter(Boolean).join(" · ") || "Screen only"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Console Logs */}
          <div className="onscreen-recorder-card">
            <div className="onscreen-recorder-console-header">
              <h2 className="onscreen-recorder-card-title">Console</h2>
              <button onClick={clearConsole} className="onscreen-recorder-button-small">
                Clear
              </button>
            </div>

            <div className="onscreen-recorder-console">
              {consoleLogs.length === 0 ? (
                <p className="onscreen-recorder-console-empty">Console logs will appear here...</p>
              ) : (
                <div className="onscreen-recorder-logs">
                  {consoleLogs.map((log, index) => (
                    <div key={index} className="onscreen-recorder-log">
                      <span className="onscreen-recorder-log-timestamp">[{log.timestamp}]</span>
                      <span
                        className={`onscreen-recorder-log-icon ${log.type === "error"
                          ? "onscreen-recorder-log-icon-error"
                          : log.type === "success"
                            ? "onscreen-recorder-log-icon-success"
                            : "onscreen-recorder-log-icon-info"
                          }`}
                      >
                        {log.type === "error" ? "❌" : log.type === "success" ? "✓" : "ℹ"}
                      </span>
                      <span
                        className={`onscreen-recorder-log-message ${log.type === "error"
                          ? "onscreen-recorder-log-message-error"
                          : log.type === "success"
                            ? "onscreen-recorder-log-message-success"
                            : "onscreen-recorder-log-message-info"
                          }`}
                      >
                        {log.message}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
