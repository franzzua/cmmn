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
import { Cell, di, inject, singleton, throttle, pipe, ObservableList } from '@cmmn/core';

// Dependency Injection
@singleton()
class DatabaseService {
  connect() {
    console.log('Connected to database');
  }

  [Symbol.dispose]() {
    console.log('Database connection closed');
  }
}

// Observable Cells
const counter = new Cell(0);
counter.on('change', ({ value }) => console.log('Count:', value));
counter.value = 1; // Logs: Count: 1

// Utility Functions
const result = pipe(
  (a: number, b: number) => a + b,
  (x) => x.toFixed(),
  (a) => +a + 5
)(3, 2); // Result: 103

// Throttling
class Service {
  @throttled(100)
  async process(data: string) {
    return data.toUpperCase();
  }
}
```

## API Reference

### Dependency Injection

```typescript
// Define a service
import {container} from "tsyringe";

@singleton()
class UserService {
    private db = resolve(DatabaseService);
    
    getUsers() {
        return ['Alice', 'Bob'];
    }

    [Symbol.dispose]() {
        console.log('UserService disposed');
    }
}

// Register and inject
using const container = new Container();

const userService = container.resolve(UserService);
```

### Observable Cells

Cells are reactive value containers that automatically notify subscribers of changes.

```typescript
// Basic cell
const name = new Cell('John');
name.on('change', ({ value }) => console.log('Name changed:', value));

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

### Utility Functions

```typescript
// Functional programming with pipe
const result = pipe(
  (a: number, b: number) => a + b,
  (x) => x.toFixed(),
  (a) => +a + 5
)(3, 2); // Result: 103

// Throttle and debounce
const throttledFn = throttle((data: string) => {
  console.log('Processing:', data);
}, 100);

const debouncedFn = debounce(() => {
  console.log('Search triggered');
}, 300);

// Array utilities
const numbers = [1, 2, 3, 4, 5];
const sum = sum(numbers); // 15
const filtered = distinct(numbers); // [1, 2, 3, 4, 5]
const grouped = groupBy(numbers, n => n % 2); // {1: [1, 3, 5], 0: [2, 4]}
```

### Decorators

```typescript
class ApiService {
  @throttled(1000)
  async fetchData(url: string) {
    const response = await fetch(url);
    return response.json();
  }

  @debounced(300)
  search(query: string) {
    // Perform search
  }
}
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