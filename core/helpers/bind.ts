export function bind<TInstance>() {
	return function decorator(
		handler: Function,
		context: ClassMethodDecoratorContext,
	) {
		context.addInitializer(function (this: any) {
			this[context.name] = handler.bind(this);
		});
	};
}
