# Contributing to onscreen-recorder

First off, thanks for taking the time to contribute! 🎉

## Development Setup

1. Fork and clone the repository.
2. Ensure you have Node.js version 18 or higher installed.
3. Install dependencies:
   ```bash
   npm install
   ```

## Local Development

You can run the example app to test your changes in real-time:
```bash
npm run dev
```
This will start a Vite development server for the `example/` folder, which imports the local version of the library.

## Building

To build the library for production, run:
```bash
npm run build:lib
```
This will generate the `dist/` folder using Rollup.

## Code Guidelines

- We use TypeScript. Ensure your code passes the type checker (`npm run build:lib`).
- We use ESLint for linting. Please make sure your code passes linting:
  ```bash
  npm run lint
  ```
- Before opening a pull request, ensure there are no build errors and your code conforms to the existing style.

## Issue Reporting

If you find a bug, please create an issue in our [GitHub issue tracker](https://github.com/sharjeel884/onscreen-recorder/issues) and include:
- A description of the issue.
- Steps to reproduce.
- Any relevant logs or errors from the console.

Thank you!
