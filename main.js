const tile_size = new Vec2(10, 10);
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

	let l = new Shape(
		'L',
		[
			new Tile(new Vec2(0, -1), images[0]),
			new Tile(new Vec2(0, 0), images[7]),
			new Tile(new Vec2(1, 0), images[2]),
			new Tile(new Vec2(2, 0), images[3])
		],
		new Vec2(1, 0),
		new Vec2(5, 5)
	);

	let canvas = document.getElementById('board');
	let ctx = canvas.getContext('2d');

	let loop_id = setInterval(() => {
		l.undraw(ctx, tile_size);
		l.rotate_clockwise();
		l.move_down();
		l.render(ctx, tile_size);
	}, ms_to_move);
}
