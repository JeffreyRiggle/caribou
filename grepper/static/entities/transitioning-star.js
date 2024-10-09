export class TransitioningStar {
    constructor(star, canvasWidth, canvasHeight) {
        this.alpha = star.alpha;
        this.alphaChange = star.alphaChange;
        this.blinkChance = star.blinkChance;
        this.x = star.x;
        this.y = star.y;
        this.size = star.size;

        // find closest edge and anchor to that
        const distances = [
            { target: 'top', value: this.y },
            { target: 'top-left', value: this.findDistance([0,0]) / 2 },
            { target: 'top-right', value: this.findDistance([canvasWidth, 0]) / 2 },
            { target: 'bottom', value: canvasHeight - this.y },
            { target: 'bottom-right', value: this.findDistance([canvasHeight,canvasWidth]) / 2 },
            { target: 'bottom-left', value: this.findDistance([0, canvasHeight]) / 2 },
            { target: 'left', value: this.x },
            { target: 'right', value: canvasWidth - this.x }
        ];

        const target = distances.reduce((minValue, currentValue) => {
            if (minValue.value < currentValue.value) return minValue;
            return currentValue;
        }, { value: Number.MAX_SAFE_INTEGER });
        this.targetDirection = target.target;
        this.targetPoint = [this.x, this.y];
    }

    findDistance = (targetPoint) => {
        const x = targetPoint[0] - this.x;
        const y = targetPoint[1] - this.y;
        return Math.sqrt((x * x) + (y * y));
    }

    draw = (context) => {
		context.beginPath();
		context.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
		context.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
		context.fill();
		context.closePath();
        context.beginPath();
        context.strokeStyle = `rgba(255, 255, 255, ${this.alpha})`;
        context.moveTo(this.x, this.y);
        context.lineTo(this.targetPoint[0], this.targetPoint[1]);
        context.stroke();
	}

	update = () => {
        if (this.targetDirection.includes('top')) {
            this.targetPoint[1] = this.targetPoint[1] - 5;
        }
        if (this.targetDirection.includes('bottom')) {
            this.targetPoint[1] = this.targetPoint[1] + 5;
        }
        if (this.targetDirection.includes('left')) {
            this.targetPoint[0] = this.targetPoint[0] - 5;
        }
        if (this.targetDirection.includes('right')) {
            this.targetPoint[0] = this.targetPoint[0] + 5;
        }

		if (this.alphaChange === 0 && Math.random() < this.blinkChance) {
			this.alphaChange = -1;
			return;
		}

		if (this.alphaChange === 0) return;

		this.alpha += this.alphaChange * .05;
		if (this.alpha <= 0) {
			this.alphaChange = 1;
		} else if (this.alpha >= 1) {
			this.alphaChange = 0;
		}
	}
}