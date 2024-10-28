export class TransitioningGalaxy {
    constructor(originalResult, canvasWidth, canvasHeight) {
        this.x = originalResult.x;
        this.y = originalResult.y;
        this.radius = originalResult.radius;
        this.color = originalResult.color;
        this.stars = originalResult.stars;
        this.innerRadius = originalResult.innerRadius;
        this.result = originalResult.result;

        this.modX = this.x > (canvasWidth / 2) ? 1 : -1;
        this.modY = this.y > (canvasHeight / 2) ? 1 : -1;
    }

    draw = (context) => {
		context.beginPath();
		context.fillStyle = this.color.outer;
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
		context.arc(this.x, this.y, this.innerRadius, 0, 2 * Math.PI);
		context.closePath();
		context.fill();


		if (this.selected && this.selectionActions.length > 0) {
			this.selectionActions.forEach(a => a.draw(context));
			this.drawSelectionHeader(context);
		}

        this.stars.forEach(s => s.draw(context));
	}

    update = (moveX, moveY) => {
        if (!moveX && this.modX > 0) {
            this.modX += .1;
        } else  if (!moveX) {
            this.modX -= .1;
        }

        if (moveY && this.modY > 0) {
            this.modY += .1;
        } else if (moveY) {
            this.modY -= .1;
        }

        this.x += (moveX ?? this.modX);
        this.y += (moveY ?? this.modY);

        this.stars.forEach(s => s.update(moveX ?? this.modX, moveY ?? this.modY));
    }
}