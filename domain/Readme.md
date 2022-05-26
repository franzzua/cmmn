## Domain level libraries

Domain is a part of application, that contains business-logic and core behaviour of app

Its isolated from UI and App levels and can be accessed through api

It can be located in WebWorker, SharedWorker, ServiceWorker or in a main thread

Logic and data should be located in reach-models with State getters and setters and Actions

In app level you can access ModelProxy

App connects to domain through some stream that serializes all data, actions and requests with serialization from core package.

* [Model](./worker/model.ts)
  * Is using for describe a single Entity in your work domain
  * Contains $state - a cell that changes on every model change and contains all usefull info about it, but not more.
  * Contains Actions that can be used to change a model
  * It can contains sub-models, that can be resolved relatively
* [ModelProxy](entry/modelProxy.ts)
  * It lays in a main thread
  * It corresponds to some model in domain
  * It also has $state and Actions
  * $state can be local or remote: if you change it in local thread it will be local until any disturbance in main-worker communication will be finished and stable remote state will come.
  * It can have sub-model-proxies with same resolution as in models 
* [Entrypoint](./entry/proxy.ts)
  * useDomain: you will get Model instead of ModelProxy.
  * useStreamDomain: you will get ModelProxy linked to a Model directly
  * useWorkerDomain: you will get ModelProxy linked to a Model via worker messages