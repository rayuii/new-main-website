import Kuroshiro from 'kuroshiro';
import KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji';

const dictPath = process.cwd() + '/node_modules/kuromoji/dict';

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
			await k.init(new KuromojiAnalyzer({ dictPath }));
			kuroshiro = k;
			initialized = true;
		} catch (e) {
			initPromise = null;
			throw e;
		}
	})();

	await initPromise;
	return kuroshiro;
}

export async function romanize(text: string): Promise<string> {
	if (!/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(text)) {
		return text;
	}

	const k = await getKuroshiro();
	let result = await k.convert(text, { to: 'romaji', mode: 'spaced', romajiSystem: 'hepburn' });

	result = result
		.replace(/ā/g, 'aa').replace(/Ā/g, 'Aa')
		.replace(/ī/g, 'ii').replace(/Ī/g, 'Ii')
		.replace(/ū/g, 'uu').replace(/Ū/g, 'Uu')
		.replace(/ē/g, 'ee').replace(/Ē/g, 'Ee')
		.replace(/ō/g, 'ou').replace(/Ō/g, 'Ou');

	return result.replace(/\b\w/g, (c: string) => c.toUpperCase());
}