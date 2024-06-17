import { SearchAction } from './search-action.js';
import { getFillGradient } from './helpers.js';

const MAX_RADIUS = 125;
const ACTION_WIDTH = MAX_RADIUS * 2;
const HEADER_HEIGHT = 100;
const COMPONENT_PADDING = 20;
const TOTAL_HEADER_SIZE = HEADER_HEIGHT + COMPONENT_PADDING;

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
			this.growRate = (MAX_RADIUS - radius) / 30;
		}
		this.originalSize = this.radius;

		this.originalX = this.x;
		this.maxXPoint = MAX_RADIUS + ACTION_WIDTH + this.x;
		const minXPoint = this.x - MAX_RADIUS - ACTION_WIDTH;
		if (this.maxXPoint > canvasWidth) {
			this.translateX = -((this.maxXPoint - canvasWidth) / 30);
		} else if (minXPoint < 0) {
			this.translateX = Math.abs(minXPoint / 30);
		} else {
			this.translateX = 0;
		}

		this.originalY = this.y;
		this.maxYPoint = MAX_RADIUS + TOTAL_HEADER_SIZE + this.y;
		const minYPoint = this.y - MAX_RADIUS - TOTAL_HEADER_SIZE;
		if (this.maxYPoint > canvasHeight) {
			this.translateY = -((this.maxYPoint - canvasHeight) / 30);
		} else if (minYPoint < 0) {
			this.translateY = Math.abs(minYPoint / 30);
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
		if (this.selected && this.radius < MAX_RADIUS && this.growRate > 0) {
			this.radius = Math.min(MAX_RADIUS, this.growRate + this.radius);
		}

		if (!this.selected && this.radius !== this.originalSize) {
			this.radius = Math.max(this.radius - this.growRate, this.originalSize);
		}

		if (this.selected && ((this.translateX > 0 && this.x - MAX_RADIUS - ACTION_WIDTH < 0) || (this.translateX < 0 && this.x + MAX_RADIUS + ACTION_WIDTH > this.canvasWidth)))  {
			if (this.translateX > 0) {
				this.x = Math.min(this.x + this.translateX, MAX_RADIUS + ACTION_WIDTH);
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

		if (this.selected && ((this.translateY > 0 && this.y - MAX_RADIUS - TOTAL_HEADER_SIZE < 0) || (this.translateY < 0 && this.y + MAX_RADIUS + TOTAL_HEADER_SIZE > this.canvasHeight)))  {
			if (this.translateY > 0) {
				this.y = Math.min(this.y + this.translateY, MAX_RADIUS + TOTAL_HEADER_SIZE);
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
		
		if (this.selected && this.selectionActions.length === 0 && this.radius >= MAX_RADIUS) {
			const leftX = this.x - ACTION_WIDTH - this.radius - COMPONENT_PADDING;
			const boxY = this.y - this.radius;
			const rightX = this.x + this.radius + COMPONENT_PADDING;
			const openAction = () => window.open(this.result.url, '_blank');
			this.selectionActions.push(new SearchAction(leftX, boxY, ACTION_WIDTH, 'Visit', openAction));
			this.selectionActions.push(new SearchAction(rightX, boxY, ACTION_WIDTH, 'Explore'));
		} else if (!this.selected && this.selectionActions.length > 0) {
			this.selectionActions = [];
		}
	}

	drawSelectionHeader(context) {
		const diameter = this.radius * 2;
		const headerX = this.x - diameter - this.radius - COMPONENT_PADDING;
		const headerY = this.y - this.radius - TOTAL_HEADER_SIZE;
		const headerWidth = diameter /* left box */ + diameter /* center */  + diameter /* right box */ + (COMPONENT_PADDING * 2) /* padding * 2 */;
		const headerHeight = HEADER_HEIGHT;
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

