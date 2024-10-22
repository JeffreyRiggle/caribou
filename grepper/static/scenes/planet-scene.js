import { AssetRegion } from "../entities/asset-region.js";
import { PlanetInfoPane } from "../entities/planet-info-pane.js";
import { PlanetView } from "../entities/planet-view.js";
import { buildStars, getMaxSize } from "../helpers.js";

export class PlanetScene {
	constructor(canvasWidth, canvasHeight, exploring, assets, planetType) {
		this.stars = buildStars(canvasWidth, canvasHeight);
		this.canvasWidth = canvasWidth;
		this.canvasHeight = canvasHeight;
		this.exploring = exploring;

        const planetX = this.canvasWidth / 2;
        const planetY = this.canvasHeight / 2;
        const planetRadius = 325;
		this.mainPlanet = new PlanetView(planetX, planetY, planetRadius, planetType);
        this.assetInfo = {
            type: 'assets',
            image: { total: 0, bytes: 0 },
            css: { total: 0, bytes: 0 },
            javascript: { total: 0, bytes: 0 }
        };
        this.assets = this.buildAssets(assets);
        this.infoPane = new PlanetInfoPane(planetX + planetRadius + 48, planetY - planetRadius, 600, 400, this.assetInfo);
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

            this.assetInfo[a.contentType].total += 1;
            this.assetInfo[a.contentType].bytes += a.bytes;

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

        this.infoPane.draw(context);
	}
}
