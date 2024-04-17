const tile_size = new Vec2(30, 30);
const canvas_size = new Vec2(10, 15);
const canvas_next_size = new Vec2(4, 4);

const img_prefix = './images/';
const img_sources = [
	'C_00',
	'C_01',
	'C_02',
	'C_10',
	'C_12',
	'I-small_00',
	'I-small_01',
	'I_00',
	'I_01',
	'I_02',
	'I_03',
	'J_00',
	'J_01',
	'J_02',
	'J_12',
	'L-small_01',
	'L-small_10',
	'L-small_11',
	'L_02',
	'L_10',
	'L_11',
	'L_12',
	'O-small_00',
	'O_00',
	'O_01',
	'O_10',
	'O_11',
	'P_00',
	'P_01',
	'P_10',
	'P_11',
	'P_12',
	'Q_00',
	'Q_01',
	'Q_02',
	'Q_10',
	'Q_11',
	'S_01',
	'S_02',
	'S_10',
	'S_11',
	'T_00',
	'T_10',
	'T_11',
	'T_20',
	'Z_00',
	'Z_01',
	'Z_11',
	'Z_12'
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
			img.src = img_prefix + img_src + '_' + i + '.png';
			images[index * 4 + i] = img;
		}
	});
});

let loaded = false;

window.onload = async function () {
	let play_button = document.getElementById('play-button');
	let notes_sec = document.getElementById('notes_sec');
	let menu = document.getElementById('menu');
	let menu_size_style =
		'width:' +
		Math.floor(canvas_size.x * tile_size.x * 1.5) +
		'px;' +
		'height:' +
		canvas_size.y * tile_size.y +
		'px';
	menu.setAttribute('style', menu_size_style);
	notes_sec.setAttribute('style', menu_size_style);
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

	play_button.textContent = 'Hråt';
	play_button.onclick = () => {
		play_in(document.getElementsByClassName('game')[0]);
	};
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
			D: 'move_right',
			s: 'move_down',
			e: 'rotate_clockwise',
			q: 'rotate_counterclockwise',
			a: 'move_left',
			d: 'move_right'
		};
		if (event.key in key_to_movement) {
			try_movement_everywhere(key_to_movement[event.key]);
			event.preventDefault();
		}
	},
	true
);

function play_in(game_sec) {
	let retry_button = game_sec.querySelector('.retry-button');
	let score_text = game_sec.querySelector('.score');
	let lines_text = game_sec.querySelector('.lines');
	let canvas = game_sec.querySelector('.game-board');
	let canvas_next = game_sec.querySelector('.next');
	play(game_sec, retry_button, score_text, lines_text, canvas, canvas_next);
}

function play_new(original) {
	let gs = original.cloneNode(true);
	document
		.getElementById('main')
		.insertBefore(gs, document.getElementById('menu_sec'));
	play_in(gs);
}

var touches = 0;
function play(
	game_sec,
	retry_button,
	score_text,
	lines_text,
	canvas,
	canvas_next
) {
	// TODO: Make this work properly
	if (!loaded) {
		return;
	}
	let menu_sec = document.getElementById('menu_sec');
	let first_play = !menu_sec.hasAttribute('style'); // :D
	if (first_play) {
		menu_sec.setAttribute('style', 'display:none');
		window.addEventListener('click', function (e) {
			if (e.detail === 3) {
				let tclicked = document.elementFromPoint(e.clientX, e.clientY);
				if (tclicked.tagName.toLowerCase() === 'h1') {
					console.log('c:');
					play_new(game_sec);
				}
			}
		});
		window.addEventListener('touchstart', function (e) {
			if (e.touches.length < 1) {
				return;
			}
			if (touches === 0) {
				setInterval(() => {
					touches = 0;
				}, 1000);
			}
			touches++;
			if (touches == 3) {
				let tclicked = document.elementFromPoint(
					e.touches[0].clientX,
					e.touches[0].clientY
				);
				if (tclicked.tagName.toLowerCase() === 'h1') {
					console.log('c:');
					play_new(game_sec);
				}
			}
		});
	}
	game_sec.removeAttribute('style');
	retry_button.setAttribute('disabled', '');
	retry_button.setAttribute('style', 'display:none');
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
	let ctx = null;

	const size_multiplier = window.devicePixelRatio;
	ctx = setup_canvas(
		canvas,
		canvas_size.x * tile_size.x,
		canvas_size.y * tile_size.y,
		size_multiplier
	);
	canvas_next.style.display = 'inline';
	let ctx_next = setup_canvas(
		canvas_next,
		canvas_next_size.x * tile_size.x,
		canvas_next_size.y * tile_size.y,
		size_multiplier
	);
	if (first_play) {
		// update notes_sec size to match game section size
		// TODO:? sizing ignores resizes after
		let notes_sec = document.getElementById('notes_sec');
		const computed_style = window.getComputedStyle(game_sec);
		const pad = parseInt(computed_style.paddingTop, 10);
		let w = game_sec.clientWidth - 2 * pad;
		let h = game_sec.clientHeight - 2 * pad;
		notes_sec.setAttribute(
			'style',
			'width:' + w + 'px;' + 'height:' + h + 'px'
		);
	}

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
				retry_button.onclick = () => {
					play(
						game_sec,
						retry_button,
						score_text,
						lines_text,
						canvas,
						canvas_next
					);
				};
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
