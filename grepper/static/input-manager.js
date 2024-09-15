class InputManager {
	constructor() {
		this.mouseLocation = { x: 0, y: 0 };
	}

	listen = (canvas) => {
		canvas.addEventListener('mousemove', evt => {
			this.mouseLocation.x = evt.clientX;
			this.mouseLocation.y = evt.clientY;
		});

		canvas.addEventListener('mouseup', evt => {
			this.clickPosition = {
				x: evt.clientX,
				y: evt.clientY
			};
		});
	};

	clear = () => {
		this.clickPosition = undefined;
	}
};

export default new InputManager();
