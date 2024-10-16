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
        const minSize = 25;
        const maxSize = 75;

        return assets.map(a => {
            const size = Math.max(minSize, (a.bytes / maxRelativeSize) * maxSize);
            const angle = Math.random() * Math.PI * 2;
            const targetRadius = (Math.random() * this.mainPlanet.radius) - size;
            const x = (Math.cos(angle) * targetRadius) + this.mainPlanet.x;
            const y = (Math.sin(angle) * targetRadius) + this.mainPlanet.y;
            return new AssetRegion(a, x, y, size);
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
