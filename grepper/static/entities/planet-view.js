import inputManager from '../input-manager.js';
import { getImageEl, resetContextScope } from '../helpers.js';

export class PlanetView {
	constructor(x, y, radius, planetType) {
		this.x = x;
		this.y = y;
		this.radius = radius;
		this.hover = false;
		this.planetType = planetType;
	}

	update = () => {
		const mouseLocation = inputManager.mouseLocation;
		this.hover = Math.sqrt((mouseLocation.x - this.x) ** 2 + (mouseLocation.y - this.y) ** 2) < this.radius;
	}

	draw = (context) => {
		resetContextScope(context, () => {
			context.beginPath();
			context.fillStyle = context.createPattern(getImageEl(this.planetType), 'repeat');
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
		});
	}
}
