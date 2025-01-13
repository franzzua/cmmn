export class HttpError extends Error {
	constructor(
		public readonly statusCode: number,
		public readonly message: string
	) {
		super(message);
	}

	public static Unauthorized = new HttpError(401, 'Unauthorized');
	public static Unimplemented = new HttpError(418, 'Unimplemented');
	public static EmailNotVerified = new HttpError(418, 'EmailNotVerified');
}
