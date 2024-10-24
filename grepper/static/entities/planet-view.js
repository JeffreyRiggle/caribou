import inputManager from '../input-manager.js';
import { getImageEl, resetContextScope } from '../helpers.js';

export class PlanetView {
	constructor(x, y, radius, planetType, url, assetCallback) {
		this.x = x;
		this.y = y;
		this.radius = radius;
		this.hover = false;
		this.selected = false;
		this.planetType = planetType;
		this.url = url;
		this.assetCallback = assetCallback;
	}

	update = (assetSelected) => {
		const mouseLocation = inputManager.mouseLocation;
		this.hover = Math.sqrt((mouseLocation.x - this.x) ** 2 + (mouseLocation.y - this.y) ** 2) < this.radius;

		const clickPosition = inputManager.clickPosition;
		const wasSelected = this.selected;
		if (clickPosition) {
			this.selected = !assetSelected && Math.sqrt((clickPosition.x - this.x) ** 2 + (clickPosition.y - this.y) ** 2) < this.radius;
		}

		if (!wasSelected && this.selected) {
			this.action();
		}
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

	action = () => {
        fetch(`/api/v1/${btoa(this.url)}/details`).then(res => {
            return res.json().then(assetDetails => {
                this.assetCallback(assetDetails, { url: this.url });
            });
        });
    }
}
