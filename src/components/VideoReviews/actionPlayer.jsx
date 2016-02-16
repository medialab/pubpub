import React, {PropTypes} from 'react';
import Timer from '../../utils/timer';
import Portal from '../../utils/portal';

let styles = {};
let Rangy = null;
let Marklib = null;

const ActionPlayer = React.createClass({
	propTypes: {
		actions: PropTypes.array,
	},
	getInitialState: function() {
		return {playing: true, paused: false, timers: []};
	},
	componentDidMount: function() {
		this.isFirefox = !!navigator.mozGetUserMedia;
		Marklib = require('marklib');
		Rangy = require('rangy');
		require('rangy/lib/rangy-textrange.js');
		require('rangy/lib/rangy-serializer.js');
		require('rangy/lib/rangy-selectionsaverestore.js');
		this.Marklib = Marklib;
		Rangy.init();
		this.restoreSelections(this.props.actions);
	},
	componentWillUnmount: function() {
		this.clearSelections();
	},
	play: function() {
		this.restoreSelections(this.props.actions);
		this.setState({playing: true});
	},

	finished: function(event) {
		this.setState({playing: false, paused: false});
	},

	pause: function() {
		// this.cameraPreview.pause();
		this.setState({paused: true});
		this.pauseSelections();
	},
	resume: function() {
		this.setState({paused: false});
		this.resumeSelections();
	},

	pauseSelections: function() {
		for (const timer of this.state.timers) {
			timer.pause();
		}
	},

	clearSelections: function() {
		for (const timer of this.state.timers) {
			timer.clear();
		}
	},

	resumeSelections: function() {
		for (const timer of this.state.timers) {
			timer.resume();
		}
	},

	restoreSelections: function(actions) {

		let lastSelection = null;

		const playSelection = function(action) {
			try {
				const range = action.range;
				if (lastSelection) {
					lastSelection.destroy();
				}
				// const rendering = new Marklib.Rendering(pubContent);

				if (range !== '') {
					const rendering = new this.Marklib.Rendering(document, {className: 'tempHighlight'}, document.getElementById('pubBodyContent'));
					rendering.renderWithResult(range);
					lastSelection = rendering;
				} else {
					lastSelection = null;
				}
			} catch (err) {
				console.warn('Selection Playback error!');
			}
		};

		const playScroll = function(scroll) {
			const pos = scroll.pos;
			document.querySelector('.centerBar').scrollTop = pos;
		};

		const playMouse = function(mouse) {
			try {
				const pos = mouse.pos;
				const leftOffset = document.getElementById('pubContent').getBoundingClientRect().left;

				this.mouseElem.style.left = (pos.x + leftOffset) + 'px';
				this.mouseElem.style.top = (pos.y - document.querySelector('.centerBar').scrollTop) + 'px';
			} catch (err) {
				console.log(err);
			}
		}.bind(this);

		const timers = [];

		for (const action of actions) {
			if (action.type === 'select') {
				timers.push(new Timer(playSelection.bind(this, action), action.time));
				// setTimeout(playSelection.bind(this, action), action.time);
			} else if (action.type === 'scroll') {
				timers.push(new Timer(playScroll.bind(this, action), action.time));
				// setTimeout(playScroll.bind(this, action), action.time);
			} else if (action.type === 'mouse') {
				timers.push(new Timer(playMouse.bind(this, action), action.time));
				// setTimeout(playMouse.bind(this, action), action.time);
			}
		}

		this.setState({timers: timers});

	},

	render: function() {
		return (
			<div>
				<Portal>
					<div ref={(ref) => this.mouseElem = ref} style={[styles.mouse, styles.camera(this.state.playing)]}/>
				</Portal>
			</div>
		);
	}
});


styles = {
	camera: function(recording) {
		const cameraStyle = {};
		if (recording) {
			cameraStyle.display = 'block';
		} else {
			cameraStyle.display = 'none';
		}
		return cameraStyle;
	},
	mouse: {
		position: 'absolute',
		top: '50px',
		left: '50px',
		width: '20px',
		height: '20px',
		zIndex: '1000000000',
		backgroundImage: 'url("http://www.szczepanek.pl/icons.grass/v.0.1/img/standard/gui-pointer.gif")',
	},
};

export default ActionPlayer;
