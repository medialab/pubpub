export default function Timer(callback, delay, interval = false) {
	let timerId;
	let start;
	let remaining = delay;
	let finished = false;

	const setTimer = (interval) ? window.setInterval : window.setTimeout;
	const clearTimer = (interval) ? window.clearInterval : window.clearTimeout;

	const finishCallback = function() {
		if (!interval) finished = true;
		callback();
	};

	this.pause = function() {
		if (!finished) {
			clearTimer(timerId);
			remaining -= new Date() - start;
		}
	};

	this.finished = function() {
		return finished;
	};

	this.clear = function() {
		if (!finished) {
			finished = true;
			clearTimer(timerId);
		}
	};

	this.resume = function() {
		if (!finished) {
			start = new Date();
			clearTimer(timerId);
			if (!interval) {
				timerId = setTimer(finishCallback, remaining);
			} else {
				timerId = setTimer(finishCallback, delay);
			}
		}
	};

	this.resume();
}
