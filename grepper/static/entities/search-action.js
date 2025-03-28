import { getTextAsLines, resetContextScope } from '../helpers.js';
import inputManager from '../input-manager.js';

const ACTION_TEXT_VERTICAL_MARGIN = 24;
const SUB_TEXT_LINE_HEIGHT = 10;
const ACTION_PADDING = 10;

export class SearchAction {
	constructor(x, y, size, actionText, subText, action) {
		this.x = x;
		this.y = y;
		this.size = size;
		this.actionText = actionText;
		this.subText = subText;
		this.selected = false;
		this.hover = false;
		this.midPoint = .01;
		this.action = action;
	}

	draw = (context) => {
		resetContextScope(context, () => {
			context.beginPath();
			const alpha = this.hover ? .45 : .15; 
	
			if (this.hover) {
				const gradient = context.createLinearGradient(this.x, this.y, this.x + this.size, this.y + this.size);
				gradient.addColorStop(0, `rgba(3, 190, 252, ${alpha})`);
				gradient.addColorStop(this.midPoint, `rgba(3, 190, 252, ${alpha})`);
				gradient.addColorStop(this.midPoint + .005, 'white');
				gradient.addColorStop(this.midPoint + .01, 'white');
				gradient.addColorStop(this.midPoint + .015, `rgba(3, 190, 252, ${alpha})`);
				gradient.addColorStop(1, `rgba(3, 190, 252, ${alpha})`);
				context.fillStyle = gradient;
			} else {
				context.fillStyle = `rgba(3, 190, 252, ${alpha})`;
			}
			context.rect(this.x, this.y, this.size, this.size);
			context.closePath();
			context.fill();
			context.fillStyle = 'white';
			context.font = '24px roboto';
			context.textAlign = 'center';
			context.textBaseline = 'middle';
			context.fillText(this.actionText, this.x + (this.size / 2), this.y + ACTION_TEXT_VERTICAL_MARGIN);
			context.font = '8px roboto';
			getTextAsLines(context, this.subText, this.size, ACTION_PADDING).forEach((l, i) => {
				const targetY = this.y + ACTION_TEXT_VERTICAL_MARGIN + ACTION_TEXT_VERTICAL_MARGIN + (i * SUB_TEXT_LINE_HEIGHT);
				// if text vertically overflows hide it
				if (targetY > this.y + this.size - ACTION_PADDING) return;
	
				context.fillText(l, this.x + (this.size / 2), targetY);
			});
		});
	}

	update = () => {
		const clickPosition = inputManager.clickPosition;

		const wasSelected = this.selected;
		if (clickPosition) {
			const validClickX = clickPosition.x >= this.x && clickPosition.x <= this.x + this.size;
			const validClickY = clickPosition.y <= this.y + this.size && clickPosition.y >= this.y;
			this.selected = validClickX && validClickY;
		}

		const mouseLocation = inputManager.mouseLocation;
		const validHoverX = mouseLocation.x >= this.x && mouseLocation.x <= this.x + this.size;
		const validHoverY = mouseLocation.y <= this.y + this.size && mouseLocation.y >= this.y;
		this.hover = validHoverX && validHoverY;

		if (this.hover) {
			this.updateMidpoint();
		} else if (this.midPoint != .01) {
			this.midPoint = .01;
		}
		if (this.selected && !wasSelected) {
			setTimeout(() => this.action());
		}
	}

	updateMidpoint = () => {
		if (this.midPoint >= .98) {
			this.midPoint = .01;
		} else {
			this.midPoint = Math.min(.98, this.midPoint + .005);
		}
	}
}

