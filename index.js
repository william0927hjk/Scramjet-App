"use strict";
/**
 * @type {HTMLFormElement}
 */
const form = document.getElementById("sj-form");
/**
 * @type {HTMLInputElement}
 */
const address = document.getElementById("sj-address");
/**
 * @type {HTMLInputElement}
 */
const searchEngine = document.getElementById("sj-search-engine");
/**
 * @type {HTMLParagraphElement}
 */
const error = document.getElementById("sj-error");
/**
 * @type {HTMLPreElement}
 */
const errorCode = document.getElementById("sj-error-code");

const { ScramjetController } = $scramjetLoadController();

const scramjet = new ScramjetController({
	files: {
		wasm: "/scram/scramjet.wasm.wasm",
		all: "/scram/scramjet.all.js",
		sync: "/scram/scramjet.sync.js",
	},
});

scramjet.init();

const connection = new BareMux.BareMuxConnection("/baremux/worker.js");

// Back button to return to the home UI
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
	// Show the main UI again
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

	// Remove any existing frame
	const existingFrame = document.getElementById("sj-frame");
	if (existingFrame) existingFrame.remove();

	// Hide the main UI elements
	document.querySelectorAll(".sj-hide-on-proxy").forEach((el) => {
		el.style.display = "none";
	});

	// Create and show the frame fullscreen
	const frame = scramjet.createFrame();
	frame.frame.id = "sj-frame";
	frame.frame.style.cssText = `
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		border: none;
		z-index: 9999;
	`;
	document.body.appendChild(frame.frame);
	frame.go(url);

	backBtn.style.display = "block";
});
