import { PlanetActions } from "./planet-actions.js";
import inputManager from './input-manager.js';
import { setCurrentScene } from "./scene-manager.js";
import { ExploreScene } from "./explore-scene.js";

let planets = {};
let id = 0;
const planetMappings = {
	'cold': './static/coldplanet.png',
	'forest': './static/forestplanet.png',
	'fire': './static/fireplanet.png',
	'purple': './static/purpleplanet.png',
	'living': './static/livingplanet.png'
};

const getImageEl = (id) => {
	let planet = planets[id];
	if (planet) {
		return planet;
	}

	planet = document.createElement('img');
	planet.src = planetMappings[id];
	planets[id] = planet;

	return planet;
};

export class Planet {
	constructor(url, x, y, radius, canvasWidth, canvasHeight, rotationData) {
		this.id = id++;
		this.x = x;
		this.y = y;
		this.radius = radius;
		this.hover = false;
		this.wasSelected = false;
		this.selected = false;
		this.rotationData = rotationData;
		this.currentAngle = this.rotationData?.angle;
		this.rateOfRotation = Math.max(.00025, Math.random() * .0015);
		this.planetType = Object.keys(planetMappings)[Math.floor(Math.random() * 5)];
		
		const openAction = () => window.open(url, '_blank');
		const exploreAction = () => console.log('TODO explore');
		const followAction = () => {
			fetch(`/api/v1/graph/${btoa(url)}`).then(res => {
				res.json().then(body => {
					setCurrentScene(new ExploreScene(canvasWidth, canvasHeight, body));
				});
			});
		};
		const actions = !this.rotationData ? [
			{ displayText: 'Visit', action: openAction },
			{ displayText: 'Explore', action: exploreAction }
		] : [
			{ displayText: 'Visit', action: openAction },
			{ displayText: 'Explore', action: exploreAction },
			{ displayText: 'Follow', action: followAction }];
		this.planetActions = new PlanetActions(this, actions);
	}

	update = (anySelected) => {
		const clickPosition = inputManager.clickPosition;
		const mouseLocation = inputManager.mouseLocation;
		this.planetActions.update();
		this.hover = Math.sqrt((mouseLocation.x - this.x) ** 2 + (mouseLocation.y - this.y) ** 2) < this.radius;

		this.wasSelected = this.selected;
		if (clickPosition) {
			this.selected = Math.sqrt((clickPosition.x - this.x) ** 2 + (clickPosition.y - this.y) ** 2) < this.radius;
		}
		
		if (this.selected || anySelected) return;

		if (!this.rotationData) return;

		if (this.currentAngle >= Math.PI*2) {
			this.currentAngle = .001;
		} else {
			this.currentAngle = Math.min(Math.PI * 2, this.currentAngle + this.rateOfRotation);
		}
		this.x = this.rotationData.xStart + (Math.cos(this.currentAngle) * this.rotationData.targetRadius);
		this.y = this.rotationData.yStart + (Math.sin(this.currentAngle) * this.rotationData.targetRadius);
	}

	draw = (context) => {
		if (this.wasSelected) {
			this.planetActions.draw(context);
			// this is a bit weird really the selected state of planet actions
			// is driven by context. Since update does not have context this hack was needed
			this.selected = this.selected || this.planetActions.selected;
		}
		const initialShadowOffsetX = context.shadowOffsetX;
		const initialShadowOffsetY = context.shadowOffsetY;
		const initialShadowBlur = context.shadowBlur;
		const initialShadowColor = context.shadowColor;

		context.beginPath();
		context.fillStyle = context.createPattern(getImageEl(this.planetType), 'repeat');
		context.shadowOffsetX = 0;
		context.shadowOffsetY = 0;
		context.shadowBlur = 15;
		context.shadowColor = 'white';

		if (this.hover) {
			context.shadowBlur = 25;
		}

		context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
		context.closePath();
		context.fill();

		context.shadowOffsetX = initialShadowOffsetX;
		context.shadowOffsetY = initialShadowOffsetY;
		context.shadowBlur = initialShadowBlur;
		context.shadowColor = initialShadowColor;
	}
}
