export default function Timer(callback, delay) {
	let timerId;
	let start;
	let remaining = delay;
	let finished = false;

	const finishCallback = function() {
		finished = true;
		callback();
	};

	this.pause = function() {
		if (!finished) {
			window.clearTimeout(timerId);
			remaining -= new Date() - start;
		}
	};

	this.finished = function() {
		return finished;
	};

	this.clear = function() {
		if (!finished) {
			finished = true;
			window.clearTimeout(timerId);	
		}
	};

	this.resume = function() {
		if (!finished) {
			start = new Date();
			window.clearTimeout(timerId);
			timerId = window.setTimeout(finishCallback, remaining);
		}
	};

	this.resume();
}
