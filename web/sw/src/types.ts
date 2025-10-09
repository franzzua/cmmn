export type ServiceWorkerAction = 'reload' | 'check' | 'init'
  | 'switch-new-version' | 'new-version' | 'loading';

export type Platform = 'ios' | 'android' | 'windows' | 'unknown';
export type InitMessageData = {
	baseURI: string;
	bundleJson?: any;
}