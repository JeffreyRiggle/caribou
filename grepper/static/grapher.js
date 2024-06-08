const possibleColors = ['blue', 'red', 'yellow', 'orange', 'purple'];
let canvasWidth, canvasHeight;
const searchResults = [];
const stars = [];

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

function getFillGradient(context, x, y, innerRadius, relativeRadius, color, colorStop) {
		const gradient = context.createRadialGradient(x, y, innerRadius, x, y, relativeRadius);
		gradient.addColorStop(0, 'white');
		gradient.addColorStop(colorStop, color);
		gradient.addColorStop(1, 'white');
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
		constructor(x, y, relativeRadius, color, title) {
				this.x = x;
				this.y = y;
				this.relativeRadius = relativeRadius;
				this.color = color;
				this.title = title;
				this.innerRadius = relativeRadius / 4;
				this.colorStop = .99;
				this.csGrowDirection = 0;
				this.irGrowDirection = 1;
		}

		draw = (context) => {
				context.beginPath();
				context.arc(this.x, this.y, this.relativeRadius, 0, 2 * Math.PI);
				context.fillStyle = getFillGradient(context, this.x, this.y, this.innerRadius, this.relativeRadius, this.color, this.colorStop);
				context.strokeStyle = 'white';
				context.fill();
				context.stroke();

				context.strokeStyle = 'green';
				context.fillStyle = 'green';
				context.fillText(this.title, this.x - context.measureText(this.title).width / 2, this.y + 3);
		}

		update = () => {
				if (this.csGrowDirection === 1) {
						this.colorStop += .0001;
				} else {
						this.colorStop -= .0001;
				}

				if (this.colorStop >= .99) {
						this.csGrowDirection = 0;
				} else if (this.colorStop <= .85) {
						this.csGrowDirection = 1;
				}

				if (this.irGrowDirection === 1) {
						this.innerRadius = Math.min(this.innerRadius + (this.relativeRadius / 4000), this.relativeRadius / 4);
				} else {
						this.innerRadius = Math.max(this.innerRadius - (this.relativeRadius / 4000), 0);
				}

				if (this.innerRadius >= this.relativeRadius / 4) {
						this.irGrowDirection = 0;
				} else if (this.innerRadius <= 0) {
						this.irGrowDirection = 1;
				}
		}
}

function runAnimationLoop() {
		const canvas = document.getElementById('result-view');
		const context = canvas.getContext('2d');
		
		context.clearRect(0, 0, canvas.width, canvas.height);

		stars.forEach(s => {
				s.update();
				s.draw(context);
		});
		searchResults.forEach(r => {
				r.update();
				r.draw(context);
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
				const angle = (index / results.length) * (2 * Math.PI);

				const x = centerX + (Math.cos(angle) * (centerX - maxRadius));
				const y = centerY + (Math.sin(angle) * (centerY - maxRadius));
				const sResult = new SearchResult(x, y, relativeRadius, possibleColors[Math.floor(Math.random()*possibleColors.length)], result.title);
				searchResults.push(sResult);
		});
}
