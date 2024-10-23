import { Star } from './entities/star.js';

export function getFillGradient(context, x, y, innerRadius, relativeRadius, color) {
		const gradient = context.createRadialGradient(x, y, innerRadius, x, y, relativeRadius);
		gradient.addColorStop(0, color.inner);
		gradient.addColorStop(1, color.outer);
		return gradient;
}

export function buildStars(canvasWidth, canvasHeight) {
	const result = [];
	const totalStars = Math.max(Math.floor(Math.random() * 500), 25);
	for (let i = 0; i < totalStars; i++) {
		result.push(new Star(canvasWidth, canvasHeight));
	}

	return result;
}

let planets = {};

export const planetMappings = {
	'cold': './static/img/coldplanet.png',
	'forest': './static/img/forestplanet.png',
	'fire': './static/img/fireplanet.png',
	'purple': './static/img/purpleplanet.png',
	'living': './static/img/livingplanet.png'
};

export const getImageEl = (id) => {
	let planet = planets[id];
	if (planet) {
		return planet;
	}

	planet = document.createElement('img');
	planet.src = planetMappings[id];
	planets[id] = planet;

	return planet;
};

export function getMaxSize(items, prop) {
	return Math.max(...items.map(i => i[prop]));
};

export function resetContextScope(context, callback) {
	const initialShadowOffsetX = context.shadowOffsetX;
	const initialShadowOffsetY = context.shadowOffsetY;
	const initialShadowBlur = context.shadowBlur;
	const initialShadowColor = context.shadowColor;
	callback();
	context.shadowOffsetX = initialShadowOffsetX;
	context.shadowOffsetY = initialShadowOffsetY;
	context.shadowBlur = initialShadowBlur;
	context.shadowColor = initialShadowColor;
};

export function getTextAsLines(context, text, width, widthPadding) {
	const lines = [];
	const originalLines = text.split('\n');
	originalLines.forEach(line => {
		const words = line.split(' ');
		let curr = '';
		const maxWidth = width - (widthPadding * 2);
		words.forEach(w => {
			const lineWidth = context.measureText(curr + ' ' + w).width;
			if (lineWidth < maxWidth) {
				curr = curr + ' ' + w;
				return;
			}

			lines.push(curr);

			const wordWidth = context.measureText(w).width;

			if (wordWidth < maxWidth) {
				curr = w;
				return;
			}

			// If word overflows split it
			const percentOverflow = maxWidth / wordWidth;
			const cutIndex = Math.floor(w.length * percentOverflow);
			lines.push(w.substring(0, cutIndex - 1) + '-');
			curr = w.substring(cutIndex - 1, w.length);
		});
		lines.push(curr);
	});

	return lines;
}
