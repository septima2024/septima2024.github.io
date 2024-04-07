const SHAPES = Object.freeze({ L: 'L', O: 'O' });

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

	static generate_shape(shape) {
		switch (shape) {
			case 'L': {
				return new Shape(
					'L',
					[
						new Tile(new Vec2(0, -1), images[0]),
						new Tile(new Vec2(0, 0), images[7]),
						new Tile(new Vec2(1, 0), images[2]),
						new Tile(new Vec2(2, 0), images[3])
					],
					new Vec2(1, 0),
					new Vec2(0, -1)
				);
			}
			case 'O': {
				return new Shape(
					'O',
					[
						new Tile(new Vec2(0, -1), images[0]),
						new Tile(new Vec2(0, 0), images[7]),
						new Tile(new Vec2(1, 0), images[2]),
						new Tile(new Vec2(1, -1), images[3])
					],
					new Vec2(0.5, -0.5),
					new Vec2(0, -1)
				);
			}
		}
	}

	static generate_random_shape() {
		const shapes_ids = Object.keys(SHAPES);
		return Shape.generate_shape(
			SHAPES[shapes_ids[Math.floor(Math.random() * shapes_ids.length)]]
		);
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
	 * Moves the shape one spot to the right
	 */
	move_right() {
		this.tiles.forEach((t) => {
			t.pos.x += 1;
		});
		this.rotation_centre.x += 1;
	}

	/**
	 * Moves the shape one spot to the left
	 */
	move_left() {
		this.tiles.forEach((t) => {
			t.pos.x -= 1;
		});
		this.rotation_centre.x -= 1;
	}

	/**
	 *
	 * @returns {Array<Tile>} The tiles with the positions relative to the canvas
	 */
	place_down() {
		return this.tiles;
	}

	width() {
		let max_x = -Math.pow(2, 30);
		let min_x = Math.pow(2, 30);
		this.tiles.forEach((tile) => {
			if (tile.pos.x > max_x) {
				max_x = tile.pos.x;
			}
			if (tile.pos.x < min_x) {
				min_x = tile.pos.x;
			}
		});
		return max_x - min_x + 1;
	}

	left_x() {
		let min_x = Math.pow(2, 30);
		this.tiles.forEach((tile) => {
			if (tile.pos.x < min_x) {
				min_x = tile.pos.x;
			}
		});
		return min_x;
	}

	right_x() {
		let max_x = -Math.pow(2, 30);
		this.tiles.forEach((tile) => {
			if (tile.pos.x > max_x) {
				max_x = tile.pos.x;
			}
		});
		return max_x;
	}

	bottom_y() {
		let max_y = -Math.pow(2, 30);
		this.tiles.forEach((tile) => {
			if (tile.pos.y > max_y) {
				max_y = tile.pos.y;
			}
		});
		return max_y;
	}

	/**
	 *
	 * @param {Vec2} canvas_size The dimensions of the canvas
	 * @param {Array<Array<Tile>>} canvas_tiles The tiles placed on the canvas
	 */
	can_move_down(canvas_size, canvas_tiles) {
		return this.bottom_y() < canvas_size.y - 1;
	}

	/**
	 *
	 * @param {Array<Array<Tile>>} canvas_tiles The tiles placed on the canvas
	 */
	can_move_left(canvas_tiles) {
		return this.left_x() > 0;
	}

	/**
	 *
	 * @param {Vec2} canvas_size The dimensions of the canvas
	 * @param {Array<Array<Tile>>} canvas_tiles The tiles placed on the canvas
	 */
	can_move_right(canvas_size, canvas_tiles) {
		return this.right_x() < canvas_size.x - 1;
	}
}
