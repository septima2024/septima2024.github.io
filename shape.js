const SHAPES = Object.freeze({ L: 'L', O: 'O', J: 'J', T: 'T', I: 'I', S: 'S', Z: 'Z' });

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
			case 'J': {
				return new Shape(
					'J',
					[
						new Tile(new Vec2(-1, -1), 0),
						new Tile(new Vec2(-1, 0), 7),
						new Tile(new Vec2(0, 0), 2),
						new Tile(new Vec2(1, 0), 3)
					],
					new Vec2(0, 0),
					new Vec2(1, 3)
				);
			}
			case 'O': {
				return new Shape(
					'O',
					[
						new Tile(new Vec2(0, 1), 0),
						new Tile(new Vec2(0, 0), 7),
						new Tile(new Vec2(1, 0), 2),
						new Tile(new Vec2(1, 1), 3)
					],
					new Vec2(0.5, 0.5),
					new Vec2(1, 1)
				);
			}
			case 'L': {
				return new Shape(
					'L',
					[
						new Tile(new Vec2(-1, 0), 7),
						new Tile(new Vec2(0, 0), 2),
						new Tile(new Vec2(1, 0), 3),
						new Tile(new Vec2(1, -1), 0)
					],
					new Vec2(0, 0),
					new Vec2(1, 3)
				);
			}
			case 'T': {
				return new Shape(
					'T',
					[
						new Tile(new Vec2(0, 0), 0),
						new Tile(new Vec2(1, 0), 7),
						new Tile(new Vec2(-1, 0), 2),
						new Tile(new Vec2(0, 1), 3),
					],
					new Vec2(0, 0),
					new Vec2(1, 2)
				);
			}
			case 'I': {
				return new Shape(
					'I',
					[
						new Tile(new Vec2(-1, 0), 0),
						new Tile(new Vec2(0, 0), 7),
						new Tile(new Vec2(1, 0), 2),
						new Tile(new Vec2(2, 0), 3),
					],
					new Vec2(0, 0),
					new Vec2(1, 3)
				);
			}
			case 'S': {
				return new Shape(
					'S',
					[
						new Tile(new Vec2(-1, 0), 0),
						new Tile(new Vec2(0, 0), 7),
						new Tile(new Vec2(0, -1), 2),
						new Tile(new Vec2(1, -1), 3),
					],
					new Vec2(0, 0),
					new Vec2(1, 3)
				);
			}
			case 'Z': {
				return new Shape(
					'Z',
					[
						new Tile(new Vec2(-1, -1), 3),
						new Tile(new Vec2(0, -1), 2),
						new Tile(new Vec2(0, 0), 0),
						new Tile(new Vec2(1, 0), 7),
					],
					new Vec2(0, 0),
					new Vec2(1, 3)
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
		this.rotation = (this.rotation + 3) % 4;
		this.tiles.forEach((tile) => {
			tile.pos.rotate_clockwise(this.rotation_centre);
			tile.rotation = this.rotation;
		});
	}

	rotate_counterclockwise() {
		this.rotation = (this.rotation + 1) % 4;
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

	top_y() {
		let min_y = Math.pow(2, 30);
		this.tiles.forEach((tile) => {
			if (tile.pos.y < min_y) {
				min_y = tile.pos.y;
			}
		});
		return min_y;
	}

	/**
	 *
	 * @param {Array<Array<Tile>>} canvas_tiles The tiles placed on the canvas
	 * @param {Vec2} canvas_size The dimensions of the canvas
	 */
	can_move_down(canvas_tiles, canvas_size) {
		return !this.tiles.some((tile) => {
			return (
				tile.pos.y >= -1 && // The tile is no more than one block above the screen
				(tile.pos.y >= canvas_size.y - 1 || // There is a wall below the current tile -> can not move there
					canvas_tiles[tile.pos.y + 1][tile.pos.x] !== null) // There is a tile below the current tile -> can not move there
			);
		});
	}

	/**
	 * @returns {Bool} if any tile of the shape is out of bounds or overlaps with a tile in canvas_tiles, returns false
	 * @param {Vec2} canvas_size The dimensions of the canvas
	 * @param {Array<Array<Tile>>} canvas_tiles The tiles placed on the canvas
	 */
	is_valid_position(canvas_size, canvas_tiles) {
		return this.tiles.every((tile) => {
			return (
				tile.pos.x >= 0 &&
				tile.pos.x < canvas_size.x &&
				tile.pos.y >= 0 &&
				tile.pos.y < canvas_size.y &&
				canvas_tiles[tile.pos.y][tile.pos.x] === null
			);
		});
	}
	can_rotate_clockwise(canvas_tiles, canvas_size) {
		this.rotate_clockwise();
		let res = this.is_valid_position(canvas_size, canvas_tiles);
		this.rotate_counterclockwise();
		return res;
	}
	can_rotate_counterclockwise(canvas_tiles, canvas_size) {
		this.rotate_counterclockwise();
		let res = this.is_valid_position(canvas_size, canvas_tiles);
		this.rotate_clockwise();
		return res;
	}

	/**
	 *
	 * @param {Array<Array<Tile>>} canvas_tiles The tiles placed on the canvas
	 */
	can_move_left(canvas_tiles) {
		return !this.tiles.some((tile) => {
			return (
				tile.pos.x <= 0 || // There is a wall to the left of the current tile -> can not move there
				(tile.pos.y >= 0 && // The tile is on the screen, so it could collide with other blocks to the left
					canvas_tiles[tile.pos.y][tile.pos.x - 1] !== null) // There is a tile to the left of the current tile -> can not move there
			);
		});
	}

	/**
	 *
	 * @param {Array<Array<Tile>>} canvas_tiles The tiles placed on the canvas
	 * @param {Vec2} canvas_size The dimensions of the canvas
	 */
	can_move_right(canvas_tiles, canvas_size) {
		return !this.tiles.some((tile) => {
			return (
				tile.pos.x >= canvas_size.x - 1 || // There is a wall to the right of the current tile -> can not move there
				(tile.pos.y >= 0 && // The tile is on the screen, so it could collide with other blocks to the right
					canvas_tiles[tile.pos.y][tile.pos.x + 1] !== null) // There is a tile to the right of the current tile -> can not move there
			);
		});
	}

	// sets pos of bottom-left corner
	set_pos(new_pos) {
		let dx = new_pos.x - this.left_x();
		let dy = new_pos.y - this.bottom_y();
		for (var tile of this.tiles) {
			tile.pos.x += dx;
			tile.pos.y += dy;
		}
		this.rotation_centre.x += dx;
		this.rotation_centre.y += dy;
	}
}

