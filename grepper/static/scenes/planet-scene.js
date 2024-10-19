import { AssetRegion } from "../entities/asset-region.js";
import { PlanetView } from "../entities/planet-view.js";
import { buildStars, getMaxSize } from "../helpers.js";

export class PlanetScene {
	constructor(canvasWidth, canvasHeight, exploring, assets, planetType) {
		this.stars = buildStars(canvasWidth, canvasHeight);
		this.canvasWidth = canvasWidth;
		this.canvasHeight = canvasHeight;
		this.exploring = exploring;
		this.mainPlanet = new PlanetView(this.canvasWidth / 2, this.canvasHeight / 2, 325, planetType);
        this.assets = this.buildAssets(assets);
	}

    buildAssets(assets) {
        const maxRelativeSize = getMaxSize(assets, 'bytes');
        const minSize = 32;
        const maxSize = 100;

        const minAngle = Math.PI * 1.25;
        const minX = (Math.cos(minAngle) * this.mainPlanet.radius) + this.mainPlanet.x + 8;
        const minY = (Math.sin(minAngle) * this.mainPlanet.radius) + this.mainPlanet.y;
        const maxAngle = Math.PI * 1.75;
        const maxX = (Math.cos(maxAngle) * this.mainPlanet.radius) + this.mainPlanet.x - 8;
        let currX = minX;
        let currY = minY;
        let maxSizeInRow = 0;
        let maxYInRow = 0;
        return assets.map(a => {
            const size = Math.max(minSize, (a.bytes / maxRelativeSize) * maxSize);
            const targetY = currY + (Math.random() * 20);
            const region = new AssetRegion(a, currX, targetY, size);
            currX += size + Math.max(32, (75 * Math.random()));
            maxSizeInRow = Math.max(maxSizeInRow, size);
            maxYInRow = Math.max(maxYInRow, targetY);
            if (currX >= maxX) {
                currX = minX;
                currY = maxSizeInRow + maxYInRow + Math.max(32, (75 * Math.random()));
                maxSizeInRow = 0;
            }

            return region;
        });
    }

	draw = (canvas, context) => {
		context.clearRect(0, 0, canvas.width, canvas.height);
		this.stars.forEach(s => {
			s.update();
			s.draw(context);
		});

		this.mainPlanet.update();
		this.mainPlanet.draw(context);

        this.assets.forEach(a => {
            a.update();
            a.draw(context);
        });
	}
}
