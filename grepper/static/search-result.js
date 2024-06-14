import { SearchAction } from './search-action.js';
import { getFillGradient } from './helpers.js';

export class SearchResult {
	constructor(canvasWidth, canvasHeight, radius, color, result) {
		this.x = Math.min(Math.random() * canvasWidth, canvasWidth - (radius * 2));
		this.y = Math.min(Math.random() * canvasHeight, canvasHeight - (radius * 2));
		this.radius = radius;
		this.color = color;
		this.result = result;
		this.innerRadius = radius / 1.5;
		this.irGrowDirection = 1;
		this.hover = false;
		this.selected = false;
		this.selectionActions = [];
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


		if (this.selected) {
			this.selectionActions.forEach(a => a.draw(context));
			this.drawSelectionHeader(context);
		}
	}

	update = (lastClickPosition, mouseLocation) => {
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
		this.selected = lastClickPosition.x !== undefined && lastClickPosition.y !== undefined && Math.sqrt((lastClickPosition.x - this.x) ** 2 + (lastClickPosition.y - this.y) ** 2) < this.radius || this.selectionActions.some(a => a.selected);
		if (this.selected && this.selectionActions.length === 0) {
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


