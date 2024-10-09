import { setCurrentScene } from '../scene-manager.js';
import { TransitioningResult } from '../entities/transitioning-result.js';
import { ExploreScene } from './explore-scene.js';
import { TransitioningStar } from '../entities/transitioning-star.js';

export class StarMapTransitionScene {
    constructor(stars, selectedResult, allResults, canvasWidth, canvasHeight) {
        this.stars = stars.map(s => new TransitioningStar(s, canvasWidth, canvasHeight));
        this.selectedResult = selectedResult;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.allResults = allResults.filter(r => r !== this.selectedResult).map(r => {
            return new TransitioningResult(r, canvasWidth, canvasHeight);
        });
        this.targetX = this.canvasWidth / 2;
        this.targetY = this.canvasHeight / 2;
    }

    centerMainResult = () => {
        let moveXAmount, moveYAmount;
        if (this.selectedResult.x < this.targetX) {
            const newX = Math.min(this.targetX, this.selectedResult.x + 5);
            moveXAmount = newX - this.selectedResult.x;
            this.selectedResult.x = newX;
        } else {
            const newX = Math.max(this.targetX, this.selectedResult.x - 5);
            moveXAmount = newX - this.selectedResult.x;
            this.selectedResult.x = newX;
        }
        
        if (this.selectedResult.y < this.targetY) {
            const newY = Math.min(this.targetY, this.selectedResult.y + 5);
            moveYAmount = newY - this.selectedResult.y;
            this.selectedResult.y = newY;
        } else {
            const newY = Math.max(this.targetY, this.selectedResult.y - 5);
            moveYAmount = newY - this.selectedResult.y;
            this.selectedResult.y = newY;
        }

        return { moveXAmount, moveYAmount };
    }

    draw = (canvas, context) => {
		context.clearRect(0, 0, canvas.width, canvas.height);
		const resetBSC = context.shadowColor;
		const resetBSB = context.shadowBlur;

        const movingMainResult = this.selectedResult.x !== this.targetX || this.selectedResult.y !== this.targetY;
        let moveResult;
        if (movingMainResult) {
            moveResult = this.centerMainResult();
        }

		this.stars.forEach(s => {
			if (!movingMainResult) {
                s.update();
            }

			s.draw(context);
		});

        const resultsToRemove = [];
		this.allResults.forEach(r => {
            if (!movingMainResult) {
                r.update();
            } else {
                r.x += moveResult.moveXAmount
                r.y += moveResult.moveYAmount
            }

            const offScreenX = (r.x - r.radius) > this.canvasWidth || (r.x + r.radius) <= 0;
            if (offScreenX) {
                resultsToRemove.push(r);
                return;
            }

            const offScreenY = (r.y + r.radius) > this.canvasHeight || (r.y + r.radius) <= 0;
            if (offScreenY) {
                resultsToRemove.push(r);
            }
		});

        resultsToRemove.forEach(r => {
            const index = this.allResults.indexOf(r);
            if (index === -1) return;
            this.allResults.splice(index, 1);
        });

        if (this.allResults.length === 0) {
            setCurrentScene(new ExploreScene(this.canvasWidth, this.canvasHeight, this.selectedResult.result));
            return;
        }

		this.allResults.forEach(r => {
			r.draw(context);
			context.shadowColor = resetBSC;
			context.shadowBlur = resetBSB;
		});

		this.selectedResult.draw(context);
		context.shadowColor = resetBSC;
		context.shadowBlur = resetBSB;
	}
}