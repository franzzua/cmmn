import {AsyncCell, bind, cell} from "@cmmn/core";

export class PwaInstallApi {
	@cell()
	private accessor event: BeforeInstallPromptEvent;
	private userChoiceQuery = AsyncCell.query(() => this.event?.userChoice)

	public constructor(private preventInstallDialog = false) {
		window.addEventListener('beforeinstallprompt', (e: BeforeInstallPromptEvent) => {
			if (this.preventInstallDialog){
				e.preventDefault();
			}
			this.event = e;
		})
	}

	@bind()
	public async prompt() {
		return this.event.prompt();
	}

	public get platforms(): string[] {
		return this.event?.platforms;
	}

	public get userChoice(): UserChoice {
		return this.userChoiceQuery.result;
	}

	public get isInitialized(): boolean {
		return !!this.event;
	}

	public get isUserChoosing(): boolean {
		return this.userChoiceQuery.isPending;
	}
}
export type UserChoice = {
	outcome: 'accepted' | 'dismissed';
	platform: string;
}

type BeforeInstallPromptEvent = Event & {
	/**
	 * Returns an array of DOMString items containing the platforms on which the event was dispatched.
	 * This is provided for user agents that want to present a choice of versions to the user such as,
	 * for example, "web" or "play" which would allow the user to chose between a web version or
	 * an Android version.
	 */
	readonly platforms: Array<string>;

	/**
	 * Returns a Promise that resolves to a DOMString containing either "accepted" or "dismissed".
	 */
	readonly userChoice: Promise<UserChoice>;

	/**
	 * Allows a developer to show the install prompt at a time of their own choosing.
	 * This method returns a Promise.
	 */
	prompt(): Promise<void>;
};
