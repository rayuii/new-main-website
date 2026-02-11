/// <reference types="@sveltejs/kit" />

declare module 'kuroshiro' {
	export default class Kuroshiro {
		init(analyzer: any): Promise<void>;
		convert(text: string, options?: { to?: string; mode?: string; romajiSystem?: string }): Promise<string>;
	}
}

declare module 'kuroshiro-analyzer-kuromoji' {
	export default class KuromojiAnalyzer {
		constructor(options?: { dictPath?: string });
	}
}

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
declare namespace App {
	interface Locals {
		userid: string;
	}

	// interface Platform {}

	// interface Session {}

	// interface Stuff {}
}
