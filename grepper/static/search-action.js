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
		context.fillText(this.actionText, this.x + (this.size / 2), this.y + ACTION_TEXT_VERTICAL_MARGIN);
		context.font = '8px roboto';
		this.getSubTextAsLines(context).forEach((l, i) => {
			const targetY = this.y + ACTION_TEXT_VERTICAL_MARGIN + ACTION_TEXT_VERTICAL_MARGIN + (i * SUB_TEXT_LINE_HEIGHT);
			// if text vertically overflows hide it
			if (targetY > this.y + this.size - ACTION_PADDING) return;

			context.fillText(l, this.x + (this.size / 2), targetY);
		});
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


	getSubTextAsLines = (context) => {
		const words = this.subText.split(' ');
		const lines = [];
		let curr = '';
		const maxWidth = this.size - (ACTION_PADDING * 2);
		words.forEach(w => {
			const lineWidth = context.measureText(curr + ' ' + w).width;
			if (lineWidth < maxWidth) {
				curr = curr + ' ' + w;
				return;
			}

			lines.push(curr);

			const wordWidth = context.measureText(w).width;

			if (wordWidth < maxWidth) {
				curr = w;
				return;
			}

			// If word overflows split it
			const percentOverflow = Math.ceil((maxWidth / wordWidth) * 100);
			const cutIndex = Math.floor((percentOverflow / w.length) * 100);
			lines.push(w.substring(0, cutIndex - 1) + '-');
			curr = w.substring(cutIndex - 1, w.length);
		});

		return lines;
	}
}


