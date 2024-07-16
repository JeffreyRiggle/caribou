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
		const initialShadowOffsetX = context.shadowOffsetX;
		const initialShadowOffsetY = context.shadowOffsetY;
		const initialShadowBlur = context.shadowBlur;
		const initialShadowColor = context.shadowColor;

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
		this.getSubTextAsLines(context).forEach((l, i) => {
			const targetY = this.y + ACTION_TEXT_VERTICAL_MARGIN + ACTION_TEXT_VERTICAL_MARGIN + (i * SUB_TEXT_LINE_HEIGHT);
			// if text vertically overflows hide it
			if (targetY > this.y + this.size - ACTION_PADDING) return;

			context.fillText(l, this.x + (this.size / 2), targetY);
		});

		context.shadowOffsetX = initialShadowOffsetX;
		context.shadowOffsetY = initialShadowOffsetY;
		context.shadowBlur = initialShadowBlur;
		context.shadowColor = initialShadowColor;
	}

	update = (lastClickPosition, mouseLocation) => {
		const validClickPosition = lastClickPosition.x !== undefined && lastClickPosition.y !== undefined;
		const validClickX = lastClickPosition.x >= this.x && lastClickPosition.x <= this.x + this.size;
		const validClickY = lastClickPosition.y <= this.y + this.size && lastClickPosition.y >= this.y;
		const wasSelected = this.selected;
		this.selected = validClickPosition && validClickX && validClickY;

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


	getSubTextAsLines = (context) => {
		const lines = [];
		const originalLines = this.subText.split('\n');
		originalLines.forEach(line => {
			const words = line.split(' ');
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
			lines.push(curr);
		});

		return lines;
	}
}


