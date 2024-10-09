import inputManager from '../input-manager.js';

class PlanetAction {
	constructor(action, planet, radius, beginAngle, endAngle) {
		this.action = action;
		this.planet = planet;
		this.radius = radius;
		this.beginAngle = beginAngle;
		this.endAngle = endAngle;
		this.selected = false;
		this.createShape();
	}

	createShape = () => {
		this.shape = new Path2D();
		this.shape.arc(this.planet.x, this.planet.y, this.radius, this.beginAngle, this.endAngle);
		this.shape.lineTo(this.planet.x, this.planet.y);
	}

	update = () => {
		this.createShape();
	}

	draw = (context) => {
		const mouseLocation = inputManager.mouseLocation;
		const hover = mouseLocation && context.isPointInPath(this.shape, mouseLocation.x, mouseLocation.y);
		const alpha = hover ? .45 : .15; 
		context.fillStyle = `rgba(3, 190, 252, ${alpha})`;
		context.fill(this.shape);

		const textX = this.planet.x + (this.radius / 2) * Math.cos(this.beginAngle + (this.endAngle - this.beginAngle) / 2);
		const textY = this.planet.y + (this.radius / 2) * Math.sin(this.beginAngle + (this.endAngle - this.beginAngle) / 2);

		context.fillStyle = 'white';
		context.font = '12px roboto';
		context.fillText(this.action.displayText, textX, textY);

		const clickPosition = inputManager.clickPosition;
		if (!clickPosition) {
			return;
		}

		this.selected = context.isPointInPath(this.shape, clickPosition.x, clickPosition.y);

		if (this.selected) {
			setTimeout(() => this.action.action());
		}
	};
}

export class PlanetActions {
	constructor(planet, supportedActions) {
		this.planet = planet;
		const arcSize = (Math.PI * 2) / supportedActions.length;
		const actionPadding = .1;
		this.actions = supportedActions.map((action, i) => {
			const beginAngle = arcSize * i;
			const endAngle = (arcSize * (i + 1)) - actionPadding;
			return new PlanetAction(action, this.planet, this.planet.radius + 75, beginAngle, endAngle);
		});
	}

	update = () => {
		this.actions.forEach(a => a.update());
		this.selected = this.actions.some(a => a.selected);
	};

	draw = (context) => {
		this.actions.forEach(a => a.draw(context));	
		this.selected = this.actions.some(a => a.selected);
	};
}
