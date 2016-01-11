import React from 'react';
import RecordRTC from './RTCWrapper';
import Radium from 'radium';

let styles = {};


function getRandomString() {
	let result;
	if (window.crypto) {
		const rand = window.crypto.getRandomValues(new Uint32Array(3));
		let token = '';
		let iterator;
		for (let count = 0, len = rand.length; iterator < len; count++) {
			token += rand[count].toString(36);
		}
		result = token;
	} else {
		result = (Math.random() * new Date().getTime()).toString(36).replace( /\./g, '');
	}
	return result;
}

function xhr(url, data, callback) {
	const request = new XMLHttpRequest();
	request.onreadystatechange = function() {
		if (request.readyState === 4 && request.status === 200) {
			callback(request.responseText);
		}
	};
	request.open('POST', url);
	request.send(data);
}


const VideoReviews = React.createClass({

	getInitialState: function() {
		this.recordAudio = null;
		this.recordVideo = null;
		return {
			recording: false,
		};
	},
	componentDidMount: function() {
		this.isFirefox = !!navigator.mozGetUserMedia;
	},
	startRecording: function() {
		this.state.recording = true;
		navigator.getUserMedia({
			audio: true,
			video: true
		}, function(stream) {
			this.cameraPreview.src = window.URL.createObjectURL(stream);
			this.cameraPreview.play();

			this.recordAudio = RecordRTC(stream, {
				bufferSize: 16384
			});

			if (!this.isFirefox) {
				this.recordVideo = RecordRTC(stream, {
					type: 'video'
				});
			}

			this.recordAudio.startRecording();

			if (!this.isFirefox) {
				this.recordVideo.startRecording();
			}

		}.bind(this), function(error) {
			console.log(JSON.stringify(error));
		});
	},

	stopRecording: function() {
		const onStopRecording = function() {
			this.recordAudio.getDataURL(function(audioDataURL) {
				if (!this.isFirefox) {
					this.recordVideo.getDataURL(function(videoDataURL) {
						this.postFiles(audioDataURL, videoDataURL);
					}.bind(this));
				} else {
					this.postFiles(audioDataURL);
				}
			}.bind(this));
		}.bind(this);

		this.state.recording = false;

		this.recordAudio.stopRecording(function() {
			if (this.isFirefox) onStopRecording();
		}.bind(this));

		if (!this.isFirefox) {
			this.recordVideo.stopRecording();
			onStopRecording();
		}

	},

	postFiles: function(audioDataURL, videoDataURL) {
		const fileName = getRandomString();
		const files = { };

		files.audio = {
			name: fileName + (this.isFirefox ? '.webm' : '.wav'),
			type: this.isFirefox ? 'video/webm' : 'audio/wav',
			contents: audioDataURL
		};

		if (!this.isFirefox) {
			files.video = {
				name: fileName + '.webm',
				type: 'video/webm',
				contents: videoDataURL
			};
		}

		files.isFirefox = this.isFirefox;

		this.cameraPreview.src = '';
		this.cameraPreview.poster = 'http://videoreviews.herokuapp.com/ajax-loader.gif';

		xhr('http://videoreviews.herokuapp.com/upload', JSON.stringify(files), function(_fileName) {
			console.log(_fileName);
			// const href = location.href.substr(0, location.href.lastIndexOf('/') + 1);
			this.cameraPreview.src = 'http://videoreviews.herokuapp.com/uploads/' + _fileName;
			this.cameraPreview.play();

			const h2 = document.createElement('h2');
			h2.innerHTML = '<a href="' + this.cameraPreview.src + '">' + this.cameraPreview.src + '</a>';
			document.body.appendChild(h2);
		}.bind(this));

	},

	render: function() {
		return (
			<div style={styles.wrapper}>
				<p>
					<video id="camera-preview" ref={(ref) => this.cameraPreview = ref} controls style={styles.preview}></video>
				</p><hr />

				<div>
					<button id="start-recording" onClick={this.startRecording}>Start Recording</button>
					<button id="stop-recording" onClick={this.stopRecording}>Stop Recording</button>
				</div>
			</div>
		);
	}
});

styles = {
	preview: {
		border: '1px solid rgb(15, 158, 238)',
		width: '94%'
	},
	wrapper: {
		position: 'fixed',
		top: '0px',
		left: '0px',
		width: '500px',
		height: '500px',
		zIndex: '10000000'
	},
};

export default Radium(VideoReviews);
