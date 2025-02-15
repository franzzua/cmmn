export class ResolvablePromise<T = void, TError = unknown>
	implements Promise<T>
{
	private impl = new Promise<T>((resolve, reject) => {
		this.resolve = (res) => {
			resolve(res);
			this.isResolved = true;
		};
		this.reject = (err) => {
			reject(err);
			this.isRejected = true;
		};
		return this.executor(resolve, reject);
	});

	constructor(
		private executor: ConstructorParameters<typeof Promise<T>>[0] = () => {},
	) {}

	// biome-ignore lint/suspicious/noThenProperty: <explanation>
	then<TResult1 = T, TResult2 = never>(
		onfulfilled?: (value: T) => TResult1 | PromiseLike<TResult1>,
		onrejected?: (reason: unknown) => TResult2 | PromiseLike<TResult2>,
	): Promise<TResult1 | TResult2> {
		return this.impl.then(onfulfilled, onrejected);
	}
	catch<TResult = never>(
		onrejected?: (reason: unknown) => TResult | PromiseLike<TResult>,
	): Promise<T | TResult> {
		return this.impl.catch(onrejected);
	}
	finally(onfinally?: () => void): Promise<T> {
		return this.impl.finally(onfinally);
	}
	[Symbol.toStringTag]: string = this.impl[Symbol.toStringTag];

	public isResolved = false;
	public isRejected = false;
	public reject: (error?: TError) => void;
	public resolve: (value: T | PromiseLike<T>) => void;
}
