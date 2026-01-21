# Publishing Guide

This guide explains how to build and publish the `onscreen-recorder` package.

## Prerequisites

1. Make sure you have Node.js and npm installed
2. Install dependencies: `npm install`

## Building the Library

To build the library for distribution:

```bash
npm run build:lib
```

This will:
- Compile TypeScript to JavaScript (ESM and CJS formats)
- Generate TypeScript declaration files (.d.ts)
- Extract and minify CSS
- Create source maps
- Output everything to the `dist/` directory

## Testing Locally

Before publishing, test the package locally:

1. Build the library: `npm run build:lib`
2. Test the example app: `npm run dev` (runs the example in development mode)

## Publishing to npm

1. **Update version** in `package.json` (follow semantic versioning)
2. **Update CHANGELOG** if you maintain one
3. **Build the library**: `npm run build:lib`
4. **Test everything works**
5. **Login to npm**: `npm login`
6. **Publish**: `npm publish`

The `prepublishOnly` script will automatically run `build:lib` before publishing.

## Package Structure

After building, the `dist/` folder will contain:

```
dist/
├── index.js          # ESM build
├── index.cjs         # CommonJS build
├── index.d.ts        # TypeScript definitions
├── index.css         # Extracted and minified CSS
└── *.map             # Source maps
```

## Version Management

Use semantic versioning:
- **Patch** (1.0.1): Bug fixes
- **Minor** (1.1.0): New features (backward compatible)
- **Major** (2.0.0): Breaking changes

Update version with: `npm version patch|minor|major`
