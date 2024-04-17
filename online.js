const ws_addr = "ws://localhost:4777";
const recording_events = Object.freeze({
	DOWN: 0,
	LEFT: 1,
	RIGHT: 2,
	ROT_CW: 3,
	ROT_CCW: 4,
	LATE: 6,
	FALL: 7,
});

class Recording {
	constructor(id) {
		this.last_event = window.performance.now();
		this.id = id;
		this.events = [];
	}
	record(e) {
		let now = window.performance.now();
		let dt = now - this.last_event;
		this.last_event = now;
		// convert to 12-bit fraction (actions should take a second at most, so 13-bits total)
		if (dt < 0) { dt = 0; }
		if (dt > 1999) { dt = 1999; }
		dt = Math.floor(dt * 4096 / 1000);
		this.events.push({dt: dt, e: e});
	}
	compress() {
		var compressed_record = new Uint8Array(1 + 2*this.events.length);
		compressed_record[0] = this.id;
		for (let i = 0; i < this.events.length; i++) {
			let r = this.events[i];
			let b0 = r.e | ((r.dt & 0x1f) << 3);
			let b1 = r.dt >> 5;
			compressed_record[1+2*i] = b0;
			compressed_record[2+2*i] = b1;
		}
		this.events = [];
		return compressed_record;
	}
	clear_events() {
		this.events = [];
	}
}

var recordings = [];

function record_events(e) {
	e = {
		"move_down": recording_events.DOWN,
		"move_left": recording_events.LEFT,
		"move_right": recording_events.RIGHT,
		"rotate_clockwise": recording_events.ROT_CW,
		"rotate_counterclockwise": recording_events.ROT_CCW,
	}[e];
	for (let r of recordings) {
		r.record(e);
	}
}
function record_fall(id) {
	recordings[id].record(recording_events.FALL);
}
function record_late(id) {
	recordings[id].record(recording_events.LATE);
}
function init_leaderboard() {
	console.log("init_leaderboard();");
}
let socket = null;
function set_online(after) {
	let old_setup = setup; setup = ((n) => {
		recordings = [];
		socket.send("b"+n);
		old_setup(n);
	});
	let old_start = start; start = (() => {
		if (!is_ready())
			return true;
		console.log("start - online");
		for (let i = 0; i < games.length; i++) {
			recordings.push(new Recording(i));
		}
		old_start(); // is_ready double check :/
		return false;
	});
	let old_on_lose = on_lose; on_lose = (() => {
		socket.send("l");
		for (let recording of recordings) {
			let compressed = recording.compress();
			socket.send(compressed);
		}
		socket.send("f"+document.getElementById("name").value);
		old_on_lose();
	});
	generate_next_shape = ((game) => {
		if (recordings.length === 0) {
			socket.send(Uint8Array.from([0]));
		} else {
			let compressed = recordings[game.id].compress();
			socket.send(compressed);
		}
	});
	let old_fall_in = fall_in; fall_in = ((game) => {
		if (game.current_shape != null) {
			record_fall(game.id);
		} else {
			record_late(game.id);
		}
		old_fall_in(game);
	});
	let old_input_work = input_work; input_work = ((movement) => {
		record_events(movement);
		old_input_work(movement);
	});
	socket = new WebSocket(ws_addr);
	socket.addEventListener("open", (event) => {
		after();
	});
	socket.addEventListener("close", (event) => {
		console.log("connection closed", event.code, event.reason, event.wasClean);
	});
	socket.addEventListener("error", (event) => {
		console.log("connection closed due to an error", event);
	});
	socket.addEventListener("message", (event) => {
		if (typeof event.data == "string" && event.data.length == 3) {
			let n_shape = Shape.generate_shape(event.data[1]);
			let rots = parseInt(event.data[2]);
			for (let i = 0; i < rots; i++) {
				n_shape.rotate_clockwise();
			}
			n_shape.set_pos(new Vec2(
				(canvas_next_size.x - n_shape.width()) / 2.0,
				(canvas_next_size.y + n_shape.height()) / 2.0 - 1.0
			));
			let id = parseInt(event.data[0]);
			games[id].next_shape = n_shape;
			games[id].draw_next_shape();
		}
	});
}

