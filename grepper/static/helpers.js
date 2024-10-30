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

export const getPlanetImageEl = (id) => {
	let planet = planets[id];
	if (planet) {
		return planet;
	}

	planet = document.createElement('img');
	planet.src = planetMappings[id];
	planets[id] = planet;

	return planet;
};

const planetAssetMappings = {
	'cold': {
		'forest': './static/img/frozen-forest.png',
		'lake': './static/img/frozen-lake.png',
		'city': './static/img/frozen-city.png',
		'mountain': './static/img/frozen-mountain.png'
	},
	'fire': {
		'forest': './static/img/fire-forest.png',
		'lake': './static/img/fire-lake.png',
		'city': './static/img/fire-city.png',
		'mountain': './static/img/fire-mountain.png'
	},
	'purple': {
		'forest': './static/img/purple-forest.png',
		'lake': './static/img/purple-lake.png',
		'city': './static/img/purple-city.png',
		'mountain': './static/img/purple-mountain.png'
	}
};

const planetAssets = {};

export const getPlanetAsset = (planetType, assetType) => {
	let assets = planetAssets[planetType];

	if (!assets) {
		planetAssets[planetType] = {};
		assets = {};
	}

	const asset = assets[assetType];
	if (asset) {
		return asset;
	}

	const assetEl = document.createElement('img');
	assetEl.src = planetAssetMappings[planetType][assetType];
	planetAssets[planetType][assetType] = assetEl;

	return assetEl;
}

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

			let remainder = w;
			let remainderWidth = wordWidth;
			while (remainderWidth > maxWidth) {
				const percentOverflow = maxWidth / remainderWidth;
				const cutIndex = Math.floor(remainder.length * percentOverflow);
				lines.push(remainder.substring(0, cutIndex - 1) + '-');
				remainder = remainder.substring(cutIndex - 1, remainder.length);
				remainderWidth = context.measureText(remainder).width;
			}
			curr = remainder;
		});
		lines.push(curr);
	});

	return lines;
}
