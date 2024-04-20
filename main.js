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
let game_sections = [];
let games = [];

function get_ngames() {
	return Number(document.getElementById("ngames_sel").value);
}

window.onload = async function () {
	let play_off_button = document.getElementById('play-offline-button');
	let play_on_button = document.getElementById('play-online-button');
	let notes_sec = document.getElementById('notes_sec');
	let menu = document.getElementById('menu');
	game_sections = [document.getElementsByClassName("game")[0]];
	let menu_size_style =
		'width:' + Math.floor(canvas_size.x * tile_size.x * 1.5) + 'px;' +
		'height:' + canvas_size.y * tile_size.y + 'px';
	menu.setAttribute('style', menu_size_style);
	notes_sec.setAttribute('style', menu_size_style);
	let images_loaded = false;
	// Wait to load all images
	try {
		await Promise.all(image_promises);
		images_loaded = true;
	} catch (error) {
		// One or more images failed to load
		console.error(error);
	}

	play_off_button.textContent = 'Hråt offline';
	play_on_button.textContent = 'Hråt online';
	play_off_button.onclick = () => {
		if (!loaded) {
			return;
		}
		setup(get_ngames());
		start_loop();
	};
	play_on_button.onclick = () => {
		if (!loaded) {
			return;
		}
		let cbx = document.getElementById("read-instructions");
		let name = document.getElementById("name");
		if (cbx.checked !== true || name.value.length < 1) {
			document.getElementById("menu-note").setAttribute("style", "background-color:var(--secondary);color:var(--primary)");
			setTimeout((() => {
				document.getElementById("menu-note").removeAttribute("style");
			}), 2000);
			return;
		}
		document.getElementById("leaderboard").removeAttribute("style");
		set_online(() => {
			setup(get_ngames());
			start_loop();
		});
	};
	play_off_button.removeAttribute('disabled');
	play_on_button.removeAttribute('disabled');
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
			mv_input(key_to_movement[event.key]);
			event.preventDefault();
		}
	},
	true
);

function clone_game_sec(original) {
	let gs = original.cloneNode(true);
	game_sections.push(gs);
	document.getElementById('main').insertBefore(gs, document.getElementById('leaderboard'));
}

const size_multiplier = window.devicePixelRatio;

// functions to be overriden for online-play (also setup... :D)
function start() {
	if (!is_ready()) {
		return true;
	}
	for (let game of games) {
		game.fall_loop();
	}
	return false;
}
function generate_next_shape(game) {
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
	game.next_shape = n_shape;
	game.draw_next_shape();
}
function fall_in(game) {
	game.fall();
}
function input_work(movement) {
	for (let game of Object.values(games)) {
		game.input(movement);
	}
}
function on_lose() {
	for (let game of games) {
		game.lose();
	}
}

function mv_input(movement) {
	if (is_ready()) {
		input_work(movement);
	}
}
function start_loop() {
	if (start()) {
		console.log("not ready - delaying start");
		setTimeout(start, 250);
		return;
	}
}

class Game {
	constructor(id) {
		this.id = id;
		this.sec = game_sections[id];
		this.retry_button = this.sec.querySelector('.retry-button');
		this.score_text = this.sec.querySelector('.score');
		this.lines_text = this.sec.querySelector('.lines');
		this.canvas = this.sec.querySelector('.game-board');
		this.canvas_next = this.sec.querySelector('.next');
		this.retry_button.setAttribute('disabled', '');
		this.retry_button.setAttribute('style', 'display:none');
		this.ms_to_move = 1000;
		this.score = 0;
		this.lines = 0;
		this.score_text.innerText = "0";
		this.lines_text.innerText = "0";
		this.current_shape = null;
		this.next_shape = null;
		generate_next_shape(this);
		this.placed_tiles = Array.from({ length: canvas_size.y }, () =>
			Array.from({ length: canvas_size.x }, () => null)
		);
		this.ctx = setup_canvas(this.canvas, canvas_size.x * tile_size.x,
			canvas_size.y * tile_size.y, size_multiplier);
		this.canvas_next.style.display = 'inline';
		this.ctx_next = setup_canvas(this.canvas_next, canvas_next_size.x * tile_size.x,
			canvas_next_size.y * tile_size.y, size_multiplier);
		this.ready = false;
		this.timeoutid = null;
		this.disabled = false;
		this.freeze_check();
	}
	fall() {
		this.timeoutid = null;
		if (this.current_shape == null) {
			return;
		}
		this.current_shape.undraw(this.ctx, tile_size);
		let can_move_down_start = this.current_shape.can_move_down(
			this.placed_tiles,
			canvas_size
		);
		if (can_move_down_start) {
			this.current_shape.move_down();
		}
		let can_move_down_end = this.current_shape.can_move_down(
			this.placed_tiles,
			canvas_size
		);
		if (!can_move_down_end && !can_move_down_start) {
			// Only freeze the tile if it can't be moved now AND it couldn't have been moved at the end of the previous iteration (= at the beginning of this iteration)
			this.current_shape.render(this.ctx, tile_size);
			if (this.current_shape.top_y() < 0) {
				console.log('Game over!');
				on_lose();
				return;
			}
			this.freeze();
		}
		this.current_shape.render(this.ctx, tile_size);
	}
	fall_loop() {
		if (this.disabled)
			return;
		fall_in(this);
		if (this.timeoutid == null) {
			this.timeoutid = setTimeout(() => { this.fall_loop(); }, this.ms_to_move);
		}
	}
	lose() {
		this.disabled = true;
		this.ready = false;
		let game_count = games.length;
		this.current_shape = null;
		if (this.timeoutid !== null) {
			clearTimeout(this.timeoutid);
			this.timeoutid = null;
		}
		this.retry_button.onclick = (() => {
			setup(game_count);
			start_loop();
		});
		this.retry_button.removeAttribute('disabled');
		this.retry_button.removeAttribute('style');
		this.canvas_next.style.display = 'none';
	}
	freeze_check() {
		if (this.next_shape !== null) {
			this.freeze();
			this.ready = true;
		} else {
			setTimeout((() => this.freeze_check()), 250);
		}
	}
	freeze() {
		if (this.current_shape !== null) {
			let tiles = this.current_shape.place_down();
			for (let i = 0; i < tiles.length; i += 1) {
				let tile_pos = tiles[i].pos;
				this.placed_tiles[tile_pos.y][tile_pos.x] = tiles[i];
				this.placed_tiles[tile_pos.y][tile_pos.x].rotation =
					this.current_shape.rotation;
			}
			let clears = 0;
			for (let y = canvas_size.y - 1; y >= 0; y--) {
				while (y >= 0 && !this.placed_tiles[y].some((t) => t === null)) {
					clears++;
					y--;
				}
				if (clears > 0) {
					let ty = y + clears;
					for (let x = 0; x < canvas_size.x; x++) {
						if (this.placed_tiles[ty][x] !== null) {
							this.placed_tiles[ty][x].undraw(this.ctx, tile_size);
							this.placed_tiles[ty][x] = null;
						}
						this.placed_tiles[ty][x] = this.placed_tiles[y][x];
						if (this.placed_tiles[y][x] !== null) {
							this.placed_tiles[y][x].undraw(this.ctx, tile_size);
							this.placed_tiles[y][x] = null;
							this.placed_tiles[ty][x].pos = new Vec2(x, ty);
							this.placed_tiles[ty][x].render(this.ctx, tile_size);
						}
					}
				}
			}
			this.lines += clears;
			this.score += (canvas_size.x * clears * (clears + 1)) / 2; // Kind of a "combo" styled score adding
			this.ms_to_move -= clears * 10;
			if (this.ms_to_move < 100) {
				this.ms_to_move = 100;
			}
			this.score_text.innerText = this.score.toString();
			this.lines_text.innerText = this.lines.toString();
		}
		this.select_next_shape();
	}
	select_next_shape() {
		if (this.next_shape === null) {
			console.log("select next shape delay");
			setTimeout((() => this.select_next_shape()), 250);
			return;
		}
		this.next_shape.undraw(this.ctx_next, tile_size);
		this.current_shape = this.next_shape;
		this.next_shape = null;
		this.current_shape.set_pos(new Vec2(
			Math.floor((canvas_size.x - this.current_shape.width()) / 2),
			-1
		));
		generate_next_shape(this);
	}
	draw_next_shape() {
		if (this.ctx_next != null)
			this.next_shape.render(this.ctx_next, tile_size);
	}
	input(e) {
		if (this.current_shape['can_' + e](this.placed_tiles, canvas_size)) {
			this.current_shape.undraw(this.ctx, tile_size);
			this.current_shape[e]();
			this.current_shape.render(this.ctx, tile_size);
		}
	}
}

function setup(game_count) {
	if (!loaded) {
		return;
	}

	let menu_sec = document.getElementById('menu_sec');
	menu_sec.setAttribute('style', 'display:none');
	game_sections[0].removeAttribute('style');

	if (game_count === undefined || game_count < 1) {
		game_count = 1;
	}
	while (game_sections.length > game_count) {
		game_sections[game_sections.length - 1].remove();
	}
	while (game_sections.length < game_count) {
		clone_game_sec(game_sections[0]);
	}
	games = [];
	for (let i = 0; i < game_count; i++) {
		games.push(new Game(i));
	}

	// TODO:? sizing ignores resizes after
	let notes_sec = document.getElementById('notes_sec');
	const computed_style = window.getComputedStyle(game_sections[0]);
	const pad = parseInt(computed_style.paddingTop, 10);
	let w = game_sections[0].clientWidth - 2 * pad;
	let h = game_sections[0].clientHeight - 2 * pad;
	notes_sec.setAttribute('style',
		'width:' + w + 'px;' + 'height:' + h + 'px'
	);
	let lb_sec = document.getElementById('leaderboard');
	if (!lb_sec.hasAttribute("style")) {
		lb_sec.setAttribute('style',
			'width:' + w + 'px;' + 'height:' + h + 'px'
		);
	}
}
function is_ready() {
	for (let game of games) {
		if (!game.ready) {
			return false;
		}
	}
	return games.length > 0;
}

