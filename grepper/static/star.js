export class Star {
	constructor(canvasWidth, canvasHeight) {
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

