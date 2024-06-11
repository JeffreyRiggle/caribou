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
				stars.push(new Star());
		}
		requestAnimationFrame(runAnimationLoop);
});


function getRelativeSize(items) {
		return Math.max(...items.map(i => i.rank));
}

function getFillGradient(context, x, y, innerRadius, relativeRadius, color) {
		const gradient = context.createRadialGradient(x, y, innerRadius, x, y, relativeRadius);
		gradient.addColorStop(0, color.inner);
		gradient.addColorStop(1, color.outer);
		return gradient;
}

class Star {
		constructor() {
				this.x = Math.random() * canvasWidth;
				this.y = Math.random() * canvasHeight;
				this.size = Math.random() + .05;
				this.blinkChance = .003;
				this.alpha = 1;
				this.alphaChange = 0;
		}

		draw = (context) => {
				context.beginPath();
				context.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
				context.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
				context.fill();
				context.closePath();
		}

		update = () => {
				if (this.alphaChange === 0 && Math.random() < this.blinkChance) {
						this.alphaChange = -1;
						return;
				}

				if (this.alphaChange === 0) return;

				this.alpha += this.alphaChange * .05;
				if (this.alpha <= 0) {
						this.alphaChange = 1;
				} else if (this.alpha >= 1) {
						this.alphaChange = 0;
				}
		}
}

class SearchResult {
		constructor(radius, color, result) {
				this.x = Math.min(Math.random() * canvasWidth, canvasWidth - (radius * 2));
				this.y = Math.min(Math.random() * canvasHeight, canvasHeight - (radius * 2));
				this.radius = radius;
				this.color = color;
				this.result = result;
				this.innerRadius = radius / 1.5;
				this.irGrowDirection = 1;
				this.hover = false;
				this.selected = false;
		}

		draw = (context) => {
				context.beginPath();
				context.fillStyle = getFillGradient(context, this.x, this.y, this.innerRadius, this.radius, this.color);
				context.shadowOffsetX = 0;
				context.shadowOffsetY = 0;
				context.shadowBlur = 15;
				context.shadowColor = 'white';

				if (this.hover) {
						context.shadowBlur = 25;
				}

				if (this.selected) {
						context.shadowColor = 'rgb(3, 190, 252)';
						context.shadowBlur = 40;
				}
				context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
				context.closePath();
				context.fill();
		}

		update = () => {
				if (this.irGrowDirection === 1) {
						this.innerRadius = Math.min(this.innerRadius + .01, this.radius / 1.5);
				} else {
						this.innerRadius = Math.max(this.innerRadius - .01, 0);
				}

				if (this.innerRadius >= this.radius / 1.5) {
						this.irGrowDirection = 0;
				} else if (this.innerRadius <= 0) {
						this.irGrowDirection = 1;
				}
				this.hover = Math.sqrt((mouseLocation.x - this.x) ** 2 + (mouseLocation.y - this.y) ** 2) < this.radius;
				this.selected = lastClickPosition.x !== undefined && lastClickPosition.y !== undefined && Math.sqrt((lastClickPosition.x - this.x) ** 2 + (lastClickPosition.y - this.y) ** 2) < this.radius;
		}
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
				r.update();
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

				const sResult = new SearchResult(relativeRadius, possibleColors[Math.floor(Math.random()*possibleColors.length)], result);
				searchResults.push(sResult);
		});
}
