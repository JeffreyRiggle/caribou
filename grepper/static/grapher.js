import { StarMapScene } from './star-map-scene.js';
import { getCurrentScene, setCurrentScene } from './scene-manager.js';
import inputManager from './input-manager.js';

let mainScene, canvas, context; 

async function handleChange(e) {
	const res = await fetch('/query-graph?q=' + e.target.value);
	const body = await res.json();
	mainScene.setupFromResults(body.results);
}

addEventListener('load', () => {
	const input = document.getElementById('search');
	input.addEventListener('change', handleChange);
	canvas = document.getElementById('result-view');
	context = canvas.getContext('2d');
	const canvasWidth = canvas.width = window.innerWidth;
	const canvasHeight = canvas.height = window.innerHeight - 100;
	inputManager.listen(canvas);
	
	mainScene = new StarMapScene(canvasWidth, canvasHeight);
	setCurrentScene(mainScene);
	requestAnimationFrame(runAnimationLoop);
});

function runAnimationLoop() {
	getCurrentScene().draw(canvas, context);
	inputManager.clear();
	requestAnimationFrame(runAnimationLoop);
}

