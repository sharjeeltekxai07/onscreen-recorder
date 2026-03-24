import React, { useState } from "react";
import { ScreenRecorder } from "onscreen-recorder";
import "onscreen-recorder/styles";

function App() {
  const [status, setStatus] = useState("Idle");
  const [lastSize, setLastSize] = useState<number | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const handleRecordingStart = () => {
    setStatus("Recording");
    setLastError(null);
  };

  const handleRecordingStop = (blob: Blob) => {
    setStatus("Completed");
    setLastSize(blob.size);
  };

  const handleDownload = (blob: Blob) => setLastSize(blob.size);

  const handleUpload = async (blob: Blob) => {
    setStatus("Uploading");
    const formData = new FormData();
    formData.append("video", blob, `screen-recording-${Date.now()}.webm`);

    try {
      const response = await fetch("https://httpbin.org/post", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
      setStatus("Uploaded");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown upload error";
      setLastError(message);
      setStatus("Upload failed");
    }
  };

  const handleError = (error: Error) => {
    setLastError(error.message);
    setStatus("Error");
  };

  return (
    <main style={{ minHeight: "100vh", background: "#020617", padding: "16px" }}>
      <section
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          display: "grid",
          gap: "16px",
          gridTemplateColumns: "1fr",
        }}
      >
        <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", padding: "14px 16px" }}>
          <h1 style={{ color: "#f8fafc", fontSize: "1.1rem", marginBottom: "6px" }}>OnScreen Recorder Live Demo</h1>
          <p style={{ color: "#94a3b8", fontSize: "0.92rem" }}>
            Status: <strong style={{ color: "#e2e8f0" }}>{status}</strong>
            {lastSize ? ` · Last file: ${(lastSize / 1024 / 1024).toFixed(2)} MB` : ""}
          </p>
          {lastError ? <p style={{ color: "#fca5a5", fontSize: "0.86rem", marginTop: "6px" }}>Error: {lastError}</p> : null}
        </div>

        <ScreenRecorder
          onRecordingStart={handleRecordingStart}
          onRecordingStop={handleRecordingStop}
          onDownload={handleDownload}
          onUpload={handleUpload}
          onError={handleError}
          defaultMicEnabled
          showConsole
          showCamera
        />
      </section>
    </main>
  );
}

export default App;
