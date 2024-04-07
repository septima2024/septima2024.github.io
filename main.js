const EVENTS = Object.freeze({
	MOVE_DOWN: 'MOVE_DOWN',
	MOVE_RIGHT: 'MOVE_RIGHT',
	MOVE_LEFT: 'MOVE_LEFT'
});
const tile_size = new Vec2(30, 30);
const canvas_size = new Vec2(10, 15);
const ms_to_move = 1000;

const img_prefix = './images/';
const img_sources = [
	'c++.png',
	'FACEBOOK.png',
	'fb.png',
	'ferris.png',
	'ico.png',
	'ig.png',
	'INSTAGRAM.png',
	'logo.png',
	'MAIL.png',
	'mail0.png',
	'most_icon.png'
];

const images = [];
images.length = img_sources.length;

let image_promises = img_sources.map(function (img_src, index) {
	return new Promise(function (resolve, reject) {
		let img = new Image();
		img.onload = function () {
			resolve(img);
		};
		img.onerror = function () {
			reject(new Error('Could not load image at ' + img_src));
		};
		img.src = img_prefix + img_src;
		images[index] = img;
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

	let events = [];

	let loop_id = setInterval(() => {
		// This should be done in an event gathering loop
		let r = Math.random();
		if (r < 1 / 3) {
			events.push(EVENTS.MOVE_DOWN);
		} else if (r < 2 / 3) {
			events.push(EVENTS.MOVE_RIGHT);
		} else if (r < 3 / 3) {
			events.push(EVENTS.MOVE_LEFT);
		}

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
