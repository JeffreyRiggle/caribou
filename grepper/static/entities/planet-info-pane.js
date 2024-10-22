import { resetContextScope } from '../helpers.js';

export class PlanetInfoPane {
    constructor(x, y, height, width, info) {
        this.x = x;
        this.y = y;
        this.height = height;
        this.width = width;
        this.info = info;
    }

    draw = (context) => {
		resetContextScope(context, () => {
			context.beginPath();
            context.fillStyle = `rgba(3, 190, 252, .15`;
			context.rect(this.x, this.y, this.width, this.height);
			context.closePath();
			context.fill();
			context.fillStyle = 'white';
			context.font = '24px roboto';
			context.textAlign = 'center';
			context.textBaseline = 'middle';
            this.drawText(context);
		});
	}

    drawText(context) {
        if (this.info?.type === 'assets') {
            this.drawAssetInfo(context);
        }
    }

    drawAssetInfo(context) {
        context.fillText('Page Assets', this.x + (this.width / 2), this.y + 24);
        context.fillText(`Images: ${this.info.image.total}, size: ${this.bytesToDisplay(this.info.image.bytes)}`, this.x + (this.width / 2), this.y + 48 + 12);
        context.fillText(`CSS: ${this.info.css.total}, size: ${this.bytesToDisplay(this.info.css.bytes)}`, this.x + (this.width / 2), this.y + 72 + 12);
        context.fillText(`Javascript: ${this.info.javascript.total}, size: ${this.bytesToDisplay(this.info.javascript.bytes)}`, this.x + (this.width / 2), this.y + 96 + 12);
    }

    bytesToDisplay(bytes) {
        if (bytes < 1000) {
            return bytes + ' bytes';
        }
    
        if (bytes < 1000000) {
            return (bytes / 1000) + 'Kb';
        }
    
        if (bytes < 1000000000) {
            return (bytes / 1000000) + 'Mb';
        }
    
        return (bytes / 1000000000) + 'Gb';
    }
};
