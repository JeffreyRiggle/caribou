export class SearchAction {
	constructor(x, y, size, actionText, action) {
		this.x = x;
		this.y = y;
		this.size = size;
		this.actionText = actionText;
		this.selected = false;
		this.action = action;
	}

	draw = (context) => {
		context.beginPath();
		context.fillStyle = 'rgba(3, 190, 252, .15)';
		context.rect(this.x, this.y, this.size, this.size);
		context.closePath();
		context.fill();
		context.fillStyle = 'white';
		context.font = '24px roboto';
		context.textAlign = 'center';
		context.textBaseline = 'middle';
		context.fillText(this.actionText, this.x + (this.size / 2), this.y + (this.size / 2));
	}

	update = (lastClickPosition) => {
		const validPosition = lastClickPosition.x !== undefined && lastClickPosition.y !== undefined;
		const validX = lastClickPosition.x >= this.x && lastClickPosition.x <= this.x + this.size;
		const validY = lastClickPosition.y <= this.y + this.size && lastClickPosition.y >= this.y;
		const wasSelected = this.selected;
		this.selected = validPosition && validX && validY;

		if (this.selected && !wasSelected) {
			setTimeout(() => this.action());
		}
	}
}


