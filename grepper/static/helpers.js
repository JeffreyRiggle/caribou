import { Star } from './star.js';

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
