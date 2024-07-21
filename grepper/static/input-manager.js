class InputManager {
	constructor() {
		this.mouseLocation = { x: 0, y: 0 };
	}

	listen = (canvas) => {
		canvas.addEventListener('mousemove', evt => {
			this.mouseLocation.x = evt.clientX;
			// This is a bit of a hack because the canvas doesn't take up the whole screen
			// and is fixed positioned
			this.mouseLocation.y = evt.clientY - 100;
		});

		canvas.addEventListener('mouseup', evt => {
			this.clickPosition = {
				x: evt.clientX,
				y: evt.clientY - 100
			};
		});
	};

	clear = () => {
		this.clickPosition = undefined;
	}
};

export default new InputManager();
