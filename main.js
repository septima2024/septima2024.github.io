const EVENTS = Object.freeze({
	MOVE_DOWN: 'MOVE_DOWN',
	MOVE_RIGHT: 'MOVE_RIGHT',
	MOVE_LEFT: 'MOVE_LEFT',
	ROTATE_CW: 'ROTATE_CW',
	ROTATE_CCW: 'ROTATE_CCW'
});
const tile_size = new Vec2(30, 30);
const canvas_size = new Vec2(10, 15);
var ms_to_move = 1000;

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
			img.src = img_prefix + img_src + i + '.png';
			images[index * 4 + i] = img;
		}
	});
});

const actions = {
	move_down: () => {
		move_down(current_shape, placed_tiles);
	},
	rotate_clockwise: () => {
		rotate_clockwise(current_shape, placed_tiles);
	},
	rotate_counterclockwise: () => {
		rotate_counterclockwise(current_shape, placed_tiles);
	},
	move_left: () => {
		move_left(current_shape, placed_tiles);
	},
	move_right: () => {
		move_right(current_shape, placed_tiles);
	}
};

let loaded = false;

let score = 0;
let lines = 0;
let current_shape = null;
let placed_tiles = Array.from({ length: canvas_size.y }, () =>
	Array.from({ length: canvas_size.x }, () => null)
);
let canvas = null;
let ctx = null;

window.onload = async function () {
	let canvas = document.getElementById('board');
	canvas.setAttribute('width', canvas_size.x * tile_size.x);
	canvas.setAttribute('height', canvas_size.y * tile_size.y);
	document.getElementById('menu').setAttribute('style',
		"width:"+(Math.floor(canvas_size.x*tile_size.x*1.5))+"px;"+
		"height:"+(canvas_size.y*tile_size.y)+"px"
	);
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

	score = 0;
	lines = 0;
	current_shape = null;
	freeze();

	canvas = document.getElementById('board');
	canvas.setAttribute('width', canvas_size.x * tile_size.x);
	canvas.setAttribute('height', canvas_size.y * tile_size.y);
	ctx = canvas.getContext('2d');

	placed_tiles = Array.from({ length: canvas_size.y }, () =>
		Array.from({ length: canvas_size.x }, () => null)
	);

	window.addEventListener(
		'keydown',
		function (event) {
			if (event.defaultPrevented) {
				return;
			}
			let events_to_movement_key = {
				ArrowDown: 'move_down',
				ArrowUp: 'rotate_clockwise',
				ArrowLeft: 'move_left',
				ArrowRight: 'move_right'
			};
			if (event.key in events_to_movement_key && current_shape != null) {
				move_shape(events_to_movement_key[event.key]);
				event.preventDefault();
			}
		},
		true
	);

	let events = [];

	function tick() {
		current_shape.undraw(ctx, tile_size);
		let can_move_down_start = current_shape.can_move_down(canvas_size, placed_tiles);
		if (can_move_down_start) {
			current_shape.move_down();
		}
		let can_move_down_end = current_shape.can_move_down(canvas_size, placed_tiles);
		if (!can_move_down_end && !can_move_down_start) {
			// Only freeze the tile if it can't be moved now AND it couldn't have been moved at the end of the previous iteration (= at the beginning of this iteration)
			current_shape.render(ctx, tile_size);
			if (current_shape.top_y() < 0) {
				console.log('Game over!');
				current_shape = null;
				return;
			}
			freeze();
		}
		current_shape.render(ctx, tile_size);
		setTimeout(tick, ms_to_move);
	}
	setTimeout(tick, ms_to_move);

	function freeze() {
		if (current_shape !== null) {
			let tiles = current_shape.place_down();
			for (let i = 0; i < tiles.length; i += 1) {
				let tile_pos = tiles[i].pos;
				placed_tiles[tile_pos.y][tile_pos.x] = tiles[i];
				placed_tiles[tile_pos.y][tile_pos.x].rotation =
					current_shape.rotation;
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
			lines += clears;
			score += (canvas_size.x * clears * (clears + 1)) / 2; // Kind of a "combo" styled score adding
			ms_to_move -= clears * 5;
			if (ms_to_move < 100) { ms_to_move = 100; }
			document.getElementById('score').innerText = score.toString();
			document.getElementById('lines').innerText = lines.toString();
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

/**
 *
 * @param {String} event_id The event id
 */
function move_shape(event_id) {
	if (current_shape === null || !(event_id in actions) || ctx === null) {
		return;
	}
	current_shape.undraw(ctx, tile_size);
	actions[event_id]();
	current_shape.render(ctx, tile_size);
}

function move_down() {
	if (current_shape.can_move_down(canvas_size, placed_tiles)) {
		current_shape.move_down();
	}
}

function move_left() {
	if (current_shape.can_move_left(placed_tiles)) {
		current_shape.move_left();
	}
}

function move_right() {
	if (current_shape.can_move_right(canvas_size, placed_tiles)) {
		current_shape.move_right();
	}
}

function rotate_clockwise() {
	if (current_shape.can_rotate_clockwise(canvas_size, placed_tiles)) {
		current_shape.rotate_clockwise();
	}
}

function rotate_counterclockwise() {
	if (current_shape.can_rotate_counterclockwise(canvas_size, placed_tiles)) {
		current_shape.rotate_counterclockwise();
	}
}
