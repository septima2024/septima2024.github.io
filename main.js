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
	console.log(images);
}
