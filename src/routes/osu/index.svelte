<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/env';
	import { fade } from 'svelte/transition';

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null;
	let animFrame: number;
	let mounted = false;
	let loading = false;
	let mapTitle = '';
	let mapArtist = '';
	let mapVersion = '';

	// Audio
	let songAudio: HTMLAudioElement;
	let audioCtx: AudioContext;

	// Hitsound buffers for authentic osu! hitsound support
	type HitsoundType = 'hitnormal' | 'hitclap' | 'hitwhistle' | 'hitfinish';
	type HitsoundSet = 'soft' | 'normal' | 'drum';
	interface HitsoundBuffers {
		[set: string]: {
			[type: string]: AudioBuffer | null;
		};
	}
	let hitsoundBuffers: HitsoundBuffers = {
		soft: { hitnormal: null, hitclap: null, hitwhistle: null, hitfinish: null },
		normal: { hitnormal: null, hitclap: null, hitwhistle: null, hitfinish: null },
		drum: { hitnormal: null, hitclap: null, hitwhistle: null, hitfinish: null }
	};
	let missSoundBuffer: AudioBuffer | null = null;
	let audioReady = false;

	// Skin images
	let skinLoaded = false;
	const skin: Record<string, HTMLImageElement> = {};
	let sliderBallFrames: HTMLImageElement[] = [];
	let comboNumImages: HTMLImageElement[] = [];
	const comboColors = [
		[245, 110, 140], // Combo1 from skin.ini
		[26, 116, 242],  // Combo2 from skin.ini
	];

	function loadImg(src: string): Promise<HTMLImageElement> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.src = src;
		});
	}

	// Create a tinted version of an image using an offscreen canvas
	function tintImage(img: HTMLImageElement, r: number, g: number, b: number): HTMLCanvasElement {
		const c = document.createElement('canvas');
		c.width = img.width;
		c.height = img.height;
		const cx = c.getContext('2d')!;
		cx.drawImage(img, 0, 0);
		cx.globalCompositeOperation = 'multiply';
		cx.fillStyle = `rgb(${r},${g},${b})`;
		cx.fillRect(0, 0, c.width, c.height);
		cx.globalCompositeOperation = 'destination-in';
		cx.drawImage(img, 0, 0);
		return c;
	}

	// Pre-tinted hitcircle canvases per combo color
	let tintedCircles: HTMLCanvasElement[] = [];

	async function loadSkin() {
		try {
			const names = [
				'hitcircle', 'hitcircleoverlay', 'approachcircle',
				'hit0', 'hit50', 'hit100', 'hit300',
				'reversearrow', 'sliderfollowcircle',
				'sliderstartcircle', 'sliderstartcircleoverlay',
				'sliderendcircle',
				'spinner-circle', 'spinner-approachcircle',
				'spinner-clear', 'spinner-spin', 'spinner-rpm',
				'cursor',
			];
			const promises = names.map(async (name) => {
				// Only load .png from /skin/ (no @2x)
				try {
					skin[name] = await loadImg(`/skin/${name}.png`);
				} catch { /* skip */ }
			});

			// Slider ball frames (animated)
			const ballPromises: Promise<void>[] = [];
			for (let i = 0; i < 60; i++) {
				ballPromises.push((async () => {
					try {
						sliderBallFrames[i] = await loadImg(`/skin/sliderb${i}@2x.png`);
					} catch {
						try {
							sliderBallFrames[i] = await loadImg(`/skin/sliderb${i}.png`);
						} catch { /* skip */ }
					}
				})());
			}

			// Combo number font
			const numPromises: Promise<void>[] = [];
			   for (let i = 0; i <= 9; i++) {
				   numPromises.push((async () => {
					   try {
						   comboNumImages[i] = await loadImg(`/skin/Fonts/Hitcircle/Aven/default-${i}@2x.png`);
					   } catch {
						   try {
							   comboNumImages[i] = await loadImg(`/skin/Fonts/Hitcircle/Aven/default-${i}.png`);
						   } catch { /* skip */ }
					   }
				   })());
			   }

			await Promise.all([...promises, ...ballPromises, ...numPromises]);

			// Pre-tint hitcircle for each combo color
			if (skin['hitcircle']) {
				tintedCircles = comboColors.map(([r, g, b]) => tintImage(skin['hitcircle'], r, g, b));
			}

			skinLoaded = true;
		} catch (e) {
			console.warn('Skin loading failed:', e);
		}
	}

	// Mouse position tracking (for keyboard input)
	let mouseX = 0;
	let mouseY = 0;

	// Key state for HUD display
	let keyGPressed = false;
	let keyHPressed = false;

	type State = 'menu' | 'playing' | 'results';
	let state: State = 'menu';

	// osu! playfield is 512x384
	const OSU_WIDTH = 512;
	const OSU_HEIGHT = 384;

	// Game settings (from beatmap)
	let circleSize = 4;
	let approachRate = 9;
	let overallDifficulty = 8;
	let sliderMultiplier = 1.4;

	// Derived from CS/AR/OD
	let circleRadius = 40;
	let approachDuration = 600;
	let fadeInDuration = 400;
	let hitWindow300 = 50;
	let hitWindow100 = 100;
	let hitWindow50 = 150;
	const missWindow = 250;

	function calcSettings() {
		circleRadius = 54.4 - 4.48 * circleSize;
		// AR → preempt (approach duration) — correct osu! wiki formula
		if (approachRate < 5) {
			approachDuration = 1200 + 600 * (5 - approachRate) / 5;
			fadeInDuration = 800 + 400 * (5 - approachRate) / 5;
		} else {
			approachDuration = 1200 - 750 * (approachRate - 5) / 5;
			fadeInDuration = 800 - 500 * (approachRate - 5) / 5;
		}
		// OD → hit windows
		hitWindow300 = 80 - 6 * overallDifficulty;
		hitWindow100 = 140 - 8 * overallDifficulty;
		hitWindow50 = 200 - 10 * overallDifficulty;
	}

	// ── Timing Points ──
	interface TimingPoint {
		time: number;
		beatLength: number;
		uninherited: boolean;
		svMultiplier: number;
	}

	let timingPoints: TimingPoint[] = [];

	function getTimingAt(time: number): { beatLength: number; sv: number } {
		let beatLength = 500;
		let sv = 1.0;
		for (const tp of timingPoints) {
			if (tp.time > time + 5) break;
			if (tp.uninherited) {
				beatLength = tp.beatLength;
				sv = 1.0;
			} else {
				sv = tp.svMultiplier;
			}
		}
		return { beatLength, sv };
	}

	// ── Hit Objects ──
	type ObjectType = 'circle' | 'slider' | 'spinner';

	interface SliderPoint {
		x: number;
		y: number;
	}

	interface HitObject {
		type: ObjectType;
		x: number;
		y: number;
		time: number;
		hit: boolean;
		missed: boolean;
		hitTime?: number;
		comboNum: number;
		comboColorIdx: number;
		// Slider
		curveType?: string;
		curvePoints?: SliderPoint[];
		slides?: number;
		pixelLength?: number;
		duration?: number;
		endTime?: number;
		pathCache?: SliderPoint[];
		sliderActive?: boolean;
		sliderCompleted?: boolean;
		sliderProgress?: number;
		sliderTicksHit?: number;
		sliderTicksTotal?: number;
		// Spinner
		spinnerEndTime?: number;
		spinnerRotations?: number;
		spinnerRequired?: number;
		spinnerAngle?: number;
		spinnerLastAngle?: number | undefined;
		spinnerActive?: boolean;
		spinnerCompleted?: boolean;
		// Hitsound
		hitsound?: number;
		hitsoundSet?: HitsoundSet;
	}

	let hitObjects: HitObject[] = [];
	let score = 0;
	let combo = 0;
	let maxCombo = 0;
	let hits300 = 0;
	let hits100 = 0;
	let hits50 = 0;
	let misses = 0;
	let gameStart = 0;
	let gameTime = 0;
	let hitEffects: { x: number; y: number; time: number; text: string; color: string; skinKey?: string }[] = [];

	// Playfield dimensions (4:3 ratio inside canvas)
	let fieldX = 0;
	let fieldY = 0;
	let fieldW = 0;
	let fieldH = 0;
	let scale = 1;

	// ── Curve math ──
	function lerp2(a: SliderPoint, b: SliderPoint, t: number): SliderPoint {
		return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
	}

	function ptDist(a: SliderPoint, b: SliderPoint): number {
		return Math.hypot(a.x - b.x, a.y - b.y);
	}

	function flattenBezier(points: SliderPoint[], segments: number = 50): SliderPoint[] {
		if (points.length === 2) {
			const result: SliderPoint[] = [];
			for (let i = 0; i <= segments; i++) {
				result.push(lerp2(points[0], points[1], i / segments));
			}
			return result;
		}
		const result: SliderPoint[] = [];
		for (let i = 0; i <= segments; i++) {
			const t = i / segments;
			let ps = [...points];
			while (ps.length > 1) {
				const next: SliderPoint[] = [];
				for (let j = 0; j < ps.length - 1; j++) {
					next.push(lerp2(ps[j], ps[j + 1], t));
				}
				ps = next;
			}
			result.push(ps[0]);
		}
		return result;
	}

	function flattenPerfectCircle(p0: SliderPoint, p1: SliderPoint, p2: SliderPoint, segments: number = 80): SliderPoint[] {
		const ax = p0.x, ay = p0.y;
		const bx = p1.x, by = p1.y;
		const cx = p2.x, cy = p2.y;

		const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
		if (Math.abs(d) < 0.001) {
			return flattenBezier([p0, p1, p2], segments);
		}

		const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d;
		const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d;

		let a0 = Math.atan2(ay - uy, ax - ux);
		let a2 = Math.atan2(cy - uy, cx - ux);
		let a1 = Math.atan2(by - uy, bx - ux);

		// Direction
		let diff1 = a1 - a0;
		let diff2 = a2 - a0;
		while (diff1 < -Math.PI) diff1 += Math.PI * 2;
		while (diff1 > Math.PI) diff1 -= Math.PI * 2;
		while (diff2 < -Math.PI) diff2 += Math.PI * 2;
		while (diff2 > Math.PI) diff2 -= Math.PI * 2;

		if ((diff1 > 0) !== (diff2 > 0)) {
			if (diff2 > 0) diff2 -= Math.PI * 2;
			else diff2 += Math.PI * 2;
		}

		const radius = Math.hypot(ax - ux, ay - uy);
		const result: SliderPoint[] = [];
		for (let i = 0; i <= segments; i++) {
			const t = i / segments;
			const angle = a0 + diff2 * t;
			result.push({
				x: ux + radius * Math.cos(angle),
				y: uy + radius * Math.sin(angle)
			});
		}
		return result;
	}

	function buildSliderPath(obj: HitObject): SliderPoint[] {
		if (obj.pathCache) return obj.pathCache;

		const allPoints: SliderPoint[] = [{ x: obj.x, y: obj.y }, ...(obj.curvePoints || [])];
		const curveType = obj.curveType || 'B';
		let rawPath: SliderPoint[] = [];

		if (curveType === 'L') {
			for (let i = 0; i < allPoints.length - 1; i++) {
				const seg = flattenBezier([allPoints[i], allPoints[i + 1]], 20);
				if (i > 0) seg.shift();
				rawPath.push(...seg);
			}
		} else if (curveType === 'P' && allPoints.length === 3) {
			rawPath = flattenPerfectCircle(allPoints[0], allPoints[1], allPoints[2]);
		} else {
			// Bezier — split at repeated control points
			const segments: SliderPoint[][] = [];
			let current: SliderPoint[] = [allPoints[0]];
			for (let i = 1; i < allPoints.length; i++) {
				if (allPoints[i].x === allPoints[i - 1].x && allPoints[i].y === allPoints[i - 1].y) {
					segments.push(current);
					current = [allPoints[i]];
				} else {
					current.push(allPoints[i]);
				}
			}
			segments.push(current);
			for (let i = 0; i < segments.length; i++) {
				const seg = flattenBezier(segments[i], 40);
				if (i > 0) seg.shift();
				rawPath.push(...seg);
			}
		}

		if (rawPath.length < 2) {
			rawPath = [{ x: obj.x, y: obj.y }, { x: obj.x + 1, y: obj.y }];
		}

		// Trim to pixelLength
		const targetLen = obj.pixelLength || 100;
		const trimmed: SliderPoint[] = [rawPath[0]];
		let totalLen = 0;
		for (let i = 1; i < rawPath.length; i++) {
			const d = ptDist(rawPath[i - 1], rawPath[i]);
			if (totalLen + d >= targetLen) {
				const remaining = targetLen - totalLen;
				const t = d > 0 ? remaining / d : 0;
				trimmed.push(lerp2(rawPath[i - 1], rawPath[i], t));
				break;
			}
			totalLen += d;
			trimmed.push(rawPath[i]);
		}

		if (trimmed.length < 2) {
			trimmed.push({ x: obj.x + 1, y: obj.y });
		}

		obj.pathCache = trimmed;
		return trimmed;
	}

	function getSliderPosAt(obj: HitObject, progress: number): SliderPoint {
		const path = buildSliderPath(obj);
		if (path.length < 2) return path[0] || { x: obj.x, y: obj.y };

		const slides = obj.slides || 1;
		let spanProgress = progress * slides;
		let span = Math.floor(spanProgress);
		if (span >= slides) span = slides - 1;
		let t = spanProgress - span;
		if (span % 2 === 1) t = 1 - t;

		const lengths: number[] = [0];
		for (let i = 1; i < path.length; i++) {
			lengths.push(lengths[i - 1] + ptDist(path[i - 1], path[i]));
		}
		const totalPathLen = lengths[lengths.length - 1];
		const targetDist = t * totalPathLen;

		for (let i = 1; i < path.length; i++) {
			if (lengths[i] >= targetDist) {
				const segLen = lengths[i] - lengths[i - 1];
				const segT = segLen > 0 ? (targetDist - lengths[i - 1]) / segLen : 0;
				return lerp2(path[i - 1], path[i], segT);
			}
		}
		return path[path.length - 1];
	}

	// ── Parsing ──
	async function parseBeatmap() {
		loading = true;
		try {
			const res = await fetch('/Genryuu Kaiko.osu');
			const text = await res.text();
			const lines = text.split('\n').map(l => l.trim());

			for (const line of lines) {
				if (line.startsWith('Title:')) mapTitle = line.slice(6);
				if (line.startsWith('Artist:')) mapArtist = line.slice(7);
				if (line.startsWith('Version:')) mapVersion = line.slice(8);
				if (line.startsWith('CircleSize:')) circleSize = parseFloat(line.slice(11));
				if (line.startsWith('ApproachRate:')) approachRate = parseFloat(line.slice(13));
				if (line.startsWith('OverallDifficulty:')) overallDifficulty = parseFloat(line.slice(18));
				if (line.startsWith('SliderMultiplier:')) sliderMultiplier = parseFloat(line.slice(17));
			}

			calcSettings();

			// Parse [TimingPoints]
			const tpIdx = lines.indexOf('[TimingPoints]');
			if (tpIdx !== -1) {
				timingPoints = [];
				for (let i = tpIdx + 1; i < lines.length; i++) {
					const line = lines[i];
					if (!line || line.startsWith('[')) break;
					const parts = line.split(',');
					if (parts.length < 7) continue;
					const time = parseFloat(parts[0]);
					const beatLength = parseFloat(parts[1]);
					const uninherited = parts[6] === '1';
					timingPoints.push({
						time,
						beatLength,
						uninherited,
						svMultiplier: uninherited ? 1.0 : Math.max(0.1, Math.min(10, -100 / beatLength))
					});
				}
				timingPoints.sort((a, b) => a.time - b.time);
			}

			// Parse [HitObjects]
			const hitIdx = lines.indexOf('[HitObjects]');
			if (hitIdx === -1) return;

			const objects: HitObject[] = [];
			let comboNum = 1;
			let comboColorIdx = 0;

			for (let i = hitIdx + 1; i < lines.length; i++) {
				const line = lines[i];
				if (!line || line.startsWith('[')) break;
				const parts = line.split(',');
				if (parts.length < 4) continue;

				const x = parseInt(parts[0]);
				const y = parseInt(parts[1]);
				const time = parseInt(parts[2]);
				const type = parseInt(parts[3]);
				const hitsound = parts.length > 4 ? parseInt(parts[4]) : 0x01; // Default hitnormal
				const set = parts.length > 5 ? parts[5] : '';

				// Determine hitsound set (soft/normal/drum) from sample set (parts[5])
				let hitsoundSet: HitsoundSet = 'soft';
				if (set.includes('normal')) hitsoundSet = 'normal';
				else if (set.includes('drum')) hitsoundSet = 'drum';

				const isCircle = (type & 1) !== 0;
				const isSlider = (type & 2) !== 0;
				const isSpinner = (type & 8) !== 0;
				const isNewCombo = (type & 4) !== 0;

				if (isNewCombo) {
					comboNum = 1;
					comboColorIdx = (comboColorIdx + 1) % comboColors.length;
				}

				if (isSpinner) {
					const endTime = parseInt(parts[5]) || (time + 3000);
					const duration = endTime - time;
					const requiredRotations = Math.max(1, Math.floor(duration / 1000 * (3 + overallDifficulty * 0.2)));
					objects.push({
						type: 'spinner',
						x: 256, y: 192, time,
						hit: false, missed: false, comboNum: 0, comboColorIdx: 0,
						spinnerEndTime: endTime,
						spinnerRotations: 0,
						spinnerRequired: requiredRotations,
						spinnerAngle: 0,
						spinnerLastAngle: undefined,
						spinnerActive: false,
						spinnerCompleted: false,
						hitsound,
						hitsoundSet
					});
				} else if (isSlider) {
					const curveData = parts[5] || 'L|0:0';
					const curveParts = curveData.split('|');
					const curveType = curveParts[0];
					const curvePoints: SliderPoint[] = [];
					for (let j = 1; j < curveParts.length; j++) {
						const [px, py] = curveParts[j].split(':').map(Number);
						if (!isNaN(px) && !isNaN(py)) {
							curvePoints.push({ x: px, y: py });
						}
					}

					const slides = parseInt(parts[6]) || 1;
					const pixelLength = parseFloat(parts[7]) || 100;

					const { beatLength, sv } = getTimingAt(time);
					const spanDuration = (pixelLength / (sliderMultiplier * 100 * sv)) * beatLength;
					const totalDuration = spanDuration * slides;

					objects.push({
						type: 'slider',
						x, y, time,
						hit: false, missed: false, comboNum, comboColorIdx,
						curveType, curvePoints, slides, pixelLength,
						duration: totalDuration,
						endTime: time + totalDuration,
						sliderActive: false,
						sliderCompleted: false,
						sliderProgress: 0,
						sliderTicksHit: 0, pathCache: undefined,
						spinnerRotations: 0, spinnerAngle: 0, spinnerLastAngle: undefined,
						spinnerActive: false, spinnerCompleted: false,
						sliderTicksTotal: slides + 1,
						hitsound,
						hitsoundSet
					});
					comboNum++;
				} else if (isCircle) {
					objects.push({
						type: 'circle',
						x, y, time,
						hit: false, missed: false, comboNum, comboColorIdx,
						hitsound,
						hitsoundSet
					});
					comboNum++;
				}
			}

			hitObjects = objects;
		} catch (e) {
			console.error('Failed to parse beatmap:', e);
			hitObjects = [];
		}
		loading = false;
	}

	// ── Audio ──
	async function loadAudio() {
		try {
			songAudio = new Audio('/MP3.mp3');
			songAudio.preload = 'auto';
			songAudio.volume = 0.4;
			audioCtx = new AudioContext();

			// Helper to load hitsound from beatmap (static/) or fallback to skin
			async function loadHitsound(set: HitsoundSet, type: HitsoundType): Promise<AudioBuffer | null> {
				// All hitsounds are .ogg in static/skin, including drum-hitclap.ogg
				const file = `/skin/${set}-${type}.ogg`;
				try {
					const res = await fetch(file);
					if (res.ok) {
						const buf = await res.arrayBuffer();
						return await audioCtx.decodeAudioData(buf);
					}
				} catch {}
				return null;
			}

			// Load all hitsounds
			for (const set of ['soft', 'normal', 'drum'] as HitsoundSet[]) {
				for (const type of ['hitnormal', 'hitclap', 'hitwhistle', 'hitfinish'] as HitsoundType[]) {
					hitsoundBuffers[set][type] = await loadHitsound(set, type);
				}
			}

			// Load miss sound (combobreak.wav)
			try {
				const missRes = await fetch('/skin/combobreak.wav');
				const missBuf = await missRes.arrayBuffer();
				missSoundBuffer = await audioCtx.decodeAudioData(missBuf);
			} catch {}
			audioReady = true;
		} catch (e) {
			console.warn('Audio loading failed:', e);
			audioReady = false;
		}
	}

	function playHitsounds(set: HitsoundSet, bitmask: number) {
		if (!audioCtx || !audioReady) return;
		// Bitmask: 0x01=normal, 0x02=whistle, 0x04=finish, 0x08=clap
		const sounds: HitsoundType[] = [];
		if (bitmask & 0x01) sounds.push('hitnormal');
		if (bitmask & 0x02) sounds.push('hitwhistle');
		if (bitmask & 0x04) sounds.push('hitfinish');
		if (bitmask & 0x08) sounds.push('hitclap');
		for (const type of sounds) {
			const buffer = hitsoundBuffers[set][type] || hitsoundBuffers['soft'][type];
			if (buffer) {
				try {
					const source = audioCtx.createBufferSource();
					source.buffer = buffer;
					const gain = audioCtx.createGain();
					gain.gain.value = 0.5;
					source.connect(gain);
					gain.connect(audioCtx.destination);
					source.start(0);
				} catch {}
			}
		}
	}

	function playMissSound() {
		if (!audioCtx || !missSoundBuffer) return;
		try {
			const source = audioCtx.createBufferSource();
			source.buffer = missSoundBuffer;
			const gain = audioCtx.createGain();
			gain.gain.value = 0.7;
			source.connect(gain);
			gain.connect(audioCtx.destination);
			source.start(0);
		} catch {}
	}

	// ── Game control ──
	async function startGame() {
		score = 0;
		combo = 0;
		maxCombo = 0;
		hits300 = 0;
		hits100 = 0;
		hits50 = 0;
		misses = 0;
		hitEffects = [];

		if (hitObjects.length === 0) {
			await parseBeatmap();
		} else {
			hitObjects = hitObjects.map(o => ({
				...o,
				hit: false, missed: false, hitTime: undefined,
				sliderActive: false, sliderCompleted: false, sliderProgress: 0,
				sliderTicksHit: 0, pathCache: undefined,
				spinnerRotations: 0, spinnerAngle: 0, spinnerLastAngle: undefined,
				spinnerActive: false, spinnerCompleted: false
			}));
		}

		state = 'playing';
		setTimeout(async () => {
			if (canvas) {
				ctx = canvas.getContext('2d');
				resize();
				if (audioCtx && audioCtx.state === 'suspended') {
					await audioCtx.resume();
				}
				if (songAudio && audioReady) {
					songAudio.currentTime = 0;
					songAudio.play().catch(() => {});
				}
				gameStart = performance.now();
				window.addEventListener('mousemove', handleMouseMove);
				window.addEventListener('keydown', handleKeyDown);
				window.addEventListener('keyup', handleKeyUp);
				window.addEventListener('mouseup', handleMouseUp);
				animate();
			}
		}, 50);
	}

	function osuToCanvas(ox: number, oy: number): [number, number] {
		return [
			fieldX + (ox / OSU_WIDTH) * fieldW,
			fieldY + (oy / OSU_HEIGHT) * fieldH
		];
	}

	// ── Input ──
	let isHolding = false;

	function handleClick(e: MouseEvent) {
		if (state !== 'playing' || !canvas) return;
		const rect = canvas.getBoundingClientRect();
		mouseX = e.clientX - rect.left;
		mouseY = e.clientY - rect.top;
		isHolding = true;
		tryHitAt(mouseX, mouseY);
	}

	function handleMouseUp() {
		if (!keyGPressed && !keyHPressed) {
			isHolding = false;
		}
	}

	function handleMouseMove(e: MouseEvent) {
		if (!canvas) return;
		const rect = canvas.getBoundingClientRect();
		mouseX = e.clientX - rect.left;
		mouseY = e.clientY - rect.top;
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (state !== 'playing') return;
		const key = e.key.toLowerCase();
		if (key === 'g') {
			if (!keyGPressed) {
				keyGPressed = true;
				isHolding = true;
				tryHitAt(mouseX, mouseY);
			}
		} else if (key === 'h') {
			if (!keyHPressed) {
				keyHPressed = true;
				isHolding = true;
				tryHitAt(mouseX, mouseY);
			}
		}
	}

	function handleKeyUp(e: KeyboardEvent) {
		const key = e.key.toLowerCase();
		if (key === 'g') keyGPressed = false;
		else if (key === 'h') keyHPressed = false;
		if (!keyGPressed && !keyHPressed) {
			isHolding = false;
		}
	}

	function getNow(): number {
		if (songAudio && audioReady && !songAudio.paused) {
			return songAudio.currentTime * 1000;
		}
		return performance.now() - gameStart;
	}

	function tryHitAt(mx: number, my: number) {
		if (state !== 'playing' || !canvas) return;
		const now = getNow();

		// Activate any spinners in range
		for (const obj of hitObjects) {
			if (obj.type !== 'spinner') continue;
			if (obj.spinnerCompleted || obj.missed) continue;
			if (now >= obj.time && now <= (obj.spinnerEndTime || obj.time)) {
				obj.spinnerActive = true;
			}
		}

		// Find earliest unhit circle/slider head within click range
		let bestObj: HitObject | null = null;
		let bestTime = Infinity;

		for (const obj of hitObjects) {
			if (obj.type === 'spinner') continue;
			if (obj.hit || obj.missed) continue;
			const timeDiff = now - obj.time;
			if (timeDiff < -approachDuration || timeDiff > hitWindow50) continue;

			const [cx, cy] = osuToCanvas(obj.x, obj.y);
			const d = Math.hypot(mx - cx, my - cy);
			const scaledRadius = circleRadius * scale;

			if (d <= scaledRadius * 1.2 && obj.time < bestTime) {
				bestObj = obj;
				bestTime = obj.time;
			}
		}

		if (!bestObj) return;

		const timeDiff = Math.abs(now - bestObj.time);
		bestObj.hitTime = now;
		const [cx, cy] = osuToCanvas(bestObj.x, bestObj.y);

		// Use hitsound info from object
		const hitsoundSet = bestObj.hitsoundSet || 'soft';
		const hitsoundBitmask = bestObj.hitsound || 0x01;

		if (bestObj.type === 'slider') {
			bestObj.hit = true;
			if (timeDiff <= hitWindow50) {
				bestObj.sliderActive = true;
				bestObj.sliderTicksHit = 1;
				combo++;
				if (combo > maxCombo) maxCombo = combo;
				playHitsounds(hitsoundSet, hitsoundBitmask);
				if (timeDiff <= hitWindow300) {
					hitEffects.push({ x: cx, y: cy, time: now, text: '300', color: '#00f0ff' });
				} else if (timeDiff <= hitWindow100) {
					hitEffects.push({ x: cx, y: cy, time: now, text: '100', color: '#4ade80' });
				} else {
					hitEffects.push({ x: cx, y: cy, time: now, text: '50', color: '#facc15' });
				}
			} else {
				bestObj.sliderActive = true;
				bestObj.sliderTicksHit = 0;
			}
		} else {
			// Circle
			bestObj.hit = true;
			if (timeDiff <= hitWindow300) {
				score += 300 * (1 + combo * 0.02);
				combo++;
				hits300++;
				hitEffects.push({ x: cx, y: cy, time: now, text: '300', color: '#00f0ff' });
				playHitsounds(hitsoundSet, hitsoundBitmask);
			} else if (timeDiff <= hitWindow100) {
				score += 100 * (1 + combo * 0.02);
				combo++;
				hits100++;
				hitEffects.push({ x: cx, y: cy, time: now, text: '100', color: '#4ade80' });
				playHitsounds(hitsoundSet, hitsoundBitmask);
			} else if (timeDiff <= hitWindow50) {
				score += 50 * (1 + combo * 0.02);
				combo++;
				hits50++;
				hitEffects.push({ x: cx, y: cy, time: now, text: '50', color: '#facc15' });
				playHitsounds(hitsoundSet, hitsoundBitmask);
			} else {
				bestObj.missed = true;
				bestObj.hit = false;
				playMissSound();
				combo = 0;
				misses++;
				hitEffects.push({ x: cx, y: cy, time: now, text: 'X', color: '#ef4444' });
			}
			if (combo > maxCombo) maxCombo = combo;
		}
	}

	// ── Per-frame slider & spinner updates ──
	function updateSliders(now: number) {
		for (const obj of hitObjects) {
			if (obj.type !== 'slider') continue;
			if (obj.sliderCompleted || obj.missed) continue;

			const endTime = obj.endTime || (obj.time + (obj.duration || 0));

			if (obj.sliderActive && now >= obj.time) {
				const elapsed = now - obj.time;
				const duration = obj.duration || 1;
				obj.sliderProgress = Math.min(elapsed / duration, 1);

				// Check slider end
				if (now >= endTime) {
					obj.sliderCompleted = true;
					obj.sliderActive = false;

					const ballPos = getSliderPosAt(obj, 1);
					const [bx, by] = osuToCanvas(ballPos.x, ballPos.y);
					const d = Math.hypot(mouseX - bx, mouseY - by);
					const followRadius = circleRadius * scale * 2.4;
					const cursorOnBall = d <= followRadius && isHolding;

					const ticksTotal = obj.sliderTicksTotal || 1;
					const ticksHit = (obj.sliderTicksHit || 0) + (cursorOnBall ? 1 : 0);
					const ratio = ticksHit / ticksTotal;

					const [ex, ey] = osuToCanvas(ballPos.x, ballPos.y);

					if (ratio >= 0.9) {
						score += 300 * (1 + combo * 0.02);
						combo++;
						hits300++;
						hitEffects.push({ x: ex, y: ey, time: now, text: '300', color: '#00f0ff' });
					} else if (ratio >= 0.5) {
						score += 100 * (1 + combo * 0.02);
						combo++;
						hits100++;
						hitEffects.push({ x: ex, y: ey, time: now, text: '100', color: '#4ade80' });
					} else if (ratio > 0) {
						score += 50 * (1 + combo * 0.02);
						combo++;
						hits50++;
						hitEffects.push({ x: ex, y: ey, time: now, text: '50', color: '#facc15' });
					   } else {
						   playMissSound();
						   combo = 0;
						   misses++;
						   hitEffects.push({ x: ex, y: ey, time: now, text: 'X', color: '#ef4444' });
					   }
					if (combo > maxCombo) maxCombo = combo;
					// Play slider head hitsound
					const hitsoundSet = obj.hitsoundSet || 'soft';
					const hitsoundBitmask = obj.hitsound || 0x01;
					playHitsounds(hitsoundSet, hitsoundBitmask);
				}
			}

			// Miss: never activated and time expired
			if (!obj.hit && !obj.missed && !obj.sliderActive && now > obj.time + missWindow) {
				obj.missed = true;
				   playMissSound();
				   combo = 0;
				   misses++;
				   const [cx, cy] = osuToCanvas(obj.x, obj.y);
				   hitEffects.push({ x: cx, y: cy, time: now, text: 'X', color: '#ef4444' });
			}

			// Force-complete overdue active sliders
			if (obj.sliderActive && now > endTime + 100) {
				obj.sliderCompleted = true;
				obj.sliderActive = false;
			}
		}
	}

	function updateSpinners(now: number) {
		for (const obj of hitObjects) {
			if (obj.type !== 'spinner') continue;
			if (obj.spinnerCompleted || obj.missed) continue;

			const endTime = obj.spinnerEndTime || obj.time;

			if (now >= obj.time && now <= endTime && !obj.spinnerActive) {
				obj.spinnerActive = true;
			}

			if (obj.spinnerActive && isHolding) {
				const [cx, cy] = osuToCanvas(256, 192);
				const angle = Math.atan2(mouseY - cy, mouseX - cx);

				if (obj.spinnerLastAngle !== undefined) {
					let delta = angle - obj.spinnerLastAngle;
					while (delta > Math.PI) delta -= Math.PI * 2;
					while (delta < -Math.PI) delta += Math.PI * 2;
					obj.spinnerAngle = (obj.spinnerAngle || 0) + Math.abs(delta);
					obj.spinnerRotations = (obj.spinnerAngle || 0) / (Math.PI * 2);
				}
				obj.spinnerLastAngle = angle;
			} else if (obj.spinnerActive && !isHolding) {
				obj.spinnerLastAngle = undefined;
			}

			if (now > endTime) {
				obj.spinnerActive = false;
				obj.spinnerCompleted = true;
				obj.hit = true;

				const rotations = obj.spinnerRotations || 0;
				const required = obj.spinnerRequired || 1;
				const ratio = rotations / required;
				const [cx, cy] = osuToCanvas(256, 192);

				if (ratio >= 1.0) {
					score += 300 * (1 + combo * 0.02);
					combo++;
					hits300++;
					hitEffects.push({ x: cx, y: cy, time: now, text: '300', color: '#00f0ff' });
				} else if (ratio >= 0.5) {
					score += 100 * (1 + combo * 0.02);
					combo++;
					hits100++;
					hitEffects.push({ x: cx, y: cy, time: now, text: '100', color: '#4ade80' });
				} else if (ratio >= 0.25) {
					score += 50 * (1 + combo * 0.02);
					combo++;
					hits50++;
					hitEffects.push({ x: cx, y: cy, time: now, text: '50', color: '#facc15' });
				} else {
					combo = 0;
					misses++;
					hitEffects.push({ x: cx, y: cy, time: now, text: 'X', color: '#ef4444' });
				}
				if (combo > maxCombo) maxCombo = combo;
			}
		}
	}

	// ── Rendering ──
	function updateField() {
		if (!canvas) return;
		const cw = canvas.width;
		const ch = canvas.height;
		const padding = 40;
		const targetRatio = OSU_WIDTH / OSU_HEIGHT;
		const availW = cw - padding * 2;
		const availH = ch - padding * 2;
		if (availW / availH > targetRatio) {
			fieldH = availH;
			fieldW = fieldH * targetRatio;
		} else {
			fieldW = availW;
			fieldH = fieldW / targetRatio;
		}
		fieldX = (cw - fieldW) / 2;
		fieldY = (ch - fieldH) / 2;
		scale = fieldW / OSU_WIDTH;
	}

	function drawSliderBody(obj: HitObject, scaledRadius: number) {
		if (!ctx) return;
		const path = buildSliderPath(obj);
		if (path.length < 2) return;

		// Slider body border
		ctx.beginPath();
		const [sx, sy] = osuToCanvas(path[0].x, path[0].y);
		ctx.moveTo(sx, sy);
		for (let i = 1; i < path.length; i++) {
			const [px, py] = osuToCanvas(path[i].x, path[i].y);
			ctx.lineTo(px, py);
		}
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';

		// Outer border
		ctx.strokeStyle = 'rgba(0, 200, 255, 0.35)';
		ctx.lineWidth = scaledRadius * 2 + 2;
		ctx.stroke();

		// Inner fill
		ctx.strokeStyle = 'rgba(10, 40, 80, 0.45)';
		ctx.lineWidth = scaledRadius * 2 - 2;
		ctx.stroke();

		// End circle
		const endPt = path[path.length - 1];
		const [ex, ey] = osuToCanvas(endPt.x, endPt.y);
		ctx.beginPath();
		ctx.arc(ex, ey, scaledRadius * 0.6, 0, Math.PI * 2);
		ctx.strokeStyle = 'rgba(0, 200, 255, 0.5)';
		ctx.lineWidth = 2;
		ctx.stroke();

		// Repeat arrows
		if ((obj.slides || 1) > 1) {
			ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
			ctx.font = `bold ${Math.round(16 * scale)}px CaskaydiaCove NF, monospace`;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText('↺', ex, ey);
		}
	}

	function drawSliderBall(obj: HitObject, scaledRadius: number) {
	   if (!ctx || !obj.sliderActive) return;
	   const pos = getSliderPosAt(obj, obj.sliderProgress || 0);
	   const [bx, by] = osuToCanvas(pos.x, pos.y);

	   // Follow circle
	   if (skinLoaded && skin['sliderfollowcircle']) {
		   ctx.save();
		   ctx.globalAlpha = 0.5;
		   ctx.drawImage(skin['sliderfollowcircle'], bx - scaledRadius * 2, by - scaledRadius * 2, scaledRadius * 4, scaledRadius * 4);
		   ctx.restore();
	   } else {
		   ctx.beginPath();
		   ctx.arc(bx, by, scaledRadius * 2.0, 0, Math.PI * 2);
		   ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
		   ctx.lineWidth = 2;
		   ctx.stroke();
	   }

	   // Ball (animated)
	   if (skinLoaded && sliderBallFrames.length > 0) {
		   // Animate based on slider progress
		   const frame = Math.floor((obj.sliderProgress || 0) * sliderBallFrames.length) % sliderBallFrames.length;
		   ctx.drawImage(sliderBallFrames[frame], bx - scaledRadius * 0.8, by - scaledRadius * 0.8, scaledRadius * 1.6, scaledRadius * 1.6);
	   } else {
		   ctx.beginPath();
		   ctx.arc(bx, by, scaledRadius * 0.8, 0, Math.PI * 2);
		   const grad = ctx.createRadialGradient(bx, by, 0, bx, by, scaledRadius * 0.8);
		   grad.addColorStop(0, 'rgba(0, 240, 255, 0.9)');
		   grad.addColorStop(0.5, 'rgba(0, 180, 220, 0.6)');
		   grad.addColorStop(1, 'rgba(0, 100, 150, 0.3)');
		   ctx.fillStyle = grad;
		   ctx.fill();
	   }
	}

	function drawSpinner(obj: HitObject) {
	   if (!ctx || !canvas) return;
	   const [cx, cy] = osuToCanvas(256, 192);
	   const rotations = obj.spinnerRotations || 0;
	   const required = obj.spinnerRequired || 1;
	   const progress = Math.min(rotations / required, 1);

	   // Background dim
	   ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
	   ctx.fillRect(0, 0, canvas.width, canvas.height);

	   const outerR = Math.min(fieldW, fieldH) * 0.35;

	   // Spinner circle
	   if (skinLoaded && skin['spinner-circle']) {
		   ctx.drawImage(skin['spinner-circle'], cx - outerR, cy - outerR, outerR * 2, outerR * 2);
	   } else {
		   ctx.beginPath();
		   ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
		   ctx.strokeStyle = 'rgba(100, 150, 200, 0.3)';
		   ctx.lineWidth = 4;
		   ctx.stroke();
	   }

	   // Spinner approach circle
	   if (skinLoaded && skin['spinner-approachcircle']) {
		   ctx.save();
		   ctx.globalAlpha = 0.5 + 0.5 * (1 - progress);
		   ctx.drawImage(skin['spinner-approachcircle'], cx - outerR * 1.2, cy - outerR * 1.2, outerR * 2.4, outerR * 2.4);
		   ctx.restore();
	   }

	   // Progress ring (fallback)
	   if (!skin['spinner-circle']) {
		   ctx.beginPath();
		   ctx.arc(cx, cy, outerR, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
		   ctx.strokeStyle = progress >= 1 ? 'rgba(0, 255, 100, 0.8)' : 'rgba(0, 240, 255, 0.8)';
		   ctx.lineWidth = 6;
		   ctx.stroke();
	   }

	   // Center dot
	   ctx.beginPath();
	   ctx.arc(cx, cy, 6, 0, Math.PI * 2);
	   ctx.fillStyle = 'rgba(0, 240, 255, 0.9)';
	   ctx.fill();

	   // Text
	   ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
	   ctx.font = 'bold 18px CaskaydiaCove NF, monospace';
	   ctx.textAlign = 'center';
	   ctx.textBaseline = 'middle';
	   if (progress >= 1 && skin['spinner-clear']) {
		   ctx.drawImage(skin['spinner-clear'], cx - outerR * 0.7, cy + outerR * 0.7, outerR * 1.4, outerR * 0.5);
	   } else if (skin['spinner-spin']) {
		   ctx.drawImage(skin['spinner-spin'], cx - outerR * 0.7, cy + outerR * 0.7, outerR * 1.4, outerR * 0.5);
	   } else {
		   ctx.fillText(progress >= 1 ? 'CLEAR!' : 'SPIN!', cx, cy + outerR + 30);
	   }

	   // RPM
	   const elapsed = (gameTime - obj.time) / 1000;
	   const rpm = elapsed > 0.1 ? Math.round(rotations * 60 / elapsed) : 0;
	   ctx.font = '14px CaskaydiaCove NF, monospace';
	   ctx.fillStyle = 'rgba(200, 220, 240, 0.7)';
	   ctx.fillText(`${rpm} RPM`, cx, cy + outerR + 55);
	}

	function getLastEndTime(): number {
		if (hitObjects.length === 0) return 0;
		const lastObj = hitObjects[hitObjects.length - 1];
		if (lastObj.type === 'spinner') return lastObj.spinnerEndTime || lastObj.time;
		if (lastObj.type === 'slider') return lastObj.endTime || lastObj.time;
		return lastObj.time;
	}

	function animate() {
		if (!ctx || !canvas) return;

		if (state === 'playing') {
			gameTime = getNow();
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			updateField();

			updateSliders(gameTime);
			updateSpinners(gameTime);

			// Check for missed circles
			for (const obj of hitObjects) {
				if (obj.type !== 'circle') continue;
				if (!obj.hit && !obj.missed && gameTime > obj.time + missWindow) {
					obj.missed = true;
					combo = 0;
					misses++;
					const [cx, cy] = osuToCanvas(obj.x, obj.y);
					hitEffects.push({ x: cx, y: cy, time: gameTime, text: 'X', color: '#ef4444' });
				}
			}

			// Check if map is done
			const lastEndTime = getLastEndTime();
			if (hitObjects.length > 0 && gameTime > lastEndTime + 2000) {
				state = 'results';
				if (songAudio) songAudio.pause();
				window.removeEventListener('mousemove', handleMouseMove);
				window.removeEventListener('keydown', handleKeyDown);
				window.removeEventListener('keyup', handleKeyUp);
				window.removeEventListener('mouseup', handleMouseUp);
				keyGPressed = false;
				keyHPressed = false;
				isHolding = false;
				return;
			}

			// Playfield border
			ctx.strokeStyle = 'rgba(100, 150, 200, 0.08)';
			ctx.lineWidth = 1;
			ctx.strokeRect(fieldX, fieldY, fieldW, fieldH);

			// Visible objects
			const visible = hitObjects.filter(obj => {
				if (obj.type === 'spinner') {
					return !obj.spinnerCompleted && !obj.missed &&
						gameTime >= obj.time - approachDuration &&
						gameTime <= (obj.spinnerEndTime || obj.time) + 500;
				}
				if (obj.type === 'slider') {
					return !obj.missed && !obj.sliderCompleted &&
						gameTime >= obj.time - approachDuration &&
						gameTime <= (obj.endTime || obj.time) + 500;
				}
				return !obj.hit && !obj.missed &&
					gameTime >= obj.time - approachDuration &&
					gameTime <= obj.time + missWindow;
			});

			const scaledRadius = circleRadius * scale;

			// Draw in reverse so earliest is on top
			for (let i = visible.length - 1; i >= 0; i--) {
				const obj = visible[i];

				if (obj.type === 'spinner') {
					if (obj.spinnerActive) drawSpinner(obj);
					continue;
				}

				const [cx, cy] = osuToCanvas(obj.x, obj.y);
				const progress = (gameTime - (obj.time - approachDuration)) / approachDuration;
				const fadeT = fadeInDuration / approachDuration;
				const alpha = Math.max(0, Math.min(progress / fadeT, 1));

				ctx.globalAlpha = alpha;

				if (obj.type === 'slider') {
					drawSliderBody(obj, scaledRadius);
					if (obj.sliderActive) drawSliderBall(obj, scaledRadius);
				}


				   // Head circle (for circles and un-hit slider heads)
				   if (!obj.hit && skinLoaded) {
					   // Draw tinted hitcircle
					   const base = tintedCircles[obj.comboColorIdx % tintedCircles.length] || skin['hitcircle'];
					   if (base) {
						   ctx.drawImage(base, cx - scaledRadius, cy - scaledRadius, scaledRadius * 2, scaledRadius * 2);
					   }
					   // Overlay
					   if (skin['hitcircleoverlay']) {
						   ctx.drawImage(skin['hitcircleoverlay'], cx - scaledRadius, cy - scaledRadius, scaledRadius * 2, scaledRadius * 2);
					   }
					   // Approach circle
					   if (progress < 1 && skin['approachcircle']) {
						   const approachR = scaledRadius + (scaledRadius * 2.5) * (1 - Math.min(progress, 1));
						   ctx.save();
						   ctx.globalAlpha = 0.7 * (1 - progress * 0.3);
						   ctx.drawImage(skin['approachcircle'], cx - approachR, cy - approachR, approachR * 2, approachR * 2);
						   ctx.restore();
					   }
					   // Combo number (fallback to text if image missing)
					   const comboStr = String(obj.comboNum);
					   let comboW = 0;
					   for (let k = 0; k < comboStr.length; k++) {
						   const digit = parseInt(comboStr[k]);
						   if (comboNumImages[digit]) comboW += scaledRadius * 0.7;
					   }
					   let drawX = cx - comboW / 2 + (comboNumImages[0] ? scaledRadius * 0.35 : 0);
					   for (let k = 0; k < comboStr.length; k++) {
						   const digit = parseInt(comboStr[k]);
						   if (comboNumImages[digit]) {
							   ctx.drawImage(comboNumImages[digit], drawX - scaledRadius * 0.35, cy - scaledRadius * 0.6, scaledRadius * 0.7, scaledRadius * 1.2);
							   drawX += scaledRadius * 0.7;
						   } else {
							   ctx.fillStyle = '#fff';
							   ctx.font = `bold ${Math.round(14 * scale)}px CaskaydiaCove NF, monospace`;
							   ctx.textAlign = 'center';
							   ctx.textBaseline = 'middle';
							   ctx.fillText(comboStr[k], cx, cy);
						   }
					   }
				   }

				ctx.globalAlpha = 1;
			}

			   // Hit effects
			   hitEffects = hitEffects.filter(e => gameTime - e.time < 500);
			   for (const e of hitEffects) {
				   const age = (gameTime - e.time) / 500;
				   ctx.globalAlpha = 1 - age;
				   // Map text to skin key
				   let key = '';
				   if (e.text === '300') key = 'hit300';
				   else if (e.text === '100') key = 'hit100';
				   else if (e.text === '50') key = 'hit50';
				   else if (e.text === 'X') key = 'hit0';
				   if (skinLoaded && skin[key]) {
					   ctx.drawImage(skin[key], e.x - scaledRadius, e.y - scaledRadius - age * 25, scaledRadius * 2, scaledRadius * 2);
				   } else {
					   ctx.fillStyle = e.color;
					   ctx.font = `bold ${Math.round(16 + age * 10)}px CaskaydiaCove NF, monospace`;
					   ctx.textAlign = 'center';
					   ctx.textBaseline = 'middle';
					   ctx.fillText(e.text, e.x, e.y - age * 25);
				   }
				   ctx.globalAlpha = 1;
			   }

			// HUD
			ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
			ctx.font = '14px CaskaydiaCove NF, monospace';
			ctx.textAlign = 'left';
			ctx.fillText(`score: ${Math.round(score)}`, 16, 28);
			ctx.fillText(`combo: ${combo}x`, 16, 48);

			ctx.textAlign = 'right';
			const totalHits = hits300 + hits100 + hits50 + misses;
			const acc = totalHits > 0
				? ((hits300 * 300 + hits100 * 100 + hits50 * 50) / (totalHits * 300) * 100).toFixed(1)
				: '100.0';
			ctx.fillText(`${acc}%`, canvas.width - 16, 28);

			// Progress bar
			if (hitObjects.length > 0) {
				const progress = Math.min(gameTime / lastEndTime, 1);
				ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
				ctx.fillRect(0, canvas.height - 3, canvas.width, 3);
				ctx.fillStyle = 'rgba(0, 240, 255, 0.6)';
				ctx.fillRect(0, canvas.height - 3, canvas.width * progress, 3);
			}

			// Big combo
			if (combo >= 5) {
				ctx.globalAlpha = 0.25;
				ctx.fillStyle = '#00f0ff';
				ctx.font = `bold ${50 + Math.min(combo, 40)}px CaskaydiaCove NF, monospace`;
				ctx.textAlign = 'center';
				ctx.fillText(`${combo}x`, canvas.width / 2, canvas.height - 30);
				ctx.globalAlpha = 1;
			}

			// Key indicators
			const keySize = 36;
			const keyGap = 8;
			const keyY = canvas.height - 60;
			const keyX = canvas.width - 100;

			ctx.fillStyle = keyGPressed ? 'rgba(0, 240, 255, 0.35)' : 'rgba(100, 150, 200, 0.1)';
			ctx.strokeStyle = keyGPressed ? 'rgba(0, 240, 255, 0.8)' : 'rgba(100, 150, 200, 0.3)';
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.roundRect(keyX, keyY, keySize, keySize, 6);
			ctx.fill();
			ctx.stroke();
			ctx.fillStyle = keyGPressed ? '#00f0ff' : 'rgba(200, 220, 240, 0.6)';
			ctx.font = 'bold 16px CaskaydiaCove NF, monospace';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText('G', keyX + keySize / 2, keyY + keySize / 2);

			const hKeyX = keyX + keySize + keyGap;
			ctx.fillStyle = keyHPressed ? 'rgba(0, 240, 255, 0.35)' : 'rgba(100, 150, 200, 0.1)';
			ctx.strokeStyle = keyHPressed ? 'rgba(0, 240, 255, 0.8)' : 'rgba(100, 150, 200, 0.3)';
			ctx.beginPath();
			ctx.roundRect(hKeyX, keyY, keySize, keySize, 6);
			ctx.fill();
			ctx.stroke();
			ctx.fillStyle = keyHPressed ? '#00f0ff' : 'rgba(200, 220, 240, 0.6)';
			ctx.fillText('H', hKeyX + keySize / 2, keyY + keySize / 2);
		}

		if (state === 'playing') {
			animFrame = requestAnimationFrame(animate);
		}
	}

	function resize() {
		if (!canvas) return;
		const rect = canvas.parentElement?.getBoundingClientRect();
		if (rect) {
			canvas.width = rect.width;
			canvas.height = rect.height;
		}
		updateField();
	}

	function getGrade(): string {
		const totalHits = hits300 + hits100 + hits50 + misses;
		if (totalHits === 0) return 'D';
		const acc = (hits300 * 300 + hits100 * 100 + hits50 * 50) / (totalHits * 300) * 100;
		if (acc === 100) return 'SS';
		if (acc >= 95 && misses === 0) return 'S';
		if (acc >= 90) return 'A';
		if (acc >= 80) return 'B';
		if (acc >= 70) return 'C';
		return 'D';
	}

	function getGradeColor(grade: string): string {
		const colors: Record<string, string> = {
			'SS': '#00f0ff', 'S': '#facc15', 'A': '#4ade80',
			'B': '#3b82f6', 'C': '#a855f7', 'D': '#ef4444'
		};
		return colors[grade] || '#fff';
	}

	onMount(() => {
		if (!browser) return;
		mounted = true;
		window.addEventListener('resize', resize);
		parseBeatmap();
		loadAudio();
		loadSkin();
	});

	onDestroy(() => {
		if (!browser) return;
		cancelAnimationFrame(animFrame);
		window.removeEventListener('resize', resize);
		window.removeEventListener('mousemove', handleMouseMove);
		window.removeEventListener('keydown', handleKeyDown);
		window.removeEventListener('keyup', handleKeyUp);
		window.removeEventListener('mouseup', handleMouseUp);
		if (songAudio) { songAudio.pause(); songAudio.src = ''; }
		if (audioCtx) { audioCtx.close().catch(() => {}); }
	});

	$: finalAcc = (() => {
		const totalHits = hits300 + hits100 + hits50 + misses;
		if (totalHits === 0) return 100;
		return (hits300 * 300 + hits100 * 100 + hits50 * 50) / (totalHits * 300) * 100;
	})();

	$: objectCounts = (() => {
		let c = 0, s = 0, sp = 0;
		for (const obj of hitObjects) {
			if (obj.type === 'circle') c++;
			else if (obj.type === 'slider') s++;
			else if (obj.type === 'spinner') sp++;
		}
		return { circles: c, sliders: s, spinners: sp };
	})();
</script>

<svelte:head>
	<title>osu!</title>
</svelte:head>

{#if mounted}
<section class="fixed inset-0 bg-ocean-950 z-50 flex flex-col font-cascadia" in:fade={{ duration: 300 }}>
	{#if state === 'menu'}
		<div class="flex-1 flex flex-col items-center justify-center gap-6" in:fade={{ duration: 200 }}>
			<div class="text-center">
				<h1 class="text-5xl font-bold text-ocean-cyan mb-2">osu!</h1>
				<p class="text-ocean-400 text-sm">click the circles. to the beat.</p>
				<p class="text-ocean-500 text-xs mt-1">a hidden easter egg — you found it!</p>
			</div>

			{#if mapTitle}
				<div class="bg-ocean-800/40 rounded-lg p-4 border border-ocean-700/30 text-center max-w-sm">
					<p class="text-ocean-100 text-sm font-bold">{mapArtist} - {mapTitle}</p>
					<p class="text-ocean-cyan text-xs mt-1">[{mapVersion}]</p>
					<div class="flex justify-center gap-4 mt-2 text-xs text-ocean-400">
						<span>CS{circleSize}</span>
						<span>AR{approachRate}</span>
						<span>OD{overallDifficulty}</span>
					</div>
					<div class="flex justify-center gap-3 mt-1 text-xs text-ocean-500">
						<span>{objectCounts.circles} circles</span>
						<span>{objectCounts.sliders} sliders</span>
						<span>{objectCounts.spinners} spinners</span>
					</div>
				</div>
			{/if}

			<button
				class="px-10 py-4 bg-ocean-cyan/15 text-ocean-cyan border-2 border-ocean-cyan/40 rounded-xl hover:bg-ocean-cyan/25 hover:border-ocean-cyan/60 transition-all text-lg tracking-wide disabled:opacity-50"
				on:click={startGame}
				disabled={loading}
			>
				{loading ? '⏳ loading...' : '▶ play'}
			</button>

			<div class="text-ocean-500 text-xs text-center mt-4 space-y-1">
				<p>click or press <span class="text-ocean-cyan">G</span> / <span class="text-ocean-cyan">H</span> when the approach circle closes in</p>
				<p><span class="text-ocean-cyan/60">300</span> = perfect · <span class="text-ocean-green/60">100</span> = good · <span class="text-ocean-yellow/60">50</span> = meh · <span class="text-ocean-red/60">X</span> = miss</p>
				<p class="mt-1 text-ocean-400/50">hold through sliders · spin for spinners</p>
				<p class="mt-2 text-ocean-400/60">♪ audio enabled</p>
			</div>

			<a
				href="/"
				class="text-ocean-500 hover:text-ocean-400 text-xs mt-4 transition-colors"
			>
				← back to site
			</a>
		</div>
	{/if}

	<div
		class="flex-1 relative"
		class:hidden={state !== 'playing'}
		on:click={handleClick}
		on:mouseup={handleMouseUp}
	>
		<canvas
			bind:this={canvas}
			class="w-full h-full"
		/>
	</div>

	{#if state === 'results'}
		<div class="flex-1 flex flex-col items-center justify-center gap-6" in:fade={{ duration: 300 }}>
			<div class="text-center">
				<p class="text-ocean-400 text-xs mb-1">{mapArtist} - {mapTitle} [{mapVersion}]</p>
				<p
					class="text-8xl font-bold mb-2"
					style="color: {getGradeColor(getGrade())}"
				>
					{getGrade()}
				</p>
				<p class="text-ocean-400 text-sm">rank achieved</p>
			</div>

			<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-lg">
				<div class="bg-ocean-800/40 rounded-lg p-4 border border-ocean-700/30 text-center">
					<p class="text-ocean-cyan text-2xl font-bold">{Math.round(score)}</p>
					<p class="text-ocean-500 text-xs mt-1">score</p>
				</div>
				<div class="bg-ocean-800/40 rounded-lg p-4 border border-ocean-700/30 text-center">
					<p class="text-ocean-green text-2xl font-bold">{finalAcc.toFixed(1)}%</p>
					<p class="text-ocean-500 text-xs mt-1">accuracy</p>
				</div>
				<div class="bg-ocean-800/40 rounded-lg p-4 border border-ocean-700/30 text-center">
					<p class="text-ocean-yellow text-2xl font-bold">{maxCombo}x</p>
					<p class="text-ocean-500 text-xs mt-1">max combo</p>
				</div>
				<div class="bg-ocean-800/40 rounded-lg p-4 border border-ocean-700/30 text-center">
					<p class="text-ocean-magenta text-2xl font-bold">{hitObjects.length}</p>
					<p class="text-ocean-500 text-xs mt-1">objects</p>
				</div>
			</div>

			<div class="flex gap-6 text-sm">
				<span class="text-ocean-cyan">300: <span class="font-bold">{hits300}</span></span>
				<span class="text-ocean-green">100: <span class="font-bold">{hits100}</span></span>
				<span class="text-ocean-yellow">50: <span class="font-bold">{hits50}</span></span>
				<span class="text-ocean-red">miss: <span class="font-bold">{misses}</span></span>
			</div>

			<div class="flex gap-3 mt-4">
				<button
					class="px-6 py-2.5 bg-ocean-cyan/15 text-ocean-cyan border border-ocean-cyan/30 rounded-lg hover:bg-ocean-cyan/25 transition-all text-sm"
					on:click={startGame}
				>
					retry
				</button>
				<a
					href="/"
					class="px-6 py-2.5 bg-ocean-800/40 text-ocean-400 border border-ocean-700/30 rounded-lg hover:border-ocean-500/30 transition-all text-sm inline-flex items-center"
				>
					back to site
				</a>
			</div>
		</div>
	{/if}
</section>
{/if}
