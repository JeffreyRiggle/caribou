import inputManager from '../input-manager.js';
import { resetContextScope } from '../helpers.js';

export class AssetRegion {
    constructor(asset, x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.asset = asset;
    }

    update = () => {
        const mouseLocation = inputManager.mouseLocation;
		const validHoverX = mouseLocation.x >= this.x && mouseLocation.x <= this.x + this.size;
		const validHoverY = mouseLocation.y <= this.y + this.size && mouseLocation.y >= this.y;
		this.hover = validHoverX && validHoverY;
    }

    draw = (context) => {
        resetContextScope(context, () => {
            context.beginPath();
            if (this.hover) {
                context.shadowOffsetX = 0;
                context.shadowOffsetY = 0;
                context.shadowBlur = 15;
                context.shadowColor = 'white';
            }
            context.fillStyle = this.getFillColor();
            context.rect(this.x, this.y, this.size, this.size);
            context.closePath();
            context.fill();
        });
    }

    getFillColor() {
        if (this.asset.contentType === 'javascript') {
            return 'green';
        }

        if (this.asset.contentType === 'css') {
            return 'brown';
        }

        if (this.asset.contentType === 'image') {
            return 'blue'
        }

        return 'red';
    }
}