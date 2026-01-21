# Quick Publish Guide

## Fastest Way to Publish

### Option 1: Use the Script (Recommended)

```bash
./publish.sh
```

This script will:
- Check if you're logged in
- Verify package name availability
- Build the package
- Show what will be published
- Ask for confirmation
- Publish to npm

### Option 2: Manual Steps

1. **Login to npm** (if not already):
   ```bash
   npm login
   ```

2. **Build the package**:
   ```bash
   npm run build:lib
   ```

3. **Check what will be published**:
   ```bash
   npm pack --dry-run
   ```

4. **Publish**:
   ```bash
   npm publish
   ```

## Before Publishing

Make sure to update `package.json` with your information:

```json
{
  "author": "Your Name <your.email@example.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/onscreen-recorder.git"
  }
}
```

## After Publishing

Your package will be available at:
- **npm**: https://www.npmjs.com/package/onscreen-recorder
- **Install**: `npm install onscreen-recorder`

## Troubleshooting

- **"Package name already exists"**: Use a scoped package name like `@yourusername/onscreen-recorder` and publish with `npm publish --access public`
- **"Not logged in"**: Run `npm login`
- **"403 Forbidden"**: Check your npm account permissions

For detailed instructions, see `NPM_PUBLISH_GUIDE.md`.
