class Tile {
	/**
	 *
	 * @param {Vec2} pos The position of the tile within the shape
	 * @param {Image} img The image for the tile
	 */
	constructor(pos, img) {
		this.pos = pos;
		this.img = img;
		this.rotation = 0;
	}

	/**
	 *
	 * @param {any} ctx The drawing context
	 * @param {Vec2} dimensions The image dimensions
	 * @param {Number} rotation The shape rotation
	 */
	render(ctx, dimensions, rotation) {
		console.log(this.pos.y);
		let canvas_position = new Vec2(
			this.pos.x * dimensions.x,
			this.pos.y * dimensions.y
		);
		ctx.drawImage(
			this.img,
			canvas_position.x,
			canvas_position.y - dimensions.y, // The image position is the position of the top left corner of the image, while here the shape position refers to the bottom left corner of the bottom left tile in the shape
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
			canvas_position.y - dimensions.y, // The image position is the position of the top left corner of the image, while here the shape position refers to the bottom left corner of the bottom left tile in the shape
			dimensions.x,
			dimensions.y
		);
	}
}
