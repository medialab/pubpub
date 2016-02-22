import React, {PropTypes} from 'react';
import createPubPubPlugin from './PubPub';
import Portal from '../../utils/portal';
import hhmmss from 'hhmmss';
import ActionPlayer from '../../components/VideoReviews/actionPlayer';

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
		return {loaded: false, playing: false, paused: false, actions: []};
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
		this.refs.actionPlayer.stop();
		this.setState({playing: false, paused: false});
	},

	play: function() {
		this.refs.actionPlayer.play();
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
		this.refs.actionPlayer.stop();
		this.setState({playing: false, paused: false});
	},

	pause: function() {
		// this.cameraPreview.pause();
		this.refs.camera.videoEl.addEventListener('play', this.resume, false);
		this.setState({paused: true});
		this.refs.actionPlayer.pause();
	},
	resume: function() {
		this.refs.camera.videoEl.removeEventListener('play', this.resume, false);
		this.setState({paused: false});
		this.refs.actionPlayer.resume();
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

				<ActionPlayer ref="actionPlayer" name="Thariq" actions={this.state.actions}/>

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
	}
};

export default createPubPubPlugin(VideoReviewPlugin, VideoReviewsConfig, VideoReviewsInputFields);
