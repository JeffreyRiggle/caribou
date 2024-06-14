import { Star } from './star.js';
import { SearchResult } from './search-result.js';

const possibleColors = [
		{ inner: 'rgb(220, 220, 250)', outer: 'rgb(52, 52, 247)' },
		{ inner: 'rgb(250, 220, 220)', outer: 'rgb(252, 61, 61)' },
		{ inner: 'rgb(246, 250, 220)', outer: 'yellow' },
		{ inner: 'rgb(255, 242, 217)', outer: 'rgb(252, 194, 76)' },
		{ inner: 'rgb(244, 220, 250)', outer: 'rgb(247, 88, 252)' }
];
let canvasWidth, canvasHeight;
const searchResults = [];
const stars = [];
let mouseLocation = {
		x: 0,
		y: 0
};

let lastClickPosition = {
		x: undefined,
		y: undefined
}

function handleChange(e) {
  fetch('/query-graph?q=' + e.target.value).then(res => {
		  return res.json().then(j => buildResults(j.results));
  });
}

addEventListener('load', () => {
		const input = document.getElementById('search');
		input.addEventListener('change', handleChange);
		const canvas = document.getElementById('result-view');
		canvasWidth = canvas.width = window.innerWidth;
		canvasHeight = canvas.height = window.innerHeight - 100;

		canvas.addEventListener('mousemove', evt => {
				mouseLocation.x = evt.clientX;
				// This is a bit of a hack because the canvas doesn't take up the whole screen
				// and is fixed positioned
				mouseLocation.y = evt.clientY - 100;
		});

		canvas.addEventListener('mouseup', evt => {
				lastClickPosition.x = evt.clientX;
				lastClickPosition.y = evt.clientY - 100;
		});
		const totalStars = Math.floor(Math.random() * 100);
		for (let i = 0; i < totalStars; i++)
		{
				stars.push(new Star(canvasWidth, canvasHeight));
		}
		requestAnimationFrame(runAnimationLoop);
});


function getRelativeSize(items) {
		return Math.max(...items.map(i => i.rank));
}

function runAnimationLoop() {
		const canvas = document.getElementById('result-view');
		const context = canvas.getContext('2d');
		
		context.clearRect(0, 0, canvas.width, canvas.height);
		const resetBSC = context.shadowColor;
		const resetBSB = context.shadowBlur;
		stars.forEach(s => {
				s.update();
				s.draw(context);
		});
		searchResults.forEach(r => {
				r.update(lastClickPosition, mouseLocation);
				r.draw(context);
				context.shadowColor = resetBSC;
				context.shadowBlur = resetBSB;
		});

		requestAnimationFrame(runAnimationLoop);
}

function buildResults(results) {
		const canvas = document.getElementById('result-view');
		const context = canvas.getContext('2d');
		
		const maxRelativeSize = getRelativeSize(results);
		const centerX = canvas.width / 2;
		const centerY = canvas.height / 2;
		const maxRadius = 100;

		searchResults.length = 0;
		results.forEach((result, index) => {
				const relativeRadius = (result.rank / maxRelativeSize) * maxRadius;

				const sResult = new SearchResult(canvasWidth, canvasHeight, relativeRadius, possibleColors[Math.floor(Math.random()*possibleColors.length)], result);
				searchResults.push(sResult);
		});
}
