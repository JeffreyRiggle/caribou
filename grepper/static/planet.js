export class Planet {
	constructor(x, y, radius) {
		this.x = x;
		this.y = y;
		this.radius = radius;
		this.hover = false;
	}

	update = (lastClickPosition, mouseLocation) => {
		this.hover = Math.sqrt((mouseLocation.x - this.x) ** 2 + (mouseLocation.y - this.y) ** 2) < this.radius;
	}

	draw = (context) => {
		context.beginPath();
		context.fillStyle = 'green';
		context.shadowOffsetX = 0;
		context.shadowOffsetY = 0;
		context.shadowBlur = 15;
		context.shadowColor = 'white';

		if (this.hover) {
			context.shadowBlur = 25;
		}

		context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
		context.closePath();
		context.fill();
	}
}
