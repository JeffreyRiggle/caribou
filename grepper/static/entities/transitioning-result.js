import { getFillGradient } from '../helpers.js';

export class TransitioningResult {
    constructor(originalResult, canvasWidth, canvasHeight) {
        this.x = originalResult.x;
        this.y = originalResult.y;
        this.radius = originalResult.radius;
        this.color = originalResult.color;
        this.innerRadius = originalResult.innerRadius;

        this.modX = this.x > (canvasWidth / 2) ? 1 : -1;
        this.modY = this.y > (canvasHeight / 2) ? 1 : -1;
    }

    draw = (context) => {
		context.beginPath();
		context.fillStyle = getFillGradient(context, this.x, this.y, this.innerRadius, this.radius, this.color);
		context.shadowOffsetX = 0;
		context.shadowOffsetY = 0;
		context.shadowBlur = 15;
		context.shadowColor = 'white';

		if (this.hover) {
			context.shadowBlur = 25;
		}

		if (this.selected) {
			context.shadowColor = 'rgb(3, 190, 252)';
			context.shadowBlur = 40;
		}
		context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
		context.closePath();
		context.fill();


		if (this.selected && this.selectionActions.length > 0) {
			this.selectionActions.forEach(a => a.draw(context));
			this.drawSelectionHeader(context);
		}
	}

    update = () => {
        if (this.modX > 0) {
            this.modX += .1;
        } else {
            this.modX -= .1;
        }

        if (this.modY > 0) {
            this.modY += .1;
        } else {
            this.modY -= .1;
        }

        this.x += this.modX;
        this.y += this.modY;
    }
}