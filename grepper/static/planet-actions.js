export class PlanetActions {
	constructor(planet, supportedActions) {
		this.planet = planet;
		this.arcSize = (Math.PI * 2) / supportedActions.length;
		this.actionPadding = .1;
		this.supportedActions = supportedActions;
	}

	update = () => {
	};

	draw = (context) => {
		for (let i = 0; i < this.supportedActions.length; i++) {
			const beginAngle = this.arcSize * i;
			const endAngle = (this.arcSize * (i + 1)) - this.actionPadding;
			context.beginPath();
			context.fillStyle = 'rgba(3, 190, 252, .15)';
			context.arc(this.planet.x, this.planet.y, this.planet.radius + 75, beginAngle, endAngle);
			context.lineTo(this.planet.x, this.planet.y);
			context.fill();

			const textX = this.planet.x + ((this.planet.radius + 75) / 2) * Math.cos(beginAngle + (endAngle - beginAngle) / 2);
			const textY = this.planet.y + ((this.planet.radius + 75) / 2) * Math.sin(beginAngle + (endAngle - beginAngle) / 2);

			context.fillStyle = 'white';
			context.font = '12px roboto';
			context.fillText(this.supportedActions[i].displayText, textX, textY);
		}
	};
}
