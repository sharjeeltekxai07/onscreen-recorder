# NPM Publishing Guide

This guide will help you publish `onscreen-recorder` to npm.

## Prerequisites

1. **npm account**: Create an account at https://www.npmjs.com/signup if you don't have one
2. **Node.js and npm**: Make sure you have the latest versions installed
3. **Login to npm**: You need to be logged in to publish

## Step-by-Step Publishing Instructions

### 1. Update Package Information

Before publishing, make sure to update `package.json` with your information:

```json
{
  "author": "Your Name <your.email@example.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/onscreen-recorder.git"
  }
}
```

### 2. Build the Package

Build the library to ensure everything compiles correctly:

```bash
npm run build:lib
```

This will create the `dist/` folder with all the compiled files.

### 3. Verify Package Contents

Check what will be published:

```bash
npm pack --dry-run
```

This shows you exactly what files will be included in the package.

### 4. Check Package Name Availability

Make sure the package name `onscreen-recorder` is available:

```bash
npm view onscreen-recorder
```

If it returns a 404 error, the name is available. If it shows package information, you'll need to choose a different name or use a scoped package (e.g., `@yourusername/onscreen-recorder`).

### 5. Login to npm

Login to your npm account:

```bash
npm login
```

Enter your:
- Username
- Password
- Email address
- One-time password (if 2FA is enabled)

### 6. Publish the Package

Publish to npm:

```bash
npm publish
```

**Note**: The `prepublishOnly` script will automatically run `build:lib` before publishing, so your package will always be built with the latest code.

### 7. Verify Publication

After publishing, verify your package is live:

```bash
npm view onscreen-recorder
```

Or visit: https://www.npmjs.com/package/onscreen-recorder

## Publishing Updates

When you want to publish an update:

1. **Update version** in `package.json`:
   ```bash
   npm version patch   # for bug fixes (1.0.0 -> 1.0.1)
   npm version minor   # for new features (1.0.0 -> 1.1.0)
   npm version major   # for breaking changes (1.0.0 -> 2.0.0)
   ```

2. **Update CHANGELOG.md** with the changes

3. **Build and publish**:
   ```bash
   npm run build:lib
   npm publish
   ```

## Using a Scoped Package (Optional)

If the package name is taken, you can use a scoped package:

1. Update `package.json`:
   ```json
   {
     "name": "@yourusername/onscreen-recorder"
   }
   ```

2. Publish with public access:
   ```bash
   npm publish --access public
   ```

## Troubleshooting

### "Package name already exists"
- Choose a different name or use a scoped package
- Update the name in `package.json`

### "You must verify your email"
- Check your email and verify your npm account
- Visit https://www.npmjs.com/email-edit

### "403 Forbidden"
- Make sure you're logged in: `npm whoami`
- Check if you have publish permissions
- If using a scoped package, use `--access public`

### Build Errors
- Make sure all dependencies are installed: `npm install`
- Check TypeScript compilation: `npx tsc --noEmit --project tsconfig.lib.json`
- Verify Rollup config is correct

## Post-Publishing

After successful publication:

1. **Test installation**:
   ```bash
   npm install onscreen-recorder
   ```

2. **Update README** with the npm package link

3. **Create a GitHub release** (if you have a repository)

4. **Share on social media** or relevant communities

## Package Information

- **Package Name**: `onscreen-recorder`
- **Current Version**: `1.0.0`
- **License**: MIT
- **Main Entry**: `./dist/index.cjs` (CommonJS) and `./dist/index.js` (ESM)
- **TypeScript Types**: `./dist/index.d.ts`
- **Styles**: `./dist/index.css`

Good luck with your publication! 🚀
