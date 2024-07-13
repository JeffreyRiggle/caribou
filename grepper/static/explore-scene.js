import { Planet } from "./planet.js";
import { Star } from "./star.js";
import { PlanetWarp } from "./planet-warp.js";

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
		const initialRadius = 80;
		const xStart = this.canvasWidth / 2;
		const yStart = this.canvasHeight / 2;
		const [orbitingPlanets, connectors] = this.orbitingPlanets = this.exploring.links.reduce((prev, curr, ind) => {
			const angle = Math.random()*Math.PI*2;
			const targetRadius = initialRadius + (ind * 12);
			const x = xStart + (Math.cos(angle) * targetRadius);
			const y = yStart + (Math.sin(angle) * targetRadius);
			const planet = new Planet(x, y, 10);
			prev[0].push(planet);
			prev[1].push(new PlanetWarp(this.mainPlanet, planet)); 
			return prev;
		}, [[],[]]);

		this.orbitingPlanets = orbitingPlanets;
		this.planetWarps = connectors;
	}

	draw = (canvas, context, mouseLocation, lastClickPosition) => {
		context.clearRect(0, 0, canvas.width, canvas.height);
		this.stars.forEach(s => {
			s.update();
			s.draw(context);
		});

		this.mainPlanet.update(lastClickPosition, mouseLocation);

		const originalStrokeStyle = context.strokeStyle;
		const originalLineWidth = context.lineWidth;

		this.orbitingPlanets.forEach(p => p.update(lastClickPosition, mouseLocation));
		context.lineWidth = 3;
		this.planetWarps.forEach(pWarp => {
			pWarp.update();
			pWarp.draw(context);
		});
		context.strokeStyle = originalStrokeStyle;
		context.lineWidth = originalLineWidth;
		
		this.mainPlanet.draw(context);

		this.orbitingPlanets.forEach(p => {
			p.draw(context);
		});
	}
}
