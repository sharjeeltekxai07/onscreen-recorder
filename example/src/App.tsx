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

  const handleUpload = (response: any) => {
    console.log("Video uploaded successfully!", response);
  };

  const handleError = (error: Error) => {
    console.error("An error occurred:", error);
  };

  return (
    <ScreenRecorder
      apiEndpoint="https://httpbin.org/post"
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
