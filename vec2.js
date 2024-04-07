class Vec2 {
	/**
	 *
	 * @param {Number} x The x coordinate
	 * @param {Number} y The y coordinate
	 */
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	/**
	 *
	 * @param {Vec2} rotation_centre The point around which to rotate
	 */
	rotate_clockwise(rotation_centre) {
		let moved = new Vec2(
			this.x - rotation_centre.x,
			this.y - rotation_centre.y
		);
		let rotated = new Vec2(-moved.y, moved.x);
		this.x = rotated.x + rotation_centre.x;
		this.y = rotated.y + rotation_centre.y;
	}

	/**
	 *
	 * @param {Vec2} rotation_centre The point around which to rotate
	 */
	rotate_counterclockwise(rotation_centre) {
		let moved = new Vec2(
			this.x - rotation_centre.x,
			this.y - rotation_centre.y
		);
		let rotated = new Vec2(moved.y, -moved.x);
		this.x = rotated.x + rotation_centre.x;
		this.y = rotated.y + rotation_centre.y;
	}
}
