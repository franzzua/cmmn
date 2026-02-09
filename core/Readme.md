# @cmmn/core

Dependency injection, base extensions, and useful utility functions for the CMMN framework.

## Overview

`@cmmn/core` is a TypeScript library that provides foundational utilities and patterns for building reactive applications. It includes:

- **Dependency Injection**: A lightweight DI container with support for singletons, factories, and scoped services
- **Observable Collections**: Reactive data structures including ObservableList, ObservableMap, ObservableSet, and ObservableObject
- **Event System**: Event emitters with merge listeners and advanced event handling
- **Utility Functions**: Common helpers for data manipulation, async operations, and functional programming

## Installation

```bash
npm install @cmmn/core
```

## Quick Start

```typescript
import { Cell, di, inject, singleton } from '@cmmn/core';

// Dependency Injection
@singleton()
class DatabaseService {
  connect() {
    console.log('Connected to database');
  }
}

// Observable Cells
const counter = new Cell(0);
counter.subscribe(value => console.log('Count:', value));
counter.value = 1; // Logs: Count: 1
```

## API Reference

### Dependency Injection

```typescript
// Define a service
@singleton()
class UserService {
  getUsers() {
    return ['Alice', 'Bob'];
  }
}

// Register and inject
const container = new Container();
container.register(UserService);

const userService = container.resolve(UserService);
```

### Observable Cells

Cells are reactive value containers that automatically notify subscribers of changes.

```typescript
// Basic cell
const name = new Cell('John');
name.subscribe(value => console.log('Name changed:', value));

// Computed cell
const greeting = new Cell(() => `Hello, ${name.value}!`);

// Async cell
const userData = new AsyncCell(async () => {
  const response = await fetch('/api/user');
  return response.json();
});
```

### Observable Collections

Reactive collections that emit events when modified:

```typescript
// Observable List
const items = new ObservableList([1, 2, 3]);
items.on('add', item => console.log('Added:', item));

// Observable Map
const userMap = new ObservableMap();
userMap.on('set', (key, value) => console.log(`${key} = ${value}`));
```

### Event System

```typescript
const emitter = new EventEmitter();

emitter.on('message', (data) => {
  console.log('Received:', data);
});

emitter.emit('message', 'Hello World!');
```

## Scripts

- `npm run typings` - Generate type definitions with watch mode
- `npm run bundle` - Build the package bundle

## Dependencies

- **throttle-debounce** (5.0.2) - Utility functions for throttling and debouncing
- **uuidv7** (1.0.2) - UUID v7 generation

## Development Dependencies

- **@cmmn/tools** - Build and development tools for the CMMN framework
- **@types/node** (20.x.x) - TypeScript definitions for Node.js

## License

ISC

## Repository

https://github.com/franzzua/cmmn/tree/master/core