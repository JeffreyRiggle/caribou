import { setCurrentScene } from './scene-manager.js';
import { TransitioningResult } from './transitioning-result.js';
import { ExploreScene } from './explore-scene.js';
import { TransitioningStar } from './transitioning-star.js';

export class StarMapTransitionScene {
    constructor(stars, selectedResult, allResults, canvasWidth, canvasHeight) {
        this.stars = stars.map(s => new TransitioningStar(s, canvasWidth, canvasHeight));
        this.selectedResult = selectedResult;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.allResults = allResults.filter(r => r !== this.selectedResult).map(r => {
            return new TransitioningResult(r, canvasWidth, canvasHeight);
        });
    }

    draw = (canvas, context) => {
		context.clearRect(0, 0, canvas.width, canvas.height);
		const resetBSC = context.shadowColor;
		const resetBSB = context.shadowBlur;

		this.stars.forEach(s => {
			s.update();
			s.draw(context);
		});

        const resultsToRemove = [];
		this.allResults.forEach(r => {
			r.update();

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