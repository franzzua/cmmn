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
- **[`tools`](./tools/readme.md)**: build helpers.
  - `@cmmn/tools/vite`: Vite 8 configs for libraries and apps.
  - `@cmmn/tools/test`: decorators for `node:test` specs.
  - `cmmn dev`: development server.
- **[`server`](./server)**: Server-side components and utilities.
- **[`sync`](./sync)**: Synchronization primitives.

## Getting Started

### Installation

```bash
yarn install
```

### Common Scripts

The root `package.json` provides several scripts to help you work with the project:

TypeScript 7 (`tsc -b`) compiles every package to `dist/esm` with typings in `dist/typings`;
Vite 8 bundles libraries and apps from that output into `dist/bundle`.

- **`yarn init`**: Install dependencies and build everything.
- **`yarn build`**: Typecheck and compile all packages (`tsc -b`).
- **`yarn compile`**: The same in watch mode.
- **`yarn bundle`**: Build, then bundle every package with a `bundle` script (`vite build`).
- **`yarn test`**: Build, then run specs from `dist/esm` with `node --test`.
- **`yarn release`**: Bundle and publish public packages.
- **`yarn dev`**: Start the development server.

## Documentation

For more detailed information, please refer to the README files in each package directory:

- [Core Documentation](./core/Readme.md)
- [Tools Documentation](./tools/readme.md)
