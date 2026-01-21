import React from "react";
import { ScreenRecorder } from "onscreen-recorder";
import "onscreen-recorder/styles";

function App() {
  const handleRecordingStart = () => {
    console.log("Recording started!");
  };

  const handleRecordingStop = (blob: Blob) => {
    console.log("Recording stopped! Blob size:", blob.size);
  };

  const handleDownload = (blob: Blob) => {
    console.log("Video downloaded! Blob size:", blob.size);
  };

  const handleUpload = async (blob: Blob) => {
    // Example: Custom upload implementation
    const formData = new FormData();
    formData.append("video", blob, `screen-recording-${Date.now()}.webm`);
    
    try {
      const response = await fetch("https://httpbin.org/post", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      console.log("Video uploaded successfully!", result);
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const handleError = (error: Error) => {
    console.error("An error occurred:", error);
  };

  return (
    <ScreenRecorder
      onRecordingStart={handleRecordingStart}
      onRecordingStop={handleRecordingStop}
      onDownload={handleDownload}
      onUpload={handleUpload}
      onError={handleError}
      defaultMicEnabled={true}
    />
  );
}

export default App;
