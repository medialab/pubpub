let defaultObj;

if (typeof window !== 'undefined') {
	defaultObj = require('recordrtc');
} else {
	defaultObj = {
	};
}

export default defaultObj;
