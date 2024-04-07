const EVENTS = Object.freeze({
	MOVE_DOWN: 'MOVE_DOWN',
	MOVE_RIGHT: 'MOVE_RIGHT',
	MOVE_LEFT: 'MOVE_LEFT',
	ROTATE_CW: 'ROTATE_CW',
	ROTATE_CCW: 'ROTATE_CCW',
});
const tile_size = new Vec2(30, 30);
const canvas_size = new Vec2(10, 15);
const ms_to_move = 1000;

const img_prefix = './images/';
const img_sources = [
	'c++',
	'FACEBOOK',
	'fb',
	'ferris',
	'ico',
	'ig',
	'INSTAGRAM',
	'logo',
	'MAIL',
	'mail0',
	'most_icon'
];

const images = [];
images.length = img_sources.length * 4;

let image_promises = img_sources.map(function (img_src, index) {
	return new Promise(function (resolve, reject) {
		for (let i = 0; i < 4; i++) {
			let img = new Image();
			img.onload = function () {
				resolve(img);
			};
			img.onerror = function () {
				reject(new Error('Could not load image at ' + img_src));
			};
			img.src = img_prefix + img_src + i + ".png";
			images[index*4+i] = img;
		}
	});
});

let loaded = false;

window.onload = async function () {
	let canvas = document.getElementById('board');
	canvas.setAttribute('width', canvas_size.x * tile_size.x);
	canvas.setAttribute('height', canvas_size.y * tile_size.y);
	let images_loaded = false;
	// Wait to load all images
	try {
		await Promise.all(image_promises);
		console.log(images);
		images_loaded = true;
	} catch (error) {
		// One or more images failed to load
		console.error(error);
	}

	let play_button = document.getElementById('play-button');
	play_button.textContent = 'Hråt';
	play_button.onclick = play;
	play_button.removeAttribute('disabled');
	loaded = images_loaded; // TODO: Make this work properly
};

function play() {
	// TODO: Make this work properly
	if (!loaded) {
		return;
	}
	console.log('Play!');

	let current_shape = null;
	freeze();

	let canvas = document.getElementById('board');
	canvas.setAttribute('width', canvas_size.x * tile_size.x);
	canvas.setAttribute('height', canvas_size.y * tile_size.y);
	let ctx = canvas.getContext('2d');

	let placed_tiles = Array.from({ length: canvas_size.y }, () =>
		Array.from({ length: canvas_size.x }, () => null)
	);
	console.log(placed_tiles);

	window.addEventListener("keydown", function (event) {
		if (event.defaultPrevented) {
			return;
		}
		let actions = {
			"ArrowDown":() => {
				if (current_shape.can_move_down(canvas_size, placed_tiles)) {
					current_shape.move_down();
				}
			},
			"ArrowUp":() => {
				if (current_shape.can_rotate_clockwise(canvas_size, placed_tiles)) {
					current_shape.rotate_clockwise();
				}
			},
			"ArrowLeft":() => {
				if (current_shape.can_move_left(placed_tiles)) {
					current_shape.move_left();
				}
			},
			"ArrowRight":() => {
				if (current_shape.can_move_right(canvas_size, placed_tiles)) {
					current_shape.move_right();
				}
			},
		};
		if (event.key in actions && current_shape != null) {
			current_shape.undraw(ctx, tile_size);
			actions[event.key]();
			current_shape.render(ctx, tile_size);
			event.preventDefault();
		}
	}, true);

	let events = [];

	let loop_id = setInterval(() => {
		// This should be done in an event gathering loop
		/*let r = Math.random();
		if (r < 1 / 5) {
			events.push(EVENTS.MOVE_DOWN);
		} else if (r < 2 / 5) {
			events.push(EVENTS.MOVE_RIGHT);
		} else if (r < 3 / 5) {
			events.push(EVENTS.MOVE_LEFT);
		} else if (r < 4 / 5) {
			events.push(EVENTS.ROTATE_CW);
		} else if (r < 5 / 5) {
			events.push(EVENTS.ROTATE_CCW);
		}*/

		current_shape.undraw(ctx, tile_size);
		let can_move_down_start = current_shape.can_move_down(
			canvas_size,
			placed_tiles
		);

		for (const event of events) {
			switch (event) {
				case EVENTS.MOVE_DOWN: {
					if (
						current_shape.can_move_down(canvas_size, placed_tiles)
					) {
						current_shape.move_down();
					}
					break;
				}
				case EVENTS.MOVE_RIGHT: {
					if (
						current_shape.can_move_right(canvas_size, placed_tiles)
					) {
						current_shape.move_right();
					}
					break;
				}
				case EVENTS.MOVE_LEFT: {
					if (current_shape.can_move_left(placed_tiles)) {
						current_shape.move_left();
					}
					break;
				}
				case EVENTS.ROTATE_CW: {
					if (current_shape.can_rotate_clockwise(canvas_size, placed_tiles)) {
						current_shape.rotate_clockwise();
					}
					break;
				}
				case EVENTS.ROTATE_CCW: {
					if (current_shape.can_rotate_counterclockwise(canvas_size, placed_tiles)) {
						current_shape.rotate_counterclockwise();
					}
					break;
				}
			}
		}
		events = [EVENTS.MOVE_DOWN]; // The shape should always move down

		let can_move_down_end = current_shape.can_move_down(
			canvas_size,
			placed_tiles
		);
		if (!can_move_down_end && !can_move_down_start) {
			// Only freeze the tile if it can't be moved now AND it couldn't have been moved at the end of the previous iteration (= at the beginning of this iteration)
			current_shape.render(ctx, tile_size);
			freeze();
		}
		current_shape.render(ctx, tile_size);
	}, ms_to_move);

	function freeze() {
		if (current_shape !== null) {
			let tiles = current_shape.place_down();
			for (let i = 0; i < tiles.length; i += 1) {
				let tile_pos = tiles[i].pos;
				placed_tiles[tile_pos.y][tile_pos.x] = tiles[i];
				placed_tiles[tile_pos.y][tile_pos.x].rotation = current_shape.rotation;
			}
			let clears = 0;
			for (let y = canvas_size.y - 1; y >= 0; y--) {
				while (y >= 0 && !placed_tiles[y].some((t) => t === null)) {
					clears++;
					y--;
				}
				if (clears > 0) {
					let ty = y + clears;
					for (let x = 0; x < canvas_size.x; x++) {
						if (placed_tiles[ty][x] !== null) {
							placed_tiles[ty][x].undraw(ctx, tile_size);
							placed_tiles[ty][x] = null;
						}
						placed_tiles[ty][x] = placed_tiles[y][x];
						if (placed_tiles[y][x] !== null) {
							placed_tiles[y][x].undraw(ctx, tile_size);
							placed_tiles[y][x] = null;
							placed_tiles[ty][x].pos = new Vec2(x, ty);
							placed_tiles[ty][x].render(ctx, tile_size);
						}
					}
				}
			}
		}
		current_shape = Shape.generate_random_shape();
		// This should make sure that shapes that can have their centre tile in the middle of the canvas will be placed that way, while those that would have to be at half coordinates will be placed randomly to the left or to the right of the middle
		let tiles_to_shift = Math.floor(
			(canvas_size.x - current_shape.width()) / 2.0 + Math.random()
		);
		for (let i = 0; i < tiles_to_shift; i += 1) {
			current_shape.move_right();
		}
	}
}
