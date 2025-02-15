export function bind<TInstance>() {
	return function decorator(
		handler: (this: unknown, ...args: unknown[]) => unknown,
		context: ClassMethodDecoratorContext,
	) {
		context.addInitializer(function () {
			this[context.name] = handler.bind(this);
		});
	};
}
