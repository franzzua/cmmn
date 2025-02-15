## Dependency Injection

Allows you to specify dependencies in classes and resolve it.

```typescript
class B { }
class A {
	@inject(B) b!: B;
}
const a = new A(); // or resolve(A);
expect(a.b).notNull(); 
```
By default, it resolves new instance every time. Other options: 
* `di.const(A, a)` - set exact value
* `di.factory(A, c => new A())` - set factory
* `@scoped` class decorator sets per-container lifetime for decorated class
* `di.override(A, class A1 extends A {})` - override 

Support child containers:
```typescript
const aChild = di.child();
aChild.factory(A, c => c.resolve(A, 'a'));
const bChild = di.child();
bChild.factory(A, c => c.resolve(A, 'b'));
```
Child containers inherits all registered const, factories, overrides and resolved instances at creating time. After creation, it has no relation to its parent.

You can dispose container with `di[Symbol.asyncDispose]()`. It will call all `[Symbol.dispose]` and `[Symbol.asyncDispose]` methods of resolved instances with per-container lifetime.

If your class has constructor parameters you can resolve it with `di.resolve(A, arg1, arg2)`