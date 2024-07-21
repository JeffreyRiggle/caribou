import { Star } from './star.js';
import { SearchResult } from './search-result.js';

const possibleColors = [
	{ inner: 'rgb(220, 220, 250)', outer: 'rgb(52, 52, 247)' },
	{ inner: 'rgb(250, 220, 220)', outer: 'rgb(252, 61, 61)' },
	{ inner: 'rgb(246, 250, 220)', outer: 'yellow' },
	{ inner: 'rgb(255, 242, 217)', outer: 'rgb(252, 194, 76)' },
	{ inner: 'rgb(244, 220, 250)', outer: 'rgb(247, 88, 252)' }
];

function getRelativeSize(items) {
	return Math.max(...items.map(i => i.rank));
}

export class StarMapScene {
	constructor(canvasWidth, canvasHeight) {
		this.stars = [];
		this.searchResults = [];
		this.canvasWidth = canvasWidth;
		this.canvasHeight = canvasHeight;

		this.setupStars();
	}

	setupStars() {
		const totalStars = Math.max(Math.floor(Math.random() * 100), 10);
		for (let i = 0; i < totalStars; i++) {
			this.stars.push(new Star(this.canvasWidth, this.canvasHeight));
		}
	}
	
	setupFromResults(results) {
		const maxRelativeSize = getRelativeSize(results);
		const maxRadius = 100;

		this.searchResults.length = 0;
		results.forEach(result => {
			const relativeRadius = (result.rank / maxRelativeSize) * maxRadius;

			const sResult = new SearchResult(this.canvasWidth, this.canvasHeight, relativeRadius, possibleColors[Math.floor(Math.random()*possibleColors.length)], result);
			this.searchResults.push(sResult);
		});
	}

	draw = (canvas, context) => {
		context.clearRect(0, 0, canvas.width, canvas.height);
		const resetBSC = context.shadowColor;
		const resetBSB = context.shadowBlur;
		let selectedItem;

		this.stars.forEach(s => {
			s.update();
			s.draw(context);
		});
		this.searchResults.forEach(r => {
			r.update();

			if (r.selected) {
				selectedItem = r;
			}
		});

		this.searchResults.forEach(r => {
			if (r.selected) return;

			r.draw(context);
			context.shadowColor = resetBSC;
			context.shadowBlur = resetBSB;
		});

		if (selectedItem) {
			selectedItem.draw(context);
			context.shadowColor = resetBSC;
			context.shadowBlur = resetBSB;
		}
	}
}
