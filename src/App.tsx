import React, { useState, useRef, useEffect } from "react";
import {
  VideoIcon,
  SquareIcon,
  PlayIcon,
  DownloadIcon,
  TrashIcon,
  MicIcon,
  MicOffIcon,
} from "../lib/components/icons";
import {
  addLog as addLogUtil,
  showToast as showToastUtil,
  showRecordingToasts,
  requestMicPermission,
  combineAudioStreams,
  downloadVideo,
  clearRecording,
  type ConsoleLog,
  type Toast,
} from "./utils/recordingUtils";

const OnScreenRecorder: React.FC = () => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedVideoURL, setRecordedVideoURL] = useState<string | null>(null);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const [showConsole, setShowConsole] = useState<boolean>(false);
  const [, setToasts] = useState<Toast[]>([]);
  const [micEnabled, setMicEnabled] = useState<boolean>(true);
  const [hasMicPermission, setHasMicPermission] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isPreparing, setIsPreparing] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const recordedBlobRef = useRef<Blob | null>(null);
  const toastTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const micStreamRef = useRef<MediaStream | null>(null);
  const countdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Wrapper functions for utilities
  const addLog = (message: string, type: "info" | "success" | "error" = "info") => {
    addLogUtil(setConsoleLogs, message, type);
  };

  const showToast = (message: string, type: "info" | "success" | "error" = "info") => {
    showToastUtil(setToasts, toastTimeoutsRef, message, type);
  };

  const startCountdown = (): void => {
    setIsPreparing(true);
    setCountdown(3);
    addLog("Preparing to record...", "info");
  };

  const actualStartRecording = async (): Promise<void> => {
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
        const micStream = await requestMicPermission(
          setHasMicPermission,
          micStreamRef,
          addLog,
          showToast
        );
        if (micStream) {
          try {
            combinedStream = combineAudioStreams(screenStream, micStream);
            addLog("Screen and microphone audio combined", "success");
          } catch (audioErr) {
            const error = audioErr as Error;
            addLog(`Audio mixing failed: ${error.message}, using microphone only`, "info");
            const videoTracks = screenStream.getVideoTracks();
            const micAudioTracks = micStream.getAudioTracks();
            combinedStream = new MediaStream([...videoTracks, ...micAudioTracks]);
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
      };

      mediaRecorderRef.current.start(1000);
      setIsRecording(true);
      addLog("Recording in progress...", "success");

      showRecordingToasts(setToasts, toastTimeoutsRef, micEnabled);
    } catch (err) {
      const error = err as Error;
      addLog(`Error: ${error.message}`, "error");
      showToast(`❌ Error: ${error.message}`, "error");
      console.error("Error accessing screen:", err);
    } finally {
      setIsPreparing(false);
      setCountdown(null);
    }
  };

  const startRecording = (): void => {
    startCountdown();
  };

  const stopRecording = (): void => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      addLog("Stop recording requested", "info");
    }
  };

  const handleDownloadVideo = (): void => {
    downloadVideo(recordedVideoURL, addLog);
  };

  const handleClearRecording = (): void => {
    clearRecording(recordedVideoURL, setRecordedVideoURL, recordedBlobRef, addLog);
  };

  const clearConsole = (): void => {
    setConsoleLogs([]);
  };

  useEffect(() => {
    addLog("Screen Recorder initialized", "success");
    return () => {
      if (recordedVideoURL) {
        URL.revokeObjectURL(recordedVideoURL);
      }
      toastTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      if (countdownTimeoutRef.current) {
        clearTimeout(countdownTimeoutRef.current);
      }
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

  // Handle countdown timer
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      countdownTimeoutRef.current = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      // Countdown finished, start actual recording
      setCountdown(null);
      actualStartRecording();
    }

    return () => {
      if (countdownTimeoutRef.current) {
        clearTimeout(countdownTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className={`grid gap-4 sm:gap-6 ${showConsole ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
          {/* Main Recording Card */}
          <div className="bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 border border-slate-700/50">
            <div className="space-y-5 sm:space-y-6">
              {/* Control Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {!isRecording && !isPreparing ? (
                  <>
                    <button
                      onClick={startRecording}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <PlayIcon size={20} />
                      <span>Start Recording</span>
                    </button>
                    <button
                      onClick={() => setMicEnabled(!micEnabled)}
                      className={`${micEnabled
                        ? "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-emerald-600/30 hover:shadow-emerald-600/50"
                        : "bg-slate-700 hover:bg-slate-600 shadow-slate-700/30"
                        } text-white font-semibold py-3.5 px-4 sm:px-5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98]`}
                      title={micEnabled ? "Microphone Enabled" : "Microphone Disabled"}
                    >
                      {micEnabled ? <MicIcon size={20} /> : <MicOffIcon size={20} />}
                    </button>
                    {consoleLogs.length > 0 && (
                      <button
                        onClick={() => setShowConsole(!showConsole)}
                        className="bg-slate-700 hover:bg-slate-600 text-white font-medium py-3.5 px-4 sm:px-5 rounded-xl transition-all duration-200 shadow-lg hover:scale-[1.02] active:scale-[0.98] text-sm"
                        title={showConsole ? "Hide Console" : "Show Console"}
                      >
                        {showConsole ? "Hide" : "Show"} Console
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg shadow-red-600/30 hover:shadow-red-600/50 animate-pulse hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <SquareIcon size={20} />
                    <span>Stop Recording</span>
                  </button>
                )}
              </div>

              {/* Video Preview */}
              {recordedVideoURL && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="relative rounded-xl overflow-hidden bg-black shadow-2xl">
                    <video
                      ref={videoRef}
                      src={recordedVideoURL}
                      controls
                      className="w-full aspect-video"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleDownloadVideo}
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/50 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <DownloadIcon size={18} />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={handleClearRecording}
                      className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <TrashIcon size={18} />
                      <span>Clear</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Countdown Overlay */}
              {isPreparing && countdown !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                  <div className="text-center">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`w-48 h-48 rounded-full border-8 transition-all duration-300 ${countdown === 3 ? "border-blue-500 animate-pulse" :
                          countdown === 2 ? "border-yellow-500 animate-pulse" :
                            "border-green-500 animate-pulse"
                          }`}></div>
                      </div>
                      <div className="relative flex items-center justify-center w-48 h-48">
                        <span className={`text-9xl font-bold transition-all duration-300 ${countdown === 3 ? "text-blue-400" :
                          countdown === 2 ? "text-yellow-400" :
                            "text-green-400"
                          }`}>
                          {countdown}
                        </span>
                      </div>
                    </div>
                    <p className="mt-8 text-xl text-slate-300 font-semibold">Preparing to record...</p>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!recordedVideoURL && !isRecording && !isPreparing && (
                <div className="bg-slate-700/50 rounded-xl p-8 sm:p-12 text-center border-2 border-dashed border-slate-600/50">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-slate-800/50 rounded-full">
                      <VideoIcon className="text-slate-400" size={56} />
                    </div>
                  </div>
                  <p className="text-slate-300 font-medium text-lg mb-1">No recording yet</p>
                  <p className="text-slate-500 text-sm">Click "Start Recording" to begin capturing your screen</p>
                </div>
              )}

              {/* Recording Indicator */}
              {isRecording && (
                <div className="bg-red-950/40 border-2 border-red-600/50 rounded-xl p-6 text-center backdrop-blur-sm animate-in fade-in duration-300">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <div className="relative">
                      <div className="w-3 h-3 bg-red-600 rounded-full animate-ping absolute"></div>
                      <div className="w-3 h-3 bg-red-600 rounded-full relative"></div>
                    </div>
                    <p className="text-red-400 font-semibold text-lg">Recording in Progress</p>
                  </div>
                  <p className="text-red-300/80 text-sm">
                    {micEnabled && hasMicPermission ? "🎤 Microphone Active" : "🔇 Screen Audio Only"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Console Logs - Optional */}
          {showConsole && (
            <div className="bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-2xl p-4 sm:p-6 border border-slate-700/50 animate-in slide-in-from-right duration-300">
              <div className="flex justify-between items-center mb-4">
                <span className="text-base sm:text-lg font-semibold text-slate-200">Console</span>
                <div className="flex gap-2">
                  <button
                    onClick={clearConsole}
                    className="text-xs sm:text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 py-1.5 px-3 rounded-lg transition-colors duration-200 hover:scale-105 active:scale-95"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setShowConsole(false)}
                    className="text-xs sm:text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 py-1.5 px-3 rounded-lg transition-colors duration-200 hover:scale-105 active:scale-95"
                  >
                    Hide
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 rounded-xl p-4 h-96 overflow-y-auto font-mono text-xs sm:text-sm border border-slate-700/50 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
                {consoleLogs.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">Console logs will appear here...</p>
                ) : (
                  <div className="space-y-1.5">
                    {consoleLogs.map((log, index) => (
                      <div key={index} className="flex gap-2 py-1 hover:bg-slate-900/50 rounded px-2 transition-colors">
                        <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                        <span
                          className={`shrink-0 ${log.type === "error"
                            ? "text-red-400"
                            : log.type === "success"
                              ? "text-emerald-400"
                              : "text-blue-400"
                            }`}
                        >
                          {log.type === "error" ? "❌" : log.type === "success" ? "✓" : "ℹ"}
                        </span>
                        <span
                          className={`break-words ${log.type === "error"
                            ? "text-red-300"
                            : log.type === "success"
                              ? "text-emerald-300"
                              : "text-slate-300"
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
          )}
        </div>
      </div>
    </div>
  );
};

export default OnScreenRecorder;
