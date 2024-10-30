import inputManager from '../input-manager.js';
import { resetContextScope, getPlanetAsset } from '../helpers.js';

export class AssetRegion {
    constructor(asset, x, y, size, assetCallback, planetType) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.asset = asset;
        this.selected = false;
        this.assetCallback = assetCallback;
        this.planetType = planetType;
    }

    update = () => {
        const mouseLocation = inputManager.mouseLocation;
		const validHoverX = mouseLocation.x >= this.x && mouseLocation.x <= this.x + this.size;
		const validHoverY = mouseLocation.y <= this.y + this.size && mouseLocation.y >= this.y;
		this.hover = validHoverX && validHoverY;

        const clickPosition = inputManager.clickPosition;

		const wasSelected = this.selected;
		if (clickPosition) {
			const validClickX = clickPosition.x >= this.x && clickPosition.x <= this.x + this.size;
			const validClickY = clickPosition.y <= this.y + this.size && clickPosition.y >= this.y;
			this.selected = validClickX && validClickY;
		}

        if (this.selected && !wasSelected) {
            this.action();
		}
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
            context.fillStyle = 'transparent';
            context.rect(this.x, this.y, this.size, this.size);
            context.closePath();
            context.fill();

            const image = this.getImage();
            context.drawImage(image, 0, 0, image.width, image.height, this.x, this.y, this.size, this.size);
        });
    }

    action = () => {
        fetch(`/api/v1/${btoa(this.asset.url)}/details`).then(res => {
            return res.json().then(assetDetails => {
                this.assetCallback(assetDetails, this.asset);
            });
        });
    }

    getImage() {
        if (this.asset.contentType === 'javascript') {
            return getPlanetAsset(this.planetType, 'city');
        }

        if (this.asset.contentType === 'css') {
            return getPlanetAsset(this.planetType, 'lake');
        }

        if (this.asset.contentType === 'image') {
            return getPlanetAsset(this.planetType, 'forest');
        }

        return getPlanetAsset(this.planetType, 'mountain');
    }
}