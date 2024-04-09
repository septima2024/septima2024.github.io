const tile_size = new Vec2(30, 30);
const canvas_size = new Vec2(10, 15);
const canvas_next_size = new Vec2(4, 4);

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

let loaded = false;

window.onload = async function () {
	let canvas = document.getElementById('board');
	canvas.setAttribute('width', canvas_size.x * tile_size.x);
	canvas.setAttribute('height', canvas_size.y * tile_size.y);
	let canvas_next = document.getElementById('next');
	canvas_next.setAttribute('width', 4 * tile_size.x);
	canvas_next.setAttribute('height', 4 * tile_size.y);
	document
		.getElementById('menu')
		.setAttribute(
			'style',
			'width:' +
				Math.floor(canvas_size.x * tile_size.x * 1.5) +
				'px;' +
				'height:' +
				canvas_size.y * tile_size.y +
				'px'
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

function setup_canvas(cv, width, height, scale) {
	cv.style.width = width.toString() + 'px';
	cv.style.height = height.toString() + 'px';
	const computed_style = window.getComputedStyle(cv);
	const border_width = parseInt(computed_style.borderTopWidth, 10);
	const rect = cv.getBoundingClientRect();
	let resized_width = rect.width - 2 * border_width;
	let resized_height = rect.height - 2 * border_width;
	// Set the drawing area size of the canvas in physical pixels
	cv.width = resized_width * scale;
	cv.height = resized_height * scale;
	// Scale the drawing context accordingly
	let context = cv.getContext('2d');
	context.scale(scale, scale);
	return context;
}

let games = {};
let next_game_id = 0;

window.addEventListener(
	'keydown',
	function (event) {
		if (event.defaultPrevented) {
			return;
		}
		let key_to_movement = {
			ArrowDown: 'move_down',
			ArrowUp: 'rotate_clockwise',
			ArrowLeft: 'move_left',
			ArrowRight: 'move_right',
			S: 'move_down',
			E: 'rotate_clockwise',
			Q: 'rotate_counterclockwise',
			A: 'move_left',
			D: 'move_right'
		};
		if (event.key in key_to_movement) {
			try_movement_everywhere(key_to_movement[event.key]);
			event.preventDefault();
		}
	},
	true
);
function play() {
	// TODO: Make this work properly
	if (!loaded) {
		return;
	}
	document.getElementById('menu_sec').setAttribute('style', 'display:none');
	document.getElementById('game_sec').removeAttribute('style');
	let retry_button = document.getElementById('retry-button');
	retry_button.setAttribute('disabled', '');
	retry_button.setAttribute('style', 'display:none');
	let score_text = document.getElementById('score');
	let lines_text = document.getElementById('lines');
	console.log('Play!');

	let ms_to_move = 1000;
	let score = 0;
	let lines = 0;
	score_text.innerText = score.toString();
	lines_text.innerText = lines.toString();
	let current_shape = [null]; // needed as a reference
	let next_shape = generate_next_shape();
	let placed_tiles = Array.from({ length: canvas_size.y }, () =>
		Array.from({ length: canvas_size.x }, () => null)
	);
	let canvas = null;
	let ctx = null;

	const size_multiplier = window.devicePixelRatio;
	canvas = document.getElementById('board');
	ctx = setup_canvas(
		canvas,
		canvas_size.x * tile_size.x,
		canvas_size.y * tile_size.y,
		size_multiplier
	);
	let canvas_next = document.getElementById('next');
	canvas_next.style.display = 'inline';
	let ctx_next = setup_canvas(
		canvas_next,
		canvas_next_size.x * tile_size.x,
		canvas_next_size.y * tile_size.y,
		size_multiplier
	);

	freeze(); // freeze null piece to select and draw next

	// register game for input
	let game_id = next_game_id++;
	games[game_id] = { ctx: ctx, shape: current_shape, placed: placed_tiles };

	function tick() {
		current_shape[0].undraw(ctx, tile_size);
		let can_move_down_start = current_shape[0].can_move_down(
			placed_tiles,
			canvas_size
		);
		if (can_move_down_start) {
			current_shape[0].move_down();
		}
		let can_move_down_end = current_shape[0].can_move_down(
			placed_tiles,
			canvas_size
		);
		if (!can_move_down_end && !can_move_down_start) {
			// Only freeze the tile if it can't be moved now AND it couldn't have been moved at the end of the previous iteration (= at the beginning of this iteration)
			current_shape[0].render(ctx, tile_size);
			if (current_shape[0].top_y() < 0) {
				delete games[game_id];
				console.log('Game over!');
				current_shape[0] = null;
				//document.getElementById('menu_sec').removeAttribute('style');
				retry_button.textContent = 'Hråt znovu';
				retry_button.onclick = play;
				retry_button.removeAttribute('disabled');
				retry_button.removeAttribute('style');
				canvas_next.style.display = 'none';
				return;
			}
			freeze();
		}
		current_shape[0].render(ctx, tile_size);
		setTimeout(tick, ms_to_move);
	}
	setTimeout(tick, ms_to_move);

	function freeze() {
		if (current_shape[0] !== null) {
			let tiles = current_shape[0].place_down();
			for (let i = 0; i < tiles.length; i += 1) {
				let tile_pos = tiles[i].pos;
				placed_tiles[tile_pos.y][tile_pos.x] = tiles[i];
				placed_tiles[tile_pos.y][tile_pos.x].rotation =
					current_shape[0].rotation;
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
			ms_to_move -= clears * 10;
			if (ms_to_move < 100) {
				ms_to_move = 100;
			}
			score_text.innerText = score.toString();
			lines_text.innerText = lines.toString();
		}
		next_shape.undraw(ctx_next, tile_size);
		current_shape[0] = next_shape;
		current_shape[0].set_pos(
			new Vec2(
				Math.floor(
					(canvas_size.x - current_shape[0].width()) / 2 +
						Math.random()
				),
				-1
			)
		);
		next_shape = generate_next_shape();
		next_shape.render(ctx_next, tile_size);
	}

	function generate_next_shape() {
		let n_shape = Shape.generate_random_shape();
		let rots = Math.floor(Math.random() * 4);
		for (let i = 0; i < rots; i++) {
			n_shape.rotate_clockwise();
		}
		n_shape.set_pos(
			new Vec2(
				(canvas_next_size.x - n_shape.width()) / 2.0,
				(canvas_next_size.y + n_shape.height()) / 2.0 - 1.0
			)
		);
		return n_shape;
	}
}

function try_movement_everywhere(movement) {
	for (let game of Object.values(games)) {
		try_movement(game.ctx, game.shape[0], game.placed, movement);
	}
}
function try_movement(ctx, shape, placed, movement) {
	if (shape['can_' + movement](placed, canvas_size)) {
		shape.undraw(ctx, tile_size);
		shape[movement]();
		shape.render(ctx, tile_size);
	}
}
