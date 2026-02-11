<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/env';

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null;
	let animFrame: number;
	let mouseX = -100;
	let mouseY = -100;

	interface TrailPoint {
		x: number;
		y: number;
		time: number;
	}

	let points: TrailPoint[] = [];
	const trailLife = 300; // how long trail stays (ms)

	function handleMouseMove(e: MouseEvent) {
		mouseX = e.clientX;
		mouseY = e.clientY;
		const now = performance.now();

		const last = points[points.length - 1];
		if (!last || Math.hypot(mouseX - last.x, mouseY - last.y) > 1) {
			points.push({ x: mouseX, y: mouseY, time: now });
		}
	}

	function animate() {
		if (!ctx || !canvas) return;
		const now = performance.now();

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Remove expired points
		points = points.filter(p => now - p.time < trailLife);

		// Draw trail with smooth fade from tail to head
		// Strategy: draw progressively shorter sub-paths from tail→head,
		// each layer adds a little more opacity. They stack additively near the head
		// giving a smooth fade effect with no visible segment breaks.
		if (points.length >= 3) {
			const steps = 20;

			// Helper: draw a smooth bezier path from startIdx to end
			function drawSubPath(startIdx: number) {
				ctx!.beginPath();
				ctx!.moveTo(points[startIdx].x, points[startIdx].y);

				for (let i = startIdx + 1; i < points.length - 1; i++) {
					const curr = points[i];
					const next = points[i + 1];
					const mx = (curr.x + next.x) / 2;
					const my = (curr.y + next.y) / 2;
					ctx!.quadraticCurveTo(curr.x, curr.y, mx, my);
				}

				const last = points[points.length - 1];
				ctx!.lineTo(last.x, last.y);
			}

			// Single trail layer — clean, no glow
			for (let s = 0; s < steps; s++) {
				const startFrac = s / steps;
				const startIdx = Math.floor(startFrac * (points.length - 2));
				const alpha = 0.07;

				drawSubPath(startIdx);
				ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
				ctx.lineWidth = 5;
				ctx.lineCap = 'round';
				ctx.lineJoin = 'round';
				ctx.stroke();
			}
		}

		// Cursor dot — bright yellow, large
		if (mouseX > 0 && mouseY > 0) {
			ctx.beginPath();
			ctx.arc(mouseX, mouseY, 30, 0, Math.PI * 2);
			const glowGrad = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 30);
			glowGrad.addColorStop(0, 'rgba(255, 245, 70, 0.4)');
			glowGrad.addColorStop(0.35, 'rgba(255, 225, 30, 0.12)');
			glowGrad.addColorStop(1, 'rgba(255, 220, 0, 0)');
			ctx.fillStyle = glowGrad;
			ctx.fill();

			ctx.beginPath();
			ctx.arc(mouseX, mouseY, 10, 0, Math.PI * 2);
			const dotGrad = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 10);
			dotGrad.addColorStop(0, 'rgba(255, 255, 150, 1)');
			dotGrad.addColorStop(0.5, 'rgba(255, 240, 50, 0.95)');
			dotGrad.addColorStop(1, 'rgba(255, 215, 0, 0.4)');
			ctx.fillStyle = dotGrad;
			ctx.fill();
		}

		animFrame = requestAnimationFrame(animate);
	}

	function resize() {
		if (!canvas) return;
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
	}

	onMount(() => {
		if (!browser) return;

		ctx = canvas.getContext('2d');
		resize();

		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('resize', resize);

		animate();
	});

	onDestroy(() => {
		if (!browser) return;
		cancelAnimationFrame(animFrame);
		window.removeEventListener('mousemove', handleMouseMove);
		window.removeEventListener('resize', resize);
	});
</script>

<canvas
	bind:this={canvas}
	class="fixed inset-0 pointer-events-none z-[999]"
/>
