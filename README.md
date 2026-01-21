# OnScreen Recorder

A beautiful, feature-rich React component for screen recording with microphone support, custom styling, and built-in console logging.

## Features

- 🎥 **Screen Recording** - Record your screen with high-quality video
- 🎤 **Microphone Support** - Optional microphone audio recording with automatic mixing
- 🎨 **Beautiful UI** - Modern, responsive design with custom styling
- 📊 **Console Logging** - Built-in console for real-time recording status
- 📤 **Upload Support** - Built-in API upload functionality
- 📥 **Download Support** - Easy video download
- 🔧 **TypeScript** - Fully typed with TypeScript
- ⚡ **Lightweight** - Zero external icon dependencies, custom SVG icons included, optimized bundle size
- 🎯 **Customizable** - Extensive props for customization

## Installation

```bash
npm install onscreen-recorder
# or
yarn add onscreen-recorder
# or
pnpm add onscreen-recorder
```

This package works with React 16.8+, React 17, React 18, and React 19. No special installation flags are needed.

## Peer Dependencies

This package requires React and React DOM as peer dependencies:

```bash
npm install react react-dom
```

## Quick Start

```tsx
import React from "react";
import { ScreenRecorder } from "onscreen-recorder";
import "onscreen-recorder/styles";

function App() {
  return <ScreenRecorder />;
}

export default App;
```

## Basic Usage

```tsx
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

  return (
    <ScreenRecorder
      apiEndpoint="https://your-api.com/upload"
      onRecordingStart={handleRecordingStart}
      onRecordingStop={handleRecordingStop}
      defaultMicEnabled={true}
    />
  );
}
```

## API Reference

### ScreenRecorder Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `apiEndpoint` | `string` | `"https://httpbin.org/post"` | API endpoint for uploading recordings |
| `onRecordingStart` | `() => void` | `undefined` | Callback fired when recording starts |
| `onRecordingStop` | `(blob: Blob) => void` | `undefined` | Callback fired when recording stops, receives the video blob |
| `onDownload` | `(blob: Blob) => void` | `undefined` | Callback fired when video is downloaded |
| `onUpload` | `(response: any) => void` | `undefined` | Callback fired when upload completes successfully |
| `onError` | `(error: Error) => void` | `undefined` | Callback fired when an error occurs |
| `defaultMicEnabled` | `boolean` | `true` | Whether microphone is enabled by default |
| `className` | `string` | `""` | Additional CSS class name for the container |

## Examples

### With Custom Callbacks

```tsx
import React from "react";
import { ScreenRecorder } from "onscreen-recorder";
import "onscreen-recorder/styles";

function App() {
  return (
    <ScreenRecorder
      apiEndpoint="https://api.example.com/upload"
      onRecordingStart={() => {
        console.log("🎬 Recording started!");
      }}
      onRecordingStop={(blob) => {
        console.log(`✅ Recording complete! Size: ${blob.size} bytes`);
        // You can process the blob here
      }}
      onDownload={(blob) => {
        console.log("📥 Video downloaded!");
      }}
      onUpload={(response) => {
        console.log("📤 Upload successful!", response);
      }}
      onError={(error) => {
        console.error("❌ Error:", error.message);
      }}
      defaultMicEnabled={true}
    />
  );
}
```

### With Custom Styling

```tsx
import React from "react";
import { ScreenRecorder } from "onscreen-recorder";
import "onscreen-recorder/styles";
import "./custom-styles.css";

function App() {
  return (
    <ScreenRecorder
      className="my-custom-class"
      apiEndpoint="https://api.example.com/upload"
    />
  );
}
```

## Styling

The component comes with built-in styles. Import them using:

```tsx
import "onscreen-recorder/styles";
```

The component uses CSS Modules, so you can override styles by targeting the component's class names or by using the `className` prop.

## Browser Support

This component uses the [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder) and [getDisplayMedia API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia), which are supported in:

- Chrome 72+
- Firefox 66+
- Edge 79+
- Safari 13+

## Development

### Building the Library

```bash
npm run build:lib
```

This will create the distributable files in the `dist/` directory.

### Running the Example

```bash
npm run dev
```

This will start the example application in development mode.

### Project Structure

```
onscreen-recorder/
├── lib/                 # Library source code
│   ├── components/      # React components
│   └── index.ts         # Main export file
├── dist/                # Built files (generated)
├── example/             # Example application
└── package.json
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Support

If you encounter any issues or have questions, please open an issue on the GitHub repository.
