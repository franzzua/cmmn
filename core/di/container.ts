import type { ConstructorOf } from './types';

export class Container {
	public static Default: Container = new Container();
	private instances = new Map<ConstructorOf<unknown> | symbol, unknown>();
	private consts = new Map<ConstructorOf<unknown> | symbol, unknown>();
	private overrides = new Map<
		ConstructorOf<unknown> | symbol,
		ConstructorOf<unknown>
	>();
	private factories = new Map<
		ConstructorOf<unknown> | symbol,
		(c: Container) => unknown
	>();

	resolve<T, TArgs extends unknown[] = []>(
		dep: ConstructorOf<T, TArgs> | symbol,
		...args: TArgs
	): T {
		const oldContainer = Container.Default;
		Container.Default = this;
		try {
			if ((dep as unknown) === Container) return this as unknown as T;
			if (this.overrides.has(dep))
				dep = this.overrides.get(dep) as ConstructorOf<T>;
			if (this.consts.has(dep)) return this.consts.get(dep);
			if (typeof dep !== 'function')
				throw new Error(`${dep} is not a constructor`);
			if (!this.factories.has(dep)) return new (dep as unknown)(...args);
			if (this.instances.has(dep)) return this.instances.get(dep);
			const instance = this.factories.get(dep)?.(this);
			this.instances.set(dep, instance);
			return instance;
		} finally {
			Container.Default = oldContainer;
		}
	}

	async [Symbol.asyncDispose]() {
		for (const value of this.instances.values()) {
			await value[Symbol.asyncDispose]?.();
			await value[Symbol.dispose]?.();
		}
		this.instances.clear();
	}

	override(dependency: unknown, override: unknown) {
		this.overrides.set(dependency, override);
	}

	const(dependency: unknown, value: unknown) {
		this.consts.set(dependency, value);
	}
	factory(dependency: unknown, value: (c: Container) => unknown) {
		this.factories.set(dependency, value);
	}

	child() {
		const res = new Container();
		res.consts = new Map(this.consts);
		res.overrides = new Map(this.overrides);
		res.factories = new Map(this.factories);
		res.instances = new Map(this.instances);
		return res;
	}
}
