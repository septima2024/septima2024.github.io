const ws_addr = "wss://maj-tetris-server.jumpingcrab.com";
const recording_events = Object.freeze({
	DOWN: 0,
	LEFT: 1,
	RIGHT: 2,
	ROT_CW: 3,
	ROT_CCW: 4,
	LATE: 6,
	FALL: 7,
});

let lb_ngames = 0;
function lb_refresh() { }

function leaderboard(scores, ngames) {
	let list = document.getElementById("leaderboard-list");
	while (list.firstChild) {
		list.removeChild(list.lastChild);
	}
	for (let s of scores) {
		let li = document.createElement("li");
		let name = document.createElement("span");
		name.textContent = s.name;
		name.classList.add("lb_name");
		let score = document.createElement("span");
		score.textContent = s.score.toString();
		score.classList.add("lb_score");
		let replay = document.createElement("a");
		replay.textContent = "záznam";
		replay.classList.add("lb_replay");
		replay.setAttribute("onclick", "req_replay("+s.id+", "+lb_ngames+")");
		li.appendChild(name);
		li.appendChild(score);
		li.appendChild(replay);
		list.appendChild(li);
	}
}

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
	extract(buff) {
		this.events = [];
		for (let i = 0; i < (buff.length >> 1); i++) {
			let b0 = buff[2*i];
			let b1 = buff[2*i+1];
			this.events.push({dt: b1 << 5 | ((b0 >> 3) & 0x1f), e: (b0 & 7)});
		}
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
	if (recordings.length <= id) { // partial ill-fix because it fixes the cause instead of the actual problem, but no one cares as long as it "works"...
		console.log("tried to record-late with no active recordings");
		return;
	}
	recordings[id].record(recording_events.LATE);
}

let repl = null;
let repl_fi = null;
let repl_im = null;
let repl_gns = null;
let repl_ol = null;
let repl_ool = null;
let repl_os = null;
let repl_oos = null;
class Replay {
	constructor() {
		this.rand_inits = [];
		this.records = [];
		this.time = 0;
		this.rands = [];
		this.at = [];
		this.att = [];
		this.timeout = null;
		this.disabled = true;
	}
	add(rand, record) {
		this.rand_inits.push(BigInt(rand));
		this.records.push(record);
	}
	random(i) {
		this.rands[i] = (this.rands[i] * BigInt(0x1010101) + BigInt(0x31415927)) & BigInt(0xffffffff);
		return Number(this.rands[i] >> BigInt(16));
	}
	init() {
		on_lose();
		console.log("replay start");
		this.rands = [];
		this.at = [];
		this.att = [];
		for (let i of this.rand_inits) {
			this.rands.push(i);
			this.at.push(0);
			this.att.push(0);
		}
		fall_in = (() => {});
		input_work = (() => {});
		generate_next_shape = ((game) => {
			let shapess = "JOLTISZCiloPQ";
			let shapel = shapess[this.random(game.id) % shapess.length];
			let n_shape = Shape.generate_shape(shapel);
			let rots = this.random(game.id) % 4;
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
		});
		on_lose = repl_ool;
		setup = repl_oos;
		this.disabled = false;
		setup(this.records.length);
	}
	next_ev() {
		let mt = 9999999;
		let ev = null;
		for (let i = 0; i < this.records.length; i++) {
			if (this.records[i].events.length <= this.at[i])
				continue;
			let cmt = this.records[i].events[this.at[i]].dt + this.att[i] - this.time;
			if (cmt < mt) {
				mt = cmt;
				let e = this.records[i].events[this.at[i]];
				ev = { i: i, mt: cmt, e: e.e, edt: e.dt };
			}
		}
		return ev;
	}
	tick() {
		let ne = this.next_ev();
		if (ne === null)
			return null;
		do {
			this.time += ne.mt;
			console.log("repl ", ne);
			if (ne.e == recording_events.DOWN) {
				games[ne.i].input("move_down");
			} else if (ne.e == recording_events.LEFT) {
				games[ne.i].input("move_left");
			} else if (ne.e == recording_events.RIGHT) {
				games[ne.i].input("move_right");
			} else if (ne.e == recording_events.ROT_CW) {
				games[ne.i].input("rotate_clockwise");
			} else if (ne.e == recording_events.ROT_CCW) {
				games[ne.i].input("rotate_counterclockwise");
			} else if (ne.e == recording_events.FALL) {
				games[ne.i].fall();
			}
			this.att[ne.i] += ne.edt;
			this.at[ne.i] += 1;
			ne = this.next_ev();
			if (ne === null)
				return null;
		} while(ne.mt == 0);
		return ne.mt / 4.096;
	}
	tick_loop() {
		if (this.disabled)
			return;
		let i = this.tick();
		if (i === null) {
			this.end();
			return;
		}
		setTimeout(() => this.tick_loop(), i);
	}
	skip_to(tm) {
		if (tm < this.time) {
			this.init(); // reset
		}
		if (this.time == tm)
			return;
		let nt = this.next_ev();
		if (nt === null)
			return;
		let nmt = nt.mt;
		while (this.time + nmt < tm) {
			nmt = this.tick();
			if (nmt === null)
				return;
		}
		return nmt;
	}
	end() {
		console.log("replay end");
		this.disabled = true;
		if (this.timeout !== null) {
			clearTimeout(this.timeout);
		}
		on_lose();
		this.timeout = null;
		fall_in = repl_fi;
		input_work = repl_im;
		generate_next_shape = repl_gns;
		on_lose = repl_ol;
		setup = repl_os;
	}
}
function req_replay(id, ngames) {
	socket.send("R"+ngames+id);
}

let socket = null;
function try_connect() {
	let socket2 = new WebSocket(ws_addr);
	socket2.addEventListener("open", (event) => {
		document.getElementById("connection-note").textContent = "zkouší se připojení k serveru...";
		socket2.send("Test");
		console.log("sent test message");
	});
	socket2.addEventListener("close", (event) => {
		console.log("test connection closed", event.code, event.reason, event.wasClean);
	});
	socket2.addEventListener("error", (event) => {
		document.getElementById("connection-note").textContent = "zkouškové připojení se nezdařilo";
	});
	socket2.addEventListener("message", async (event) => {
		console.log("test socket message: ", event.data);
		if (event.data === "alive") {
			document.getElementById("connection-note").textContent = "zkouškové připojení proběhlo úspěšně";
			socket2.close();
		}
	});
}
function set_online(after) {
	let old_setup = setup; setup = ((n) => {
		lb_ngames = n;
		recordings = [];
		console.log("setup - online");
		for (let i = 0; i < n; i++) {
			recordings.push(new Recording(i));
		}
		socket.send("b"+n);
		old_setup(n);
	});
	repl_os = setup;
	repl_oos = old_setup;
	let old_on_lose = on_lose; on_lose = (() => {
		socket.send("l");
		for (let recording of recordings) {
			let compressed = recording.compress();
			socket.send(compressed);
		}
		socket.send("f"+document.getElementById("name").value);
		old_on_lose();
	});
	repl_ol = on_lose;
	repl_ool = old_on_lose;
	let ogns = generate_next_shape; generate_next_shape = ((game) => {
		if (recordings.length === 0) {
			socket.send(Uint8Array.from([0]));
		} else {
			let compressed = recordings[game.id].compress();
			socket.send(compressed);
		}
	});
	repl_gns = generate_next_shape;
	let old_fall_in = fall_in; fall_in = ((game) => {
		if (game.current_shape != null) {
			record_fall(game.id);
		} else {
			record_late(game.id);
		}
		old_fall_in(game);
	});
	repl_fi = fall_in;
	let old_input_work = input_work; input_work = ((movement) => {
		record_events(movement);
		old_input_work(movement);
	});
	repl_im = input_work;
	lb_refresh = (() => {
		socket.send("L"+(lb_ngames-1));
		document.getElementById("lb-gc").textContent = (lb_ngames).toString();
	})
	socket = new WebSocket(ws_addr);
	socket.addEventListener("open", (event) => {
		after();
		lb_refresh();
	});
	socket.addEventListener("close", (event) => {
		console.log("connection closed", event.code, event.reason, event.wasClean);
	});
	socket.addEventListener("error", (event) => {
		console.log("websocket error occured", event);
		document.getElementById("leaderboard").setAttribute("style", "display:none");
		document.getElementById("connection-fail").removeAttribute("style");
		document.getElementById("name").setAttribute("style", "display:none");
		document.getElementById("play-online-button").setAttribute("style", "display:none");
		document.getElementById("menu-note").setAttribute("style", "display:none");
		setup = old_setup;
		on_lose = old_on_lose;
		generate_next_shape = ogns;
		fall_in = old_fall_in;
		input_work = old_input_work;
		lb_refresh = null;
	});
	socket.addEventListener("message", async (event) => {
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
		} else if (event.data instanceof Blob) {
			let lb = [];
			let data = await event.data.arrayBuffer();
			let uarr = new Uint8Array(data);
			let dv = new DataView(data);
			if (uarr[0] == 0) {
				let count = uarr[1];
				let off = 2;
				for (let i = 0; i < count; i++) {
					let id = dv.getUint32(off, true) | dv.getUint32(off+4, true) << 32;
					let score = dv.getUint32(off+8, true);
					let namelen = dv.getUint32(off+12, true);
					let name = new TextDecoder().decode(uarr.slice(off+16, off+16+namelen));
					lb.push({id: id, score: score, name: name});
					off += 16 + namelen;
				}
				leaderboard(lb);
			} else if (uarr[0] == 1) {
				let replay_ngames = uarr[1];
				let off = 2;
				let lens = [];
				for (let i = 0; i < replay_ngames; i++) {
					lens.push(dv.getUint32(off, true));
					off += 4;
				}
				if (repl !== null) {
					repl.end();
				}
				repl = new Replay();
				for (let i = 0; i < replay_ngames; i++) {
					let seed = dv.getUint32(off+8, true);
					let rec = new Recording(i);
					rec.extract(uarr.slice(off+21, off+lens[i]));
					repl.add(seed, rec);
					off += lens[i];
				}
				repl.init();
				repl.tick_loop();
			}
		}
	});
}

