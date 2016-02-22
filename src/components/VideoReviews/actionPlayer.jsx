import React, {PropTypes} from 'react';
import Timer from '../../utils/timer';
import Portal from '../../utils/portal';
import Radium from 'radium';

let styles = {};
let Rangy = null;
let Marklib = null;

const ActionPlayer = React.createClass({
	propTypes: {
		actions: PropTypes.array,
		name: PropTypes.string,
	},
	getInitialState: function() {
		return {playing: false, paused: false, timers: []};
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

	stop: function() {
		this.clearSelections();
		this.setState({playing: false});
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
					<div ref={(ref) => this.mouseElem = ref} style={[styles.mouse, styles.camera(this.state.playing)]}>
						<span style={styles.mouseTriangle}/>
						<span style={styles.mouseTooltip}>Thariq</span>
					</div>
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
	mouseTriangle: {
		width: 0,
		height: 0,
		borderLeft: '5px solid transparent',
		borderRight: '5px solid transparent',
		borderTop: '5px solid rgba(187, 40, 40, 0.59)',
		fontSize: 0,
		lineHeight: 0,
		position: 'absolute',
		left: '6px',
		top: '-5px',
		zIndex: '1000000',
	},
	mouseTooltip: {
		fontSize: '0.75em',
		position: 'relative',
		top: '-25px',
		left: '6px',
		backgroundColor: 'rgba(187, 40, 40, 0.59)',
		color: 'white',
		padding: '3px 5px',
		borderRadius: '1px',
		fontWeight: '300',
	}
};

export default Radium(ActionPlayer);
