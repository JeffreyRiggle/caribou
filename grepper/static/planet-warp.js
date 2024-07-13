export class PlanetWarp {
	constructor(origin, target) {
		this.origin = origin;
		this.target = target;
		this.midPoint = .15;
		this.baseColor = '#9eb1ff';
		this.accentColor = '#c584db';
	}

	update = () => {
		if (this.midPoint >= .94) {
			this.midPoint = .25;
		} else {
			this.midPoint = Math.min(this.midPoint + .0015, .94);
		}
	}

	draw = (context) => {
		const gradient = context.createLinearGradient(this.origin.x, this.origin.y, this.target.x, this.target.y);
		if (this.midPoint > .5) {
			gradient.addColorStop(0, this.baseColor);
			gradient.addColorStop(this.midPoint - .5, this.baseColor);
		}
		gradient.addColorStop(0, this.accentColor);
		gradient.addColorStop(this.midPoint, this.accentColor);
		gradient.addColorStop(this.midPoint + .05, this.baseColor)
		gradient.addColorStop(1, this.baseColor);
		context.strokeStyle = gradient;
		context.beginPath();
		context.moveTo(this.origin.x, this.origin.y);
		context.lineTo(this.target.x, this.target.y);
		context.stroke();
	}
}
