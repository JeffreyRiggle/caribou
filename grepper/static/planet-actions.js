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

	update = (mouseLocation, lastClickPosition) => {
		this.createShape();
		this.mouseLocation = mouseLocation;
		this.lastClickPosition = lastClickPosition;
	}

	draw = (context) => {
		const hover = this.mouseLocation && context.isPointInPath(this.shape, this.mouseLocation.x, this.mouseLocation.y);
		const alpha = hover ? .45 : .15; 
		context.fillStyle = `rgba(3, 190, 252, ${alpha})`;
		context.fill(this.shape);

		const textX = this.planet.x + (this.radius / 2) * Math.cos(this.beginAngle + (this.endAngle - this.beginAngle) / 2);
		const textY = this.planet.y + (this.radius / 2) * Math.sin(this.beginAngle + (this.endAngle - this.beginAngle) / 2);

		context.fillStyle = 'white';
		context.font = '12px roboto';
		context.fillText(this.action.displayText, textX, textY);

		const isSelected = this.lastClickPosition && context.isPointInPath(this.shape, this.lastClickPosition.x, this.lastClickPosition.y);

		if (isSelected && !this.selected) {
			setTimeout(() => this.action.action());
		}
		this.selected = isSelected;
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

	update = (mouseLocation, lastClickPosition) => {
		this.actions.forEach(a => a.update(mouseLocation, lastClickPosition));
	};

	draw = (context) => {
		this.actions.forEach(a => a.draw(context));	
	};
}
