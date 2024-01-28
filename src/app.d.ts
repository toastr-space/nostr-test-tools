// See https://kit.svelte.dev/docs/types#app

import type { Event, EventTemplate } from 'nostr-tools';

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface Window {
		nostr: {
			getPublicKey: () => Promise<string>;
			signEvent: (event: EventTemplate) => Promise<Event>;
		};
	}
}

export {};
