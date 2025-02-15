import type {InjectionToken} from './types';


export class Container {
	public static Default: Container = new Container();
	private instances = new Map<InjectionToken, unknown>();
	private consts = new Map<InjectionToken, unknown>();
	private overrides = new Map<
		InjectionToken,
		InjectionToken
	>();
	private factories = new Map<
		InjectionToken,
		(c: Container) => unknown
	>();

	resolve<T, TArgs extends unknown[] = []>(
		dep: InjectionToken<T, TArgs>,
		...args: TArgs
	): T {
		const oldContainer = Container.Default;
		Container.Default = this;
		try {
			if ((dep as unknown) === Container) return this as unknown as T;
			if (this.overrides.has(dep))
				dep = this.overrides.get(dep) as InjectionToken<T, TArgs>;
			if (this.consts.has(dep)) return this.consts.get(dep) as T;
			if (typeof dep !== 'function')
				throw new Error(`${dep} is not a constructor`);
			if (!this.factories.has(dep)) return new (dep as unknown)(...args);
			if (this.instances.has(dep)) return this.instances.get(dep) as T;
			const instance = this.factories.get(dep)?.(this);
			this.instances.set(dep, instance);
			return instance as T;
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

	override<T, TArgs>(dependency: InjectionToken<T, TArgs>, override: InjectionToken<T, TArgs>) {
		this.overrides.set(dependency, override);
	}

	const<T, TArgs>(dependency: InjectionToken<T, TArgs>, value: T) {
		this.consts.set(dependency, value);
	}
	factory<T, TArgs>(dependency: InjectionToken<T, TArgs>, value: (c: Container) => T) {
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
