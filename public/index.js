"use strict";

const form = document.getElementById("sj-form");

const address = document.getElementById("sj-address");

const searchEngine = document.getElementById("sj-search-engine");

const error = document.getElementById("sj-error");

const errorCode = document.getElementById("sj-error-code");

const scramjet = new ScramjetController({
	prefix: '/scramjet/',
	codec: {
		wasm: '/scramjet/scramjet.wasm.wasm',
	},
	files: {
		worker: '/scramjet/scramjet.worker.js',
		client: '/scramjet/scramjet.client.js',
		shared: '/scramjet/scramjet.shared.js',
		sync:   '/scramjet/scramjet.sync.js',
	},
});

await scramjet.init();

const connection = new BareMux.BareMuxConnection("/baremux/worker.js");


const backBtn = document.createElement("button");
backBtn.id = "sj-back";
backBtn.textContent = "← Back";
backBtn.style.cssText = `
	display: none;
	position: fixed;
	top: 10px;
	left: 10px;
	z-index: 99999;
	padding: 6px 14px;
	background: rgba(0,0,0,0.7);
	color: #fff;
	border: none;
	border-radius: 6px;
	cursor: pointer;
	font-size: 14px;
`;
document.body.appendChild(backBtn);

backBtn.addEventListener("click", () => {
	const existingFrame = document.getElementById("sj-frame");
	if (existingFrame) existingFrame.remove();
	backBtn.style.display = "none";
	
	document.querySelectorAll(".sj-hide-on-proxy").forEach((el) => {
		el.style.display = "";
	});
});

form.addEventListener("submit", async (event) => {
	event.preventDefault();

	try {
		await registerSW();
	} catch (err) {
		error.textContent = "Failed to register service worker.";
		errorCode.textContent = err.toString();
		throw err;
	}

	const url = search(address.value, searchEngine.value);

	let wispUrl =
		(location.protocol === "https:" ? "wss" : "ws") +
		"://" +
		location.host +
		"/wisp/";
	if ((await connection.getTransport()) !== "/libcurl/index.mjs") {
		await connection.setTransport("/libcurl/index.mjs", [
			{ websocket: wispUrl },
		]);
	}

	const existingFrame = document.getElementById("sj-frame");
	if (existingFrame) existingFrame.remove();

	document.querySelectorAll(".sj-hide-on-proxy").forEach((el) => {
		el.style.display = "none";
	});

	const frame = scramjet.createFrame();
	frame.iframe.id = "sj-frame";
	frame.iframe.style.cssText = `
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		border: none;
		z-index: 9999;
	`;
	document.body.appendChild(frame.iframe);
	frame.go(url);

	backBtn.style.display = "block";
});
