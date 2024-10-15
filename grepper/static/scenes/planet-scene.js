import { PlanetView } from "../entities/planet-view.js";
import { buildStars } from "../helpers.js";

export class PlanetScene {
	constructor(canvasWidth, canvasHeight, exploring, planetType) {
		this.stars = buildStars(canvasWidth, canvasHeight);
		this.canvasWidth = canvasWidth;
		this.canvasHeight = canvasHeight;
		this.exploring = exploring;
		this.mainPlanet = new PlanetView(this.canvasWidth / 2, this.canvasHeight / 2, 325, planetType);
	}

	draw = (canvas, context) => {
		context.clearRect(0, 0, canvas.width, canvas.height);
		this.stars.forEach(s => {
			s.update();
			s.draw(context);
		});

		this.mainPlanet.update();
		this.mainPlanet.draw(context);
	}
}
