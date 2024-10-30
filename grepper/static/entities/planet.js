import { PlanetActions } from "./planet-actions.js";
import inputManager from '../input-manager.js';
import { setCurrentScene } from "../scene-manager.js";
import { ExploreScene } from "../scenes/explore-scene.js";
import { PlanetScene } from "../scenes/planet-scene.js";
import { getPlanetImageEl, planetMappings, resetContextScope } from "../helpers.js";

export class Planet {
	constructor(url, x, y, radius, canvasWidth, canvasHeight, rotationData, planetType) {
		this.x = x;
		this.y = y;
		this.radius = radius;
		this.hover = false;
		this.wasSelected = false;
		this.selected = false;
		this.rotationData = rotationData;
		this.currentAngle = this.rotationData?.angle;
		this.rateOfRotation = Math.max(.00025, Math.random() * .0015);
		this.planetType = planetType ?? Object.keys(planetMappings)[Math.floor(Math.random() * 5)];
		
		const openAction = () => window.open(url, '_blank');
		const exploreAction = () => {
			const encodedUrl = btoa(url);
			Promise.all([
				fetch(`/api/v1/graph/${encodedUrl}`).then(res => res.json()),
				fetch(`/api/v1/${encodedUrl}/assets`).then(res => res.json())
			]).then(([graphResult, assetsResult]) => {
				setCurrentScene(new PlanetScene(canvasWidth, canvasHeight, graphResult, assetsResult.assets, url, this.planetType));
			});
		}
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
		resetContextScope(context, () => {
			context.beginPath();
			context.fillStyle = context.createPattern(getPlanetImageEl(this.planetType), 'repeat');
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
		});
	}
}
