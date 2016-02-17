import React, {PropTypes} from 'react';
import createPubPubPlugin from './PubPub';
import Timer from '../../utils/timer';
import Portal from '../../utils/portal';
import hhmmss from 'hhmmss';

import { default as Video, Controls, Play, Mute, Time } from 'react-html5video';


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
		caption: PropTypes.string,
		duration: PropTypes.string,
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
		// this.fetchRecording
	},

	fetchRecording: function(callback) {
		// this.restoreSelections(this.actions);
		console.log('fetching ' + this.props.name );
		if (!this.props.duration || isNaN(this.props.duration)) {
			this.setState({error: true});
			return;
		}

		xhrGet(`https://videoreviews.herokuapp.com/fetch?video=${this.props.name}`, function(review) {
			if (review && review.actions) {
				this.setState({loaded: true, actions: review.actions, video: review.video, duration: review.duration, uploading: review.uploading});
				callback();
			} else {
				this.setState({error: true});
			}
		}.bind(this));
	},

	fetchAndPlay: function() {
		const self = this;
		this.fetchRecording(function() {
			self.play();
		});
	},

	stopPlaying: function() {
		this.setState({playing: false, paused: false});
		this.clearSelections();
	},

	play: function() {
		this.restoreSelections(this.state.actions);
		if (!this.state.uploading) {
			try {
				this.refs.camera.play();
				this.refs.camera.videoEl.addEventListener('ended', this.finished, false);
				this.refs.camera.videoEl.addEventListener('pause', this.pause, false);
			} catch (err) {
				document.getElementById('camera-preview').play();
			}
			this.setState({playing: true});
		}

	},

	finished: function(event) {
		this.clearSelections();
		this.setState({playing: false, paused: false});
	},

	pause: function() {
		// this.cameraPreview.pause();
		this.refs.camera.videoEl.addEventListener('play', this.resume, false);

		this.setState({paused: true});
		this.pauseSelections();
	},
	resume: function() {
		this.refs.camera.videoEl.removeEventListener('play', this.resume, false);
		this.setState({paused: false});
		this.resumeSelections();
	},

	pauseSelections: function() {
		for (const timer of this.state.timers) {
			timer.pause();
		}
	},

	clearSelections: function() {
		if (this.lastSelection) this.lastSelection.destroy();
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

		this.lastSelection = null;

		const playSelection = function(action) {
			try {
				const range = action.range;
				if (this.lastSelection) {
					this.lastSelection.destroy();
				}
				// const rendering = new Marklib.Rendering(pubContent);

				if (range !== '') {
					const rendering = new this.Marklib.Rendering(document, {className: 'tempHighlight'}, document.getElementById('pubBodyContent'));
					rendering.renderWithResult(range);
					this.lastSelection = rendering;
				} else {
					this.lastSelection = null;
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

		let elem;
		if (!this.state.error) {
			if (this.state.playing) {
				elem = (<span style={styles.button} onClick={this.stopPlaying.bind(this)}>📹 - Playing</span>);
			} else if (!this.state.uploading) {
				elem = (<span style={styles.button} onClick={this.fetchAndPlay}>
					📹 {(this.props.duration) ? `- ${hhmmss(this.props.duration / 1000)}` : null }
				</span>);
			} else {
				elem = (<span style={styles.button}>
					📹 {(this.props.duration) ? `- ${hhmmss(this.props.duration / 1000)} (currently uploading)` : null }
				</span>);
			}

		} else {
			elem = <span style={styles.button}>Error Loading Video Comment</span>;
		}

		return (
			<div>
				{elem}
				{(this.state.loaded && !this.state.uploading) ?
					<div style={[styles.camera(this.state.playing)]}>
					<Video
					style={styles.preview}
					id="camera-preview"
					ref="camera"
					controls
					preload
					>
					<source src={(this.state.video && this.state.playing) ? 'https://s3-us-west-2.amazonaws.com/videoreview/' + this.state.video : null} type="video/webm" />
					<Controls>
						<Play />
						<Time />
						<Mute />
					</Controls>
				</Video>
			</div>
				: null
				}
				<Portal>
					<div ref={(ref) => this.mouseElem = ref} style={[styles.mouse, styles.camera(this.state.playing)]}>
						<span style={styles.mouseTriangle}/>
						<span style={styles.mouseTooltip}>Thariq</span>
					</div>
				</Portal>
				<div>
					{ /* (this.state.loaded) ?
						<div style={[styles.camera(this.state.playing), styles.modal]}>
							<Video
								style={styles.preview}
								id="camera-preview"
								ref="camera"
								controls
								preload
								>
								<h1 style={styles.videoHeader}>Video comment by Thariq</h1>
								<source src={(this.state.video) ? 'https://s3-us-west-2.amazonaws.com/videoreview/' + this.state.video : null} type="video/webm" />
								<Controls>
									<Play />
									<Time />
									<Mute />
								</Controls>
							</Video>

							<DiscussionsInput codeMirrorID={`videoReview${this.props.name}`}/>

						</div>
													:
						null
					*/ }
				</div>
			</div>
		);
	}
});


styles = {
	camera: function(recording) {
		const cameraStyle = {
			marginTop: '25px',
			marginBottom: '50px',
		};
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
		width: 'auto',
		display: 'block',
		margin: 'auto',
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
	modal: {
		height: '100vh',
		width: '37vw',
		position: 'fixed',
		top: '30px',
		right: '0px',
		backgroundColor: 'whitesmoke',
		zIndex: '1000',
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

export default createPubPubPlugin(VideoReviewPlugin, VideoReviewsConfig, VideoReviewsInputFields);
