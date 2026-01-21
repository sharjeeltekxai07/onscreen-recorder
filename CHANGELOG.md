# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2024-01-21

### Fixed
- **TypeScript Issues:**
  - Fixed `mediaSource` type error in `getDisplayMedia` by adding proper type assertion
  - Fixed `NodeJS.Timeout` type to use `ReturnType<typeof setTimeout>` for browser compatibility
  - Fixed `useEffect` dependency warnings by properly separating cleanup logic
  - Added DOM lib types to TypeScript configuration

### Added
- **Custom Icons:**
  - Removed `lucide-react` dependency completely
  - Created custom SVG icon components (VideoIcon, PlayIcon, SquareIcon, DownloadIcon, UploadIcon, TrashIcon, MicIcon, MicOffIcon)
  - All icons are now bundled with the package, zero external icon dependencies
- Comprehensive TypeScript type definitions
- Troubleshooting guide (TROUBLESHOOTING.md)
- Publishing guide (PUBLISHING.md)
- Proper error handling and type safety throughout the component

### Changed
- Improved TypeScript configuration for better type checking
- Enhanced documentation
- Removed all external icon dependencies for better bundle size and compatibility
