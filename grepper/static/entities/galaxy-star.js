export class GalaxyStar {
	constructor(x, y, red, green, blue) {
		this.x = x;
		this.y = y;
        this.red = red;
        this.green = green;
        this.blue = blue;
		this.size = Math.random() * 2;
		this.blinkChance = .003;
		this.alpha = 1;
		this.alphaChange = 0;
	}

	draw = (context) => {
		context.beginPath();
		context.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
		context.fillStyle = `rgba(${this.red}, ${this.green}, ${this.blue}, ${this.alpha})`;
        context.shadowOffsetX = 0;
		context.shadowOffsetY = 0;
		context.shadowBlur = this.size * 10;
		context.shadowColor = `rgba(${this.red}, ${this.green}, ${this.blue}, ${this.alpha / 2})`;
		context.fill();
		context.closePath();
	}

	update = (xdelta, ydelta) => {
        this.x += xdelta;
		this.y += ydelta;
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

