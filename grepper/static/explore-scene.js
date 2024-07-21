import { Planet } from "./planet.js";
import { Star } from "./star.js";
import { PlanetWarp } from "./planet-warp.js";

export class ExploreScene {
	constructor(canvasWidth, canvasHeight, exploring) {
		this.stars = [];
		this.planetWarps = new Map();
		this.canvasWidth = canvasWidth;
		this.canvasHeight = canvasHeight;
		this.setupStars();
		this.exploring = exploring;
		this.mainPlanet = new Planet(this.exploring.url, this.canvasWidth / 2, this.canvasHeight / 2, 50);
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
		this.orbitingPlanets = this.exploring.links.map((link, ind) => {
			const angle = Math.random()*Math.PI*2;
			const targetRadius = initialRadius + (ind * 12);
			const x = xStart + (Math.cos(angle) * targetRadius);
			const y = yStart + (Math.sin(angle) * targetRadius);
			return new Planet(link, x, y, 10, { xStart, yStart, angle, targetRadius });
		});
	}

	draw = (canvas, context) => {
		context.clearRect(0, 0, canvas.width, canvas.height);
		this.stars.forEach(s => {
			s.update();
			s.draw(context);
		});

		this.mainPlanet.update();

		const originalStrokeStyle = context.strokeStyle;
		const originalLineWidth = context.lineWidth;

		let anySelected = this.orbitingPlanets.some(p => p.selected);
		this.orbitingPlanets.forEach(p => {
			p.update(anySelected);
			let hasPlanetWarp = this.planetWarps.has(p.id);
			if (p.selected && !hasPlanetWarp) {
				this.planetWarps.set(p.id, new PlanetWarp(this.mainPlanet, p));
			} else if (!p.selected && hasPlanetWarp) {
				this.planetWarps.delete(p.id);
			}
			anySelected = anySelected || p.selected;
		});
		context.lineWidth = 3;
		this.planetWarps.values().forEach(pWarp => {
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
