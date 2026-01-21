import React, { useState, useRef, useEffect } from "react";
import {
  VideoIcon,
  SquareIcon,
  PlayIcon,
  DownloadIcon,
  TrashIcon,
  UploadIcon,
  MicIcon,
  MicOffIcon,
} from "./icons";
import "./ScreenRecorder.css";

export interface ScreenRecorderProps {
  /** API endpoint for uploading recordings */
  apiEndpoint?: string;
  /** Callback when recording starts */
  onRecordingStart?: () => void;
  /** Callback when recording stops */
  onRecordingStop?: (blob: Blob) => void;
  /** Callback when video is downloaded */
  onDownload?: (blob: Blob) => void;
  /** Callback when video is uploaded */
  onUpload?: (response: any) => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
  /** Enable/disable microphone by default */
  defaultMicEnabled?: boolean;
  /** Custom class name for the container */
  className?: string;
}

export const ScreenRecorder: React.FC<ScreenRecorderProps> = ({
  apiEndpoint = "https://httpbin.org/post",
  onRecordingStart,
  onRecordingStop,
  onDownload,
  onUpload,
  onError,
  defaultMicEnabled = true,
  className = "",
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoURL, setRecordedVideoURL] = useState<string | null>(null);
  const [consoleLogs, setConsoleLogs] = useState<Array<{ message: string; type: string; timestamp: string }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [currentApiEndpoint, setCurrentApiEndpoint] = useState(apiEndpoint);
  const [micEnabled, setMicEnabled] = useState(defaultMicEnabled);
  const [hasMicPermission, setHasMicPermission] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const recordedBlobRef = useRef<Blob | null>(null);
  const toastTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const micStreamRef = useRef<MediaStream | null>(null);

  const addLog = (message: string, type: "info" | "success" | "error" = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setConsoleLogs((prev) => [...prev, { message, type, timestamp }]);
  };

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

  const startRecording = async () => {
    try {
      addLog("Requesting screen capture...", "info");

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: "screen" } as any,
        audio: true,
      });

      addLog("Screen capture started successfully", "success");

      let combinedStream = screenStream;

      // Request microphone if enabled
      if (micEnabled) {
        const micStream = await requestMicPermission();
        if (micStream) {
          const screenAudioTracks = screenStream.getAudioTracks();
          const micAudioTracks = micStream.getAudioTracks();
          const videoTracks = screenStream.getVideoTracks();

          if (screenAudioTracks.length > 0 && micAudioTracks.length > 0) {
            // Both screen and mic have audio - mix them
            try {
              const audioContext = new AudioContext();
              const screenAudioSource = audioContext.createMediaStreamSource(new MediaStream(screenAudioTracks));
              const micAudioSource = audioContext.createMediaStreamSource(micStream);
              const destination = audioContext.createMediaStreamDestination();

              screenAudioSource.connect(destination);
              micAudioSource.connect(destination);

              combinedStream = new MediaStream([...videoTracks, ...destination.stream.getAudioTracks()]);
              addLog("Screen and microphone audio combined", "success");
            } catch (audioErr) {
              const error = audioErr as Error;
              addLog(`Audio mixing failed: ${error.message}, using microphone only`, "info");
              combinedStream = new MediaStream([...videoTracks, ...micAudioTracks]);
            }
          } else if (micAudioTracks.length > 0) {
            combinedStream = new MediaStream([...videoTracks, ...micAudioTracks]);
            addLog("Using microphone audio only", "info");
          } else if (screenAudioTracks.length > 0) {
            combinedStream = new MediaStream([...videoTracks, ...screenAudioTracks]);
            addLog("Using screen audio only", "info");
          } else {
            combinedStream = new MediaStream(videoTracks);
            addLog("Recording video only, no audio available", "info");
          }
        } else {
          addLog("Recording without microphone audio", "info");
        }
      }

      mediaRecorderRef.current = new MediaRecorder(combinedStream, {
        mimeType: "video/webm;codecs=vp8,opus",
      });

      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          addLog(`Data chunk received: ${(e.data.size / 1024).toFixed(2)} KB`, "info");
        }
      };

      mediaRecorderRef.current.onstop = () => {
        addLog("Recording stopped, processing video...", "info");
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setRecordedVideoURL(url);
        recordedBlobRef.current = blob;
        addLog(`Video ready! Size: ${(blob.size / 1024 / 1024).toFixed(2)} MB`, "success");

        screenStream.getTracks().forEach((track) => track.stop());
        if (micStreamRef.current) {
          micStreamRef.current.getTracks().forEach((track) => track.stop());
        }

        if (onRecordingStop) {
          onRecordingStop(blob);
        }
      };

      mediaRecorderRef.current.start(1000);
      setIsRecording(true);
      addLog("Recording in progress...", "success");

      if (onRecordingStart) {
        onRecordingStart();
      }
    } catch (err) {
      const error = err as Error;
      addLog(`Error: ${error.message}`, "error");
      if (onError) onError(error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      addLog("Stop recording requested", "info");
    }
  };

  const downloadVideo = () => {
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
  };

  const clearRecording = () => {
    if (recordedVideoURL) {
      URL.revokeObjectURL(recordedVideoURL);
      setRecordedVideoURL(null);
      recordedBlobRef.current = null;
      addLog("Recording cleared", "info");
    }
  };

  const uploadToAPI = async () => {
    if (!recordedBlobRef.current) {
      addLog("No video to upload", "error");
      return;
    }

    setIsUploading(true);
    addLog(`Starting upload to: ${currentApiEndpoint}`, "info");

    try {
      const formData = new FormData();
      const filename = `screen-recording-${Date.now()}.webm`;
      formData.append("video", recordedBlobRef.current, filename);
      formData.append("timestamp", new Date().toISOString());
      formData.append("size", recordedBlobRef.current.size.toString());

      addLog("Sending request...", "info");

      const response = await fetch(currentApiEndpoint, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        addLog(`Upload successful! Status: ${response.status}`, "success");
        addLog(`Response: ${JSON.stringify(result).substring(0, 200)}...`, "success");
        if (onUpload) {
          onUpload(result);
        }
      } else {
        addLog(`Upload failed! Status: ${response.status}`, "error");
        if (onError) {
          onError(new Error(`Upload failed with status: ${response.status}`));
        }
      }
    } catch (error) {
      const err = error as Error;
      addLog(`Upload error: ${err.message}`, "error");
      if (onError) {
        onError(err);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const clearConsole = () => {
    setConsoleLogs([]);
  };

  useEffect(() => {
    addLog("Screen Recorder initialized", "success");
    return () => {
      toastTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup recorded video URL on unmount
  useEffect(() => {
    return () => {
      if (recordedVideoURL) {
        URL.revokeObjectURL(recordedVideoURL);
      }
    };
  }, [recordedVideoURL]);

  useEffect(() => {
    setCurrentApiEndpoint(apiEndpoint);
  }, [apiEndpoint]);

  return (
    <div className={`onscreen-recorder-container ${className}`}>
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
              {/* API Endpoint Input */}
              <div className="onscreen-recorder-input-group">
                <label className="onscreen-recorder-label">API Endpoint</label>
                <input
                  type="text"
                  value={currentApiEndpoint}
                  onChange={(e) => setCurrentApiEndpoint(e.target.value)}
                  placeholder="https://your-api.com/upload"
                  className="onscreen-recorder-input"
                  disabled={isRecording || isUploading}
                />
              </div>

              {/* Control Buttons */}
              <div className="onscreen-recorder-button-group">
                {!isRecording ? (
                  <>
                    <button onClick={startRecording} className="onscreen-recorder-button onscreen-recorder-button-primary">
                      <PlayIcon className="onscreen-recorder-button-icon" size={20} />
                      Start Recording
                    </button>
                    <button
                      onClick={() => setMicEnabled(!micEnabled)}
                      className={`onscreen-recorder-button ${micEnabled ? "onscreen-recorder-button-success" : "onscreen-recorder-button-secondary"}`}
                      title={micEnabled ? "Microphone Enabled" : "Microphone Disabled"}
                    >
                      {micEnabled ? <MicIcon className="onscreen-recorder-button-icon" size={20} /> : <MicOffIcon className="onscreen-recorder-button-icon" size={20} />}
                    </button>
                  </>
                ) : (
                  <button onClick={stopRecording} className="onscreen-recorder-button onscreen-recorder-button-danger onscreen-recorder-recording">
                    <SquareIcon className="onscreen-recorder-button-icon" size={20} />
                    Stop Recording
                  </button>
                )}
              </div>

              {/* Video Preview */}
              {recordedVideoURL && (
                <div className="onscreen-recorder-video-section">
                  <h3 className="onscreen-recorder-video-title">Recorded Video</h3>
                  <video ref={videoRef} src={recordedVideoURL} controls className="onscreen-recorder-video" />

                  <div className="onscreen-recorder-button-group">
                    <button onClick={downloadVideo} className="onscreen-recorder-button onscreen-recorder-button-success">
                      <DownloadIcon className="onscreen-recorder-button-icon" size={16} />
                      Download
                    </button>
                    <button
                      onClick={uploadToAPI}
                      disabled={isUploading}
                      className={`onscreen-recorder-button onscreen-recorder-button-purple ${isUploading ? "onscreen-recorder-button-disabled" : ""}`}
                    >
                      <UploadIcon className="onscreen-recorder-button-icon" size={16} />
                      {isUploading ? "Uploading..." : "Upload"}
                    </button>
                    <button onClick={clearRecording} className="onscreen-recorder-button onscreen-recorder-button-secondary">
                      <TrashIcon className="onscreen-recorder-button-icon" size={16} />
                      Clear
                    </button>
                  </div>
                </div>
              )}

              {!recordedVideoURL && !isRecording && (
                <div className="onscreen-recorder-empty-state">
                  <VideoIcon className="onscreen-recorder-empty-icon" size={64} />
                  <p className="onscreen-recorder-empty-text">No recording yet</p>
                  <p className="onscreen-recorder-empty-subtext">Click "Start Recording" to begin</p>
                </div>
              )}

              {isRecording && (
                <div className="onscreen-recorder-recording-indicator">
                  <div className="onscreen-recorder-recording-dot"></div>
                  <p className="onscreen-recorder-recording-text">Recording in Progress...</p>
                  <p className="onscreen-recorder-recording-subtext">
                    {micEnabled && hasMicPermission ? "🎤 Microphone Active" : "🔇 Screen Audio Only"}
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
