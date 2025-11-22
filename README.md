# @cmmn/framework

**@cmmn/framework** is a modern, high-performance web framework designed for building fast, scalable applications. It emphasizes a unique architecture where business logic is dedicated to a worker thread, ensuring the main thread remains free for UI rendering.

## Key Features

- **Worker-First Architecture**: Offloads heavy business logic to a worker thread, keeping the UI responsive.
- **Component System**: Simple and efficient CustomElements powered by `uhtml` for rendering.
- **State Management**: Reactive data flow via `cellx` (in `@cmmn/cell`), providing automatic dependency tracking and updates.
- **Dependency Injection**: Built-in DI container for modular and testable code.
- **Tooling**: Comprehensive CLI for compiling, bundling, and generating code.

## Packages Overview

The framework is organized into several workspaces:

- **[`core`](./core/Readme.md)**: The heart of the framework. Includes:
  - `cell`: Reactive state management.
  - `di`: Dependency injection system.
  - `event-emitter`: Typed event handling.
  - `helpers`: Utility functions for arrays, maps, dates, etc.
- **[`web`](./web)**: Web-specific packages.
  - `uhtml`: UI rendering and component base.
  - `ui`: UI components and helpers.
- **[`tools`](./tools/readme.md)**: CLI and build tools.
  - `cmmn compile`: SWC compiler wrapper.
  - `cmmn bundle`: Vite-based bundler.
- **[`server`](./server)**: Server-side components and utilities.
- **[`sync`](./sync)**: Synchronization primitives.

## Getting Started

### Installation

```bash
yarn install
```

### Common Scripts

The root `package.json` provides several scripts to help you work with the project:

- **`yarn init`**: Initialize the project (install dependencies, compile tools).
- **`yarn dev`**: Start the development server.
- **`yarn compile`**: Run the compiler in watch mode.
- **`yarn bundle`**: Run the bundler in watch mode.
- **`yarn test`**: Run tests.

## Documentation

For more detailed information, please refer to the README files in each package directory:

- [Core Documentation](./core/Readme.md)
- [Tools Documentation](./tools/readme.md)
