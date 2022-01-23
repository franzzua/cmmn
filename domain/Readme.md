## Domain level libraries

Domain is a part of application, that contains buseness-logic and core behaviour of app
Its isolated from UI and App levels and can be accessed through api
It can be located in WebWorker, SharedWorker, ServiceWorker or in a main thread
Logic and data should be located in reach-models with State getters and setters and Actions
In app level you can access ModelProxy
App connects to domain through some stream that serializes all data, actions and requests with serialization from core package.


