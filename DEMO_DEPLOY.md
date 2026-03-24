# Live Demo Deployment

This repo includes a real demo app in `example/`.

Current hosted demo:

- [https://onscreen-recorder-jciaggdoq-runs1.vercel.app/](https://onscreen-recorder-jciaggdoq-runs1.vercel.app/)

## Option A: Vercel (recommended)

1. Push this repository to GitHub.
2. In Vercel, create a new project from the repo.
3. Set **Root Directory** to `example`.
4. Keep defaults (or use `example/vercel.json`):
   - Install: `npm install`
   - Build: `npm run build`
   - Output: `dist`
5. Deploy.

After deploy, test permissions in production URL (`https://...vercel.app`) because screen/camera APIs require secure context.

## Option B: CodeSandbox

1. Open [https://codesandbox.io/s/github](https://codesandbox.io/s/github)
2. Paste your repo URL.
3. Set sandbox directory to `example` if prompted.
4. Run the sandbox.

## Notes

- Demo uses the published package version from npm (`onscreen-recorder`).
- The live demo records in WebM (`video/webm`), not MP4.
- Browser permission prompts are expected for screen/mic/camera.
