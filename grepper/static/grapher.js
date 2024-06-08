const possibleColors = ['blue', 'red', 'yellow', 'orange', 'purple'];
function handleChange(e) {
  fetch('/query-graph?q=' + e.target.value).then(res => {
		  return res.json().then(j => buildResults(j.results));
  });
}

addEventListener('load', () => {
		const input = document.getElementById('search');
		input.addEventListener('change', handleChange);
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

const searchResults = [];
let animationLoopStarted = false;

function runAnimationLoop() {
		if (searchResults.length < 1) {
				requestAnimationFrame(runAnimationLoop);
				return;
		}

		const canvas = document.getElementById('result-view');
		const context = canvas.getContext('2d');
		
		context.clearRect(0, 0, canvas.width, canvas.height);

		searchResults.forEach(r => r.update());
		searchResults.forEach(r => r.draw(context));

		requestAnimationFrame(runAnimationLoop);
}

function buildResults(results) {
		const canvas = document.getElementById('result-view');
		const context = canvas.getContext('2d');
		
		context.clearRect(0, 0, canvas.width, canvas.height);
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
				sResult.draw(context);
		});

		if (!animationLoopStarted) {
				animationLoopStarted = true;
				runAnimationLoop();
		}
}
