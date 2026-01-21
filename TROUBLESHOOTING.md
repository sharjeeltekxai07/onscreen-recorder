# Troubleshooting Guide

## Dependency Installation Issues

This package has minimal dependencies and only requires React and React DOM as peer dependencies. Installation should be straightforward:

```bash
npm install onscreen-recorder
# or
yarn add onscreen-recorder
# or
pnpm add onscreen-recorder
```

## TypeScript Issues

### Type errors with MediaRecorder API

If you see type errors related to `mediaSource` or `getDisplayMedia`, make sure your `tsconfig.json` includes the DOM library:

```json
{
  "compilerOptions": {
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  }
}
```

## Build Issues

### Rollup build fails

If the build fails, make sure all dependencies are installed:

```bash
npm install
npm run build:lib
```

### CSS not being extracted

Make sure `rollup-plugin-postcss` is properly configured in `rollup.config.mjs`. The CSS should be extracted to `dist/index.css`.

## Runtime Issues

### Screen recording not working

1. **Browser Support:** Make sure you're using a modern browser that supports the MediaRecorder API:
   - Chrome 72+
   - Firefox 66+
   - Edge 79+
   - Safari 13+

2. **HTTPS Required:** The MediaRecorder API requires a secure context (HTTPS) or localhost.

3. **Permissions:** Make sure the browser has permission to access screen and microphone.

### Microphone not working

1. Check browser permissions for microphone access
2. Make sure `defaultMicEnabled` is set to `true` (default)
3. Check browser console for permission errors

## Common Questions

### Can I use this with React 19?

Yes! The package works with React 16.8+, 17, 18, and 19. No special installation flags are needed.

### Can I customize the styles?

Yes! The component uses CSS classes prefixed with `onscreen-recorder-`. You can override any styles by targeting these classes in your own CSS.

### How do I use this in a Next.js app?

Import the component and styles:

```tsx
import { ScreenRecorder } from "onscreen-recorder";
import "onscreen-recorder/styles";
```

Make sure to use it in a client component (add `"use client"` directive in Next.js 13+).
