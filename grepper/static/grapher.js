import { StarMapScene } from './star-map-scene.js';
let mouseLocation = {
	x: 0,
	y: 0
};

let lastClickPosition = {
	x: undefined,
	y: undefined
}

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

	canvas.addEventListener('mousemove', evt => {
		mouseLocation.x = evt.clientX;
		// This is a bit of a hack because the canvas doesn't take up the whole screen
		// and is fixed positioned
		mouseLocation.y = evt.clientY - 100;
	});

	canvas.addEventListener('mouseup', evt => {
		lastClickPosition.x = evt.clientX;
		lastClickPosition.y = evt.clientY - 100;
	});

	mainScene = new StarMapScene(canvasWidth, canvasHeight);
	requestAnimationFrame(runAnimationLoop);
});

function runAnimationLoop() {
	mainScene.draw(canvas, context, mouseLocation, lastClickPosition);
	requestAnimationFrame(runAnimationLoop);
}

