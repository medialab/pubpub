import React, {PropTypes} from 'react';
import createPubPubPlugin from './PubPub';
import Timer from '../../utils/timer';
import Portal from '../../utils/Portal';
import hhmmss from 'hhmmss';


import { default as Video, Controls, Play, Mute, Time, Overlay } from 'react-html5video';


let styles = {};
let Rangy = null;
let Marklib = null;

function xhrGet(url, callback) {
	const request = new XMLHttpRequest();
	request.onreadystatechange = function() {
		if (request.readyState === 4 && request.status === 200) {
			callback(JSON.parse(request.responseText));
		}
	};
	request.open('GET', url);
	request.send();
}

const VideoReviewsInputFields = [
	{title: 'name', type: 'text'},
];

const VideoReviewsConfig = {
	title: 'videoreview',
	inline: true,
	autocomplete: false
};

const VideoReviewPlugin = React.createClass({
	propTypes: {
		name: PropTypes.string,
		children: PropTypes.string,
		caption: PropTypes.string
	},
	getInitialState: function() {
		return {loaded: false, playing: false, paused: false, timers: []};
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
		this.fetchRecording();
	},

	fetchRecording: function() {
		// this.restoreSelections(this.actions);
		xhrGet(`http://videoreviews.herokuapp.com/fetch?video=${this.props.name}`, function(review) {
			if (review && review.actions) {
				this.setState({loaded: true, actions: review.actions, video: review.video, duration: review.duration});
			} else {
				this.setState({error: true});

			}
		}.bind(this));
	},


	play: function() {
		// debugger;
		this.restoreSelections(this.state.actions);
		this.cameraPreview.play();
		this.cameraPreview.videoEl.addEventListener('ended', this.finished, false);
		this.cameraPreview.videoEl.addEventListener('pause', this.pause, false);

		this.setState({playing: true});
	},

	finished: function(event) {
		this.setState({playing: false, paused: false});
	},

	pause: function() {
		// this.cameraPreview.pause();
		this.cameraPreview.videoEl.addEventListener('play', this.resume, false);

		this.setState({paused: true});
		this.pauseSelections();
	},
	resume: function() {
		this.cameraPreview.videoEl.removeEventListener('play', this.resume, false);
		this.setState({paused: false});
		this.resumeSelections();
	},

	pauseSelections: function() {
		for (const timer of this.state.timers) {
			timer.pause();
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
				this.mouseElem.style.left = pos.x + 'px';
				this.mouseElem.style.top = pos.y + 'px';
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

		let elem;
		if (this.state.loaded) {
			elem = (<span style={styles.button} onClick={this.play}>
				📹 {(this.state.duration) ? `- ${hhmmss(this.state.duration / 1000)}` : null } - {this.props.name}
			</span>);
		} else if (!this.state.error) {
			elem = <span style={styles.button}>Loading Video Comment</span>;
		} else {
			elem = <span style={styles.button}>Error Loading Video Comment</span>;
		}

		return (
			<div>
				{elem}
				<Portal>
					<div ref={(ref) => this.mouseElem = ref} style={[styles.mouse, styles.camera(this.state.playing)]}/>
				</Portal>
				<div style={styles.wrapper}>
					{ (this.state.loaded) ?
						<div style={styles.camera(this.state.playing)}>
							<Video
								style={styles.preview}
								id="camera-preview"
								ref={(ref) => this.cameraPreview = ref}
								controls
								preload
								>
								<h1 style={styles.videoHeader}>Video comment by Thariq</h1>
								<source src={(this.state.video) ? 'http://videoreview.s3-website-us-west-2.amazonaws.com/' + this.state.video : null} type="video/webm" />
								<Overlay />
								<Controls>
									<Play />
									<Time />
									<Mute />
								</Controls>
							</Video>
							{/* <DiscussionsInput />*/}
						</div>
						:
						null
					}
				</div>
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
	videoHeader: {
		position: 'absolute',
		top: '-1em',
		backgroundColor: 'black',
		fontSize: '1em',
		width: '100%',
		textAlign: 'center',
		fontWeight: '300',
	},
	preview: {
		border: 'none',
		width: '100%'
	},
	button: {
		backgroundColor: 'white',
		cursor: 'pointer',
	},
	wrapper: {
		position: 'fixed',
		top: '10px',
		left: 'calc(61vw - 250px)',
		zIndex: '10000000',
		opacity: 0.75
	},
	comment: {
		display: 'block',
		width: '100%',
		height: '1.5em',
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

export default createPubPubPlugin(VideoReviewPlugin, VideoReviewsConfig, VideoReviewsInputFields);
