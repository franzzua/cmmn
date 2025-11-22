# @cmmn/server

Server-side libraries for building REST APIs with [Fastify](https://www.fastify.io/).

## Features

- **Decorators**: Class-based controller definition using decorators (`@ctrl`, `@get`, `@post`, `@put`, etc.).
- **Fastify Integration**: Easy registration of routes with Fastify instances.

## Usage

### Defining a Controller

```typescript
import { ctrl, get, post, request } from "@cmmn/server";
import { FastifyRequest } from "fastify";

@ctrl("/api/users")
export class UserController {
  
  @get()
  async getUsers() {
    return [{ id: 1, name: "John Doe" }];
  }

  @post()
  async createUser(@request req: FastifyRequest) {
    // Handle creation
    return { status: "created" };
  }
}
```

### Registering Routes

```typescript
import Fastify from "fastify";
import { registerRoutes } from "@cmmn/server";
import { UserController } from "./UserController";

const fastify = Fastify();

// Register controllers
registerRoutes(fastify, [
  new UserController()
]);

fastify.listen({ port: 3000 }, (err) => {
  if (err) throw err;
  console.log("Server listening on port 3000");
});
```
