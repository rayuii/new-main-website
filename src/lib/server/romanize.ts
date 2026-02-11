import Kuroshiro from 'kuroshiro';
import KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji';
import path from 'path';

let kuroshiro: any = null;
let initialized = false;
let initPromise: Promise<void> | null = null;

async function getKuroshiro() {
	if (initialized && kuroshiro) return kuroshiro;
	if (initPromise) {
		await initPromise;
		return kuroshiro;
	}

	initPromise = (async () => {
		try {
			const k = new Kuroshiro();
			const dictPath = path.join(
				process.cwd(),
				'node_modules',
				'kuromoji',
				'dict'
			);
			await k.init(new KuromojiAnalyzer({ dictPath }));
			kuroshiro = k;
			initialized = true;
		} catch (e) {
			// Reset so next call can retry
			initPromise = null;
			throw e;
		}
	})();

	await initPromise;
	return kuroshiro;
}

export async function romanize(text: string): Promise<string> {
	// If text has no Japanese characters, return as-is
	if (!/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(text)) {
		return text;
	}

	const k = await getKuroshiro();
	let result = await k.convert(text, { to: 'romaji', mode: 'spaced', romajiSystem: 'hepburn' });

	// Expand macron vowels to double vowels (standard Japanese romanization)
	result = result
		.replace(/ā/g, 'aa').replace(/Ā/g, 'Aa')
		.replace(/ī/g, 'ii').replace(/Ī/g, 'Ii')
		.replace(/ū/g, 'uu').replace(/Ū/g, 'Uu')
		.replace(/ē/g, 'ee').replace(/Ē/g, 'Ee')
		.replace(/ō/g, 'ou').replace(/Ō/g, 'Ou');

	// Capitalize first letter of each word
	return result.replace(/\b\w/g, (c: string) => c.toUpperCase());
}
