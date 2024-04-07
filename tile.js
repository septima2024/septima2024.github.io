class Tile {
	/**
	 *
	 * @param {Vec2} pos The position of the tile within the shape
	 * @param {Number} img The index of the image
	 */
	constructor(pos, img_id) {
		this.pos = pos;
		this.img_id = img_id;
		this.rotation = 0;
	}

	/**
	 *
	 * @param {any} ctx The drawing context
	 * @param {Vec2} dimensions The image dimensions
	 * @param {Number} rotation The shape rotation
	 */
	render(ctx, dimensions, rotation) {
		let canvas_position = new Vec2(
			this.pos.x * dimensions.x,
			this.pos.y * dimensions.y
		);
		if (rotation === undefined) {
			rotation = this.rotation;
		}
		ctx.drawImage(
			images[this.img_id*4+rotation],
			canvas_position.x,
			canvas_position.y,
			dimensions.x,
			dimensions.y
		);
	}

	/**
	 *
	 * @param {any} ctx The drawing context
	 * @param {Vec2} dimensions The image dimensions
	 */
	undraw(ctx, dimensions) {
		let canvas_position = new Vec2(
			this.pos.x * dimensions.x,
			this.pos.y * dimensions.y
		);
		ctx.clearRect(
			canvas_position.x,
			canvas_position.y,
			dimensions.x,
			dimensions.y
		);
	}
}
