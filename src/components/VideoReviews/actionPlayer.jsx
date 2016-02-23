import React, {PropTypes} from 'react';
import Timer from '../../utils/timer';
import Portal from '../../utils/portal';
import Radium from 'radium';
import TimerText from './timerText';

let styles = {};
let Rangy = null;
let Marklib = null;

const ActionPlayer = React.createClass({
	propTypes: {
		actions: PropTypes.array,
		name: PropTypes.string,
		autoPlay: PropTypes.bool
	},
	getInitialState: function() {
		return {
			playing: this.props.autoPlay || false,
			paused: false,
			timers: [],
			mouseX: 0,
			mouseY: 0,
			clamped: null,
		};
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
		this.lastMouseEvent = null;
	},
	componentWillUnmount: function() {
		this.clearSelections();
	},
	play: function() {
		this.restoreSelections(this.props.actions);
		this.setState({playing: true});
		this.refs.durationTimer.play();
		document.querySelector('.centerBar').addEventListener('scroll', this.scroll);
	},

	stop: function() {
		this.clearSelections();
		this.setState({playing: false});
		this.refs.durationTimer.stop();
		document.querySelector('.centerBar').removeEventListener('scroll', this.scroll);
	},

	scroll: function(event) {
		if (this.lastMouseEvent) this.playMouse(this.lastMouseEvent);
	},

	finished: function(event) {
		this.setState({playing: false, paused: false});
	},

	pause: function() {
		// this.cameraPreview.pause();
		this.setState({paused: true});
		this.pauseSelections();
		this.refs.durationTimer.pause();
	},
	resume: function() {
		this.setState({paused: false});
		this.resumeSelections();
		this.refs.durationTimer.resume();
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

	playMouse: function(mouse) {
		this.lastMouseEvent = mouse;
		const pos = mouse.pos;
		const boundingRect = document.getElementById('pubContent').getBoundingClientRect();
		const leftOffset = boundingRect.left;

		let mouseX;
		let mouseY;

		if (pos.x < 1) {
			const docWidth = boundingRect.width;
			const docHeight = boundingRect.height;
			const topOffset = boundingRect.top;
			mouseX = (pos.x * docWidth) + leftOffset;
			mouseY = (pos.y * docHeight) + topOffset;
		} else {
			mouseX = pos.x + leftOffset;
			mouseY = pos.y - document.querySelector('.centerBar').scrollTop;
		}

		const clientHeight = document.documentElement.clientHeight;

		let clamped = true;

		if (mouseY > clientHeight - 25) {
			mouseY = clientHeight;
			clamped = 'bottom';
		} else if (mouseY < 30) {
			mouseY = 47;
			clamped = 'top';
			console.log('Clamped !', mouseY);
		} else {
			clamped = null;
		}

		this.setState({mouseX: mouseX, mouseY: mouseY, clamped: clamped});

		// this.mouseElem.style.left = (mouseX) + 'px';
		// this.mouseElem.style.top = (mouseY) + 'px';
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


		const timers = [];

		for (const action of actions) {
			if (action.type === 'select') {
				timers.push(new Timer(playSelection.bind(this, action), action.time));
				// setTimeout(playSelection.bind(this, action), action.time);
			} else if (action.type === 'scroll') {
				timers.push(new Timer(playScroll.bind(this, action), action.time));
				// setTimeout(playScroll.bind(this, action), action.time);
			} else if (action.type === 'mouse') {
				timers.push(new Timer(function(mouse) {
					this.playMouse(mouse);
				}.bind(this, action), action.time));
				// setTimeout(playMouse.bind(this, action), action.time);
			}
		}

		this.setState({timers: timers});

	},

	render: function() {
		return (
			<div>
				<Portal portalId="actionPlayerPointer">
					<div ref={(ref) => this.mouseElem = ref} style={[styles.mouse(this.state.mouseX, this.state.mouseY), styles.show(this.state.playing)]}>
						<span style={[styles.mousePointer, styles.show(!this.state.clamped)]}/>
						<span style={styles.mouseTriangle(this.state.clamped)}/>
						<span style={styles.mouseTooltip(this.state.clamped)}>{this.props.name} - <TimerText ref="durationTimer"/></span>
					</div>
				</Portal>
			</div>
		);
	}
});


styles = {
	show: function(display) {
		const cameraStyle = {};
		cameraStyle.display = (display) ? 'block' : 'none';
		return cameraStyle;
	},
	mouse: function(mouseX, mouseY) {
		return {
			position: 'absolute',
			top: mouseY || 50,
			left: mouseX || 50,
			zIndex: '1000000000',
			pointerEvents: 'none',
		};
	},
	mousePointer: {
		width: '20px',
		height: '22px',
		display: 'block',
		position: 'relative',
		top: '26px',
		backgroundImage: 'url("http://www.szczepanek.pl/icons.grass/v.0.1/img/standard/gui-pointer.gif")',
	},
	mouseTriangle: function(clamped) {
		const triangleColor = (!clamped) ? 'rgba(187, 40, 40, 0.59)' : 'rgba(187, 40, 40, 0.85)';
		const triangleStyles = {
			width: 0,
			height: 0,
			borderLeft: '5px solid transparent',
			borderRight: '5px solid transparent',
			borderTop: `5px solid ${triangleColor}`,
			fontSize: 0,
			lineHeight: 0,
			position: 'relative',
			left: (!clamped) ? '6px' : '50%',
			display: 'block',
			zIndex: '1000000',
			transition: 'left 0.5s ease-in-out',
		};
		if (clamped === 'bottom') {
			triangleStyles.top = '-25px';
			triangleStyles.transform = 'rotate(180deg)';
		}
		return triangleStyles;
	},
	mouseTooltip: function(clamped) {
		return {
			fontSize: '0.75em',
			position: 'relative',
			top: '-25px',
			left: '6px',
			backgroundColor: (!clamped) ? 'rgba(187, 40, 40, 0.59)' : 'rgba(187, 40, 40, 0.85)',
			color: 'white',
			padding: '3px 5px',
			borderRadius: '1px',
			fontWeight: '300',
		};
	}
};

export default Radium(ActionPlayer);
