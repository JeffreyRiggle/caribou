import {Planet} from "./planet.js";
import { Star } from "./star.js";

export class ExploreScene {
	constructor(canvasWidth, canvasHeight, exploring) {
		this.stars = [];
		this.canvasWidth = canvasWidth;
		this.canvasHeight = canvasHeight;
		this.setupStars();
		this.exploring = exploring;
		this.mainPlanet = new Planet(this.canvasWidth / 2, this.canvasHeight / 2, 50);
		this.buildOrbit();
	}

	setupStars() {
		const totalStars = Math.max(Math.floor(Math.random() * 100), 10);
		for (let i = 0; i < totalStars; i++) {
			this.stars.push(new Star(this.canvasWidth, this.canvasHeight));
		}
	}

	buildOrbit() {
		let lastX = (this.canvasWidth / 2) + 55;
		let lastY = (this.canvasHeight / 2) + 55;
		this.orbitingPlanets = this.exploring.links.map(link => {
			lastX = lastX + 15;
			lastY = lastY + 15;
			return new Planet(lastX, lastY, 10);
		});
	}

	draw = (canvas, context, mouseLocation, lastClickPosition) => {
		context.clearRect(0, 0, canvas.width, canvas.height);
		this.stars.forEach(s => {
			s.update();
			s.draw(context);
		});

		this.mainPlanet.update(lastClickPosition, mouseLocation);
		this.mainPlanet.draw(context);

		this.orbitingPlanets.forEach(p => {
			p.update(lastClickPosition, mouseLocation);
			p.draw(context);
		});
	}
}
