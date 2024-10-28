import { SearchAction } from './search-action.js';
import {setCurrentScene} from '../scene-manager.js';
import inputManager from '../input-manager.js';
import { StarMapTransitionScene } from '../scenes/star-map-transition-scene.js';
import { GalaxyStar } from './galaxy-star.js';

const MAX_RADIUS = 125;
const ACTION_WIDTH = MAX_RADIUS * 2;
const HEADER_HEIGHT = 100;
const COMPONENT_PADDING = 20;
const TOTAL_HEADER_SIZE = HEADER_HEIGHT + COMPONENT_PADDING;

export class Galaxy {
    constructor(canvasWidth, canvasHeight, radius, color, result, originalScene) {
        this.canvasWidth = canvasWidth;
		this.canvasHeight = canvasHeight;
		this.originalScene = originalScene;
		this.x = Math.floor(Math.min(Math.random() * canvasWidth, canvasWidth - (radius * 2)));
		this.y = Math.floor(Math.min(Math.random() * canvasHeight, canvasHeight - (radius * 2)));
		this.radius = radius;
		this.color = color;
		this.result = result;
		this.innerRadius = radius / 4;
		this.hover = false;
		this.selected = false;
		this.selectionActions = [];
        this.circleRate = (Math.random() * 25) + 25;
        this.buildStars();

        if (radius >= 125) {
			this.growRate = 0;
		} else {
			this.growRate = (MAX_RADIUS - radius) / 30;
		}
        this.originalSize = this.radius;

		this.originalX = this.x;
		this.maxXPoint = MAX_RADIUS + ACTION_WIDTH + this.x;
		const minXPoint = this.x - MAX_RADIUS - ACTION_WIDTH;
		if (this.maxXPoint > canvasWidth) {
			this.translateX = -((this.maxXPoint - canvasWidth) / 30);
		} else if (minXPoint < 0) {
			this.translateX = Math.abs(minXPoint / 30);
		} else {
			this.translateX = 0;
		}

		this.originalY = this.y;
		this.maxYPoint = MAX_RADIUS + TOTAL_HEADER_SIZE + this.y;
		const minYPoint = this.y - MAX_RADIUS - TOTAL_HEADER_SIZE;
		if (this.maxYPoint > canvasHeight) {
			this.translateY = -((this.maxYPoint - canvasHeight) / 30);
		} else if (minYPoint < 0) {
			this.translateY = Math.abs(minYPoint / 30);
		} else {
			this.translateY = 0;
		}
    }

    buildStars() {
        this.stars = [];
        const growRate = .25;
        let rad = this.innerRadius + growRate;
        let angle = 0;
        while (rad < this.radius) {
            angle += (Math.PI * 2) / this.circleRate;
            const starX = this.x + rad * Math.cos(angle);
            const starY = this.y + rad * Math.sin(angle);
            this.stars.push(new GalaxyStar(starX, starY, ...this.color.inner));
            rad += growRate;
        }
    }

    draw = (context) => {
		context.beginPath();
		context.fillStyle = this.color.outer;
		context.shadowOffsetX = 0;
		context.shadowOffsetY = 0;
		context.shadowBlur = 15;
		context.shadowColor = 'white';

		if (this.hover) {
			context.shadowBlur = (this.radius - this.innerRadius) * 2;
		}

		if (this.selected) {
			context.shadowColor = 'rgb(3, 190, 252)';
			context.shadowBlur = 40;
		}
		context.arc(this.x, this.y, this.innerRadius, 0, 2 * Math.PI);
		context.closePath();
		context.fill();

		if (this.selected && this.selectionActions.length > 0) {
            this.selectionActions.forEach(a => a.draw(context));
			this.drawSelectionHeader(context);
		}
        
        this.stars.forEach(s => s.draw(context));
	}

    update = () => {
		const clickPosition = inputManager.clickPosition;
		if (clickPosition) {
			this.selected = Math.sqrt((clickPosition.x - this.originalX) ** 2 + (clickPosition.y - this.originalY) ** 2) < this.radius || this.selectionActions.some(a => a.selected);
		}

		if (this.selected && this.radius < MAX_RADIUS && this.growRate > 0) {
			this.radius = Math.min(MAX_RADIUS, this.growRate + this.radius);
            this.innerRadius = Math.min(MAX_RADIUS / 4, this.growRate + this.innerRadius);
            this.buildStars();
		}

		if (!this.selected && this.radius !== this.originalSize) {
			this.radius = Math.max(this.radius - this.growRate, this.originalSize);
            this.innerRadius = Math.max(this.innerRadius - this.growRate, this.originalSize / 4);
            this.buildStars();
		}

        let xdelta = 0;
        let ydelta = 0;

		if (this.selected && ((this.translateX > 0 && this.x - MAX_RADIUS - ACTION_WIDTH < 0) || (this.translateX < 0 && this.x + MAX_RADIUS + ACTION_WIDTH > this.canvasWidth)))  {
			if (this.translateX > 0) {
                const newX = Math.min(this.x + this.translateX, MAX_RADIUS + ACTION_WIDTH);
                xdelta = newX - this.x;
                this.x = newX;
			} else {
                const newX = Math.max(this.x + this.translateX, this.maxXPoint - this.canvasWidth);
                xdelta = newX - this.x;
                this.x = newX;
			}
		}

		if (!this.selected && this.x !== this.originalX) {
			if (this.translateX < 0) {
				const newX = Math.min(this.x - this.translateX, this.originalX);
                xdelta = newX - this.x;
                this.x = newX;
			} else {
				const newX = Math.max(this.x - this.translateX, this.originalX);
                xdelta = newX - this.x;
                this.x = newX;
			}
		}

		if (this.selected && ((this.translateY > 0 && this.y - MAX_RADIUS - TOTAL_HEADER_SIZE < 0) || (this.translateY < 0 && this.y + MAX_RADIUS + TOTAL_HEADER_SIZE > this.canvasHeight)))  {
			if (this.translateY > 0) {
				const newY = Math.min(this.y + this.translateY, MAX_RADIUS + TOTAL_HEADER_SIZE);
                ydelta = newY - this.y;
                this.y = newY;
			} else {
				const newY = Math.max(this.y + this.translateY, this.maxYPoint - this.canvasHeight);
                ydelta = newY - this.y;
                this.y = newY;
			}
		}

		if (!this.selected && this.y !== this.originalY) {
			if (this.translateY < 0) {
				const newY = Math.min(this.y - this.translateY, this.originalY);
                ydelta = newY - this.y;
                this.y = newY;
			} else {
				const newY = Math.max(this.y - this.translateY, this.originalY);
                ydelta = newY - this.y;
                this.y = newY;
			}
		}

		const mouseLocation = inputManager.mouseLocation;
		this.hover = Math.sqrt((mouseLocation.x - this.x) ** 2 + (mouseLocation.y - this.y) ** 2) < this.radius;
		this.selectionActions.forEach(a => a.update());
        this.stars.forEach(s => s.update(xdelta, ydelta));
		
		if (this.selected && this.selectionActions.length === 0 && this.radius >= MAX_RADIUS) {
			const leftX = this.x - ACTION_WIDTH - this.radius - COMPONENT_PADDING;
			const boxY = this.y - this.radius;
			const rightX = this.x + this.radius + COMPONENT_PADDING;
			const openAction = () => window.open(this.result.url, '_blank');
			const exploreAction = () => {
				setCurrentScene(new StarMapTransitionScene(this.originalScene.stars, this, this.originalScene.searchResults, this.canvasWidth, this.canvasHeight));
			};
			this.selectionActions.push(new SearchAction(leftX, boxY, ACTION_WIDTH, 'Visit', this.result.summary, openAction));
			this.selectionActions.push(new SearchAction(rightX, boxY, ACTION_WIDTH, 'Explore', this.getExploreSubText(), exploreAction));
		} else if (!this.selected && this.selectionActions.length > 0) {
			this.selectionActions = [];
		}
	}

    drawSelectionHeader(context) {
		const diameter = this.radius * 2;
		const headerX = this.x - diameter - this.radius - COMPONENT_PADDING;
		const headerY = this.y - this.radius - TOTAL_HEADER_SIZE;
		const headerWidth = diameter /* left box */ + diameter /* center */  + diameter /* right box */ + (COMPONENT_PADDING * 2) /* padding * 2 */;
		const headerHeight = HEADER_HEIGHT;
		context.beginPath();
		context.fillStyle = 'rgba(3, 190, 252, .15)';
		context.rect(headerX, headerY, headerWidth, headerHeight);
		context.closePath();
		context.fill();
		context.fillStyle = 'white';
		context.font = '24px roboto';
		context.textAlign = 'center';
		context.textBaseline = 'middle';
		context.fillText(this.result.title, headerX + (headerWidth / 2), headerY + (headerHeight / 2));
	}

	getExploreSubText() {
		let result = '';

		const truncatedResults = Math.min(10, this.result.links.length);
		for (let i = 0; i < truncatedResults; i++) {
			result += `${this.result.links[i]}, \n`;
		}

		if (this.result.links.length > 10) {
			result += `+${this.result.links.length - 10} more`;
		}

		return result;
	}
}