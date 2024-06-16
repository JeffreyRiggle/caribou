import { SearchAction } from './search-action.js';
import { getFillGradient } from './helpers.js';

export class SearchResult {
	constructor(canvasWidth, canvasHeight, radius, color, result) {
		this.canvasWidth = canvasWidth;
		this.canvasHeight = canvasHeight;
		this.x = Math.floor(Math.min(Math.random() * canvasWidth, canvasWidth - (radius * 2)));
		this.y = Math.floor(Math.min(Math.random() * canvasHeight, canvasHeight - (radius * 2)));
		this.radius = radius;
		this.color = color;
		this.result = result;
		this.innerRadius = radius / 1.5;
		this.irGrowDirection = 1;
		this.hover = false;
		this.selected = false;
		this.selectionActions = [];
		if (radius >= 125) {
			this.growRate = 0;
		} else {
			this.growRate = (125 - radius) / 30;
		}
		this.originalSize = this.radius;

		this.originalX = this.x;
		this.maxXPoint = 125 + (125 * 2) + this.x;
		this.minXPoint = this.x - 125 - (125 * 2);
		if (this.maxXPoint > canvasWidth) {
			this.translateX = -((this.maxXPoint - canvasWidth) / 30);
		} else if (this.minXPoint < 0) {
			this.translateX = Math.abs(this.minXPoint / 30);
		} else {
			this.translateX = 0;
		}

		this.originalY = this.y;
		this.maxYPoint = 125 + 120 + this.y;
		this.minYPoint = this.y - 125 - 120;
		if (this.maxYPoint > canvasHeight) {
			this.translateY = -((this.maxYPoint - canvasHeight) / 30);
		} else if (this.minYPoint < 0) {
			this.translateY = Math.abs(this.minYPoint / 30);
		} else {
			this.translateY = 0;
		}
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


		if (this.selected && this.selectionActions.length > 0) {
			this.selectionActions.forEach(a => a.draw(context));
			this.drawSelectionHeader(context);
		}
	}

	update = (lastClickPosition, mouseLocation) => {
		this.selected = lastClickPosition.x !== undefined && lastClickPosition.y !== undefined && Math.sqrt((lastClickPosition.x - this.originalX) ** 2 + (lastClickPosition.y - this.originalY) ** 2) < this.radius || this.selectionActions.some(a => a.selected);
		if (this.selected && this.radius < 125 && this.growRate > 0) {
			this.radius = Math.min(125, this.growRate + this.radius);
		}

		if (!this.selected && this.radius !== this.originalSize) {
			this.radius = Math.max(this.radius - this.growRate, this.originalSize);
		}

		if (this.selected && ((this.translateX > 0 && this.x - 125 - (125 * 2) < 0) || (this.translateX < 0 && this.x + 125 + (125 * 2) > this.canvasWidth)))  {
			if (this.translateX > 0) {
				this.x = Math.min(this.x + this.translateX, 125 + (125 * 2));
			} else {
				this.x = Math.max(this.x + this.translateX, this.maxXPoint - this.canvasWidth);
			}
		}

		if (!this.selected && this.x !== this.originalX) {
			if (this.translateX < 0) {
				this.x = Math.min(this.x - this.translateX, this.originalX);
			} else {
				this.x = Math.max(this.x - this.translateX, this.originalX);
			}
		}

		if (this.selected && ((this.translateY > 0 && this.y - 125 - 120 < 0) || (this.translateY < 0 && this.y + 125 + 120 > this.canvasHeight)))  {
			if (this.translateY > 0) {
				this.y = Math.min(this.y + this.translateY, 125 + 120);
			} else {
				this.y = Math.max(this.y + this.translateY, this.maxYPoint - this.canvasHeight);
			}
		}

		if (!this.selected && this.y !== this.originalY) {
			if (this.translateY < 0) {
				this.y = Math.min(this.y - this.translateY, this.originalY);
			} else {
				this.y = Math.max(this.y - this.translateY, this.originalY);
			}
		}

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
		this.selectionActions.forEach(a => a.update(lastClickPosition));
		
		if (this.selected && this.selectionActions.length === 0 && this.radius >= 125) {
			const diameter = this.radius * 2;
			const leftX = this.x - diameter - this.radius - 20;
			const boxY = this.y - this.radius;
			const rightX = this.x + this.radius + 20;
			const openAction = () => window.open(this.result.url, '_blank');
			this.selectionActions.push(new SearchAction(leftX, boxY, diameter, 'Visit', openAction));
			this.selectionActions.push(new SearchAction(rightX, boxY, diameter, 'Explore'));
		} else if (!this.selected && this.selectionActions.length > 0) {
			this.selectionActions = [];
		}
	}

	drawSelectionHeader(context) {
		const diameter = this.radius * 2;
		const headerX = this.x - diameter - this.radius - 20;
		const headerY = this.y - this.radius - 120;
		const headerWidth = diameter /* left box */ + diameter /* center */  + diameter /* right box */ + 40 /* padding * 2 */;
		const headerHeight = 100;
		context.beginPath();
		context.fillStyle = 'rgba(3, 190, 252, .15)';
		context.rect(headerX, headerY, headerWidth, headerHeight);
		context.closePath();
		context.fill();
		context.fillStyle = 'white';
		context.font = '24px roboto';
		context.textAlign = 'center';
		context.textBaseline = 'middle';
		context.fillText(this.result.title, headerX + (headerWidth / 2), headerY + (headerHeight / 2));
	}
}


