class Shape {
	/**
	 *
	 * @param {String} name The shape name
	 * @param {Array<Tile>} tiles The tiles inside the shape
	 * @param {Vec2} rotation_centre The point around which the shape should be rotated
	 * @param {Vec2} position The position of the bottom left corner
	 */
	constructor(name, tiles, rotation_centre, position) {
		this.name = name;
		this.tiles = tiles.map((t) => {
			t.pos.x += position.x;
			t.pos.y += position.y;
			return t;
		});
		this.rotation_centre = rotation_centre;
		this.rotation_centre.x += position.x;
		this.rotation_centre.y += position.y;
		this.rotation = 0;
	}

	rotate_clockwise() {
		this.rotation = (this.rotation + 90) % 360;
		this.tiles.forEach((tile) => {
			tile.pos.rotate_clockwise(this.rotation_centre);
			tile.rotation = this.rotation;
		});
	}

	rotate_counterclockwise() {
		this.rotation = (this.rotation - 90) % 360;
		this.tiles.forEach((tile) => {
			tile.pos.rotate_counterclockwise(this.rotation_centre);
			tile.rotation = this.rotation;
		});
	}

	/**
	 *
	 * @param {any} ctx The drawing context
	 * @param {Vec2} dimensions The tile image dimensions
	 */
	render(ctx, dimensions) {
		this.tiles.forEach((tile) => {
			tile.render(ctx, dimensions, this.rotation);
		});
	}

	/**
	 *
	 * @param {any} ctx The drawing context
	 * @param {Vec2} dimensions The tile image dimensions
	 */
	undraw(ctx, dimensions) {
		this.tiles.forEach((tile) => {
			tile.undraw(ctx, dimensions);
		});
	}

	/**
	 * Moves the shape one spot down
	 */
	move_down() {
		this.tiles.forEach((t) => {
			t.pos.y += 1;
		});
		this.rotation_centre.y += 1;
	}

	/**
	 *
	 * @returns {Array<Tile>} The tiles with the positions relative to the canvas
	 */
	place_down() {
		return this.tiles.map((t) => {
			t.x += this.position.x;
			t.y += this.position.y;
		});
	}
}
