import React, {PropTypes} from 'react';
import RecordRTC from '../../utils/RTCWrapper';
import Radium from 'radium';
import lodash from 'lodash';
import Rwg from 'random-word-generator';
import {globalStyles, pubSizes} from '../../utils/styleConstants';
import ActionPlayer from './actionPlayer';


let styles = {};
let Rangy = null;
let Marklib = null;

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
	propTypes: {
		onSave: PropTypes.func
	},
	getInitialState: function() {
		this.recordAudio = null;
		this.recordVideo = null;
		this.videoDataURL = null;
		this.audioDataURL = null;
		this.actions = null;
		this.selected = lodash.debounce(this._selected, 25);

		return {
			recording: false,
			recorded: false,
			previewing: false,
			requesting: false,
			saving: false,
		};
	},
	componentDidMount: function() {
		this.isFirefox = !!navigator.mozGetUserMedia;

		Marklib = require('marklib');
		Rangy = require('rangy');
		require('rangy/lib/rangy-textrange.js');
		require('rangy/lib/rangy-serializer.js');
		require('rangy/lib/rangy-selectionsaverestore.js');
		window.rangy = Rangy;
		window.Marklib = Marklib;
		this.Marklib = Marklib;
		Rangy.init();
		//	const renderer = new Marklib.Rendering(document, {className: 'tempHighlight'}, document.getElementById('pubBodyContent'));
		//	const result = renderer.renderWithRange(this.state.range);
	},

	startActionRecording: function() {
		document.addEventListener('selectionchange', this.selected);
		document.querySelector('.centerBar').addEventListener('scroll', this.scroll);
		document.getElementById('pubContent').addEventListener('mousemove', this.mouse);
		this.startRecordingDate = new Date().getTime();
		this.actions = [];
		this.scroll();
	},
	stopActionRecording: function() {
		document.removeEventListener('selectionchange', this.selected);
		document.querySelector('.centerBar').removeEventListener('scroll', this.scroll);
		document.getElementById('pubContent').removeEventListener('mousemove', this.mouse);

		const duration = new Date().getTime() - this.startRecordingDate;
		const videoData = {actions: this.actions, duration: duration};

		xhr('https://videoreviews.herokuapp.com/record', JSON.stringify(videoData), function(fileName) {
			console.log(fileName);
		});
	},

	mouse: function(evt) {
		const mouse = {};
		const leftOffset = document.getElementById('pubContent').getBoundingClientRect().left;
		const topOffset = document.getElementById('pubContent').getBoundingClientRect().top;

		mouse.pos = {x: evt.pageX - leftOffset, y: evt.pageY + document.getElementById('pubContent').scrollTop - topOffset + 60};
		mouse.type = 'mouse';

		mouse.time = new Date().getTime() - this.startRecordingDate;
		this.actions.push(mouse);
	},

	scroll: function(evt) {
		const scroll = {};
		scroll.pos = document.querySelector('.centerBar').scrollTop;
		scroll.type = 'scroll';
		scroll.time = new Date().getTime() - this.startRecordingDate;
		this.actions.push(scroll);
	},

	_selected: function(evt) {
		const selectionStr = window.getSelection().toString().trim();

		if (selectionStr !== this.lastStr) {

			const selection = document.getSelection();
			let serializedRange;

			if (selectionStr !== '') {
				const mark = new this.Marklib.Rendering(document, {className: 'tempHighlight'}, document.getElementById('pubBodyContent'));
				const range = mark.renderWithRange(selection.getRangeAt(0));
				serializedRange = range.serialize();
				mark.destroy();
			} else {
				serializedRange = '';
			}

			const action = {
				type: 'select',
				time: new Date().getTime() - this.startRecordingDate
			};

			action.range = serializedRange;
			this.actions.push(action);
			this.lastStr = selectionStr;

			// const serializeSel = Rangy.serializeSelection(rawSel);
			// console.log(serializeSel);

			/*
			const rawSel = Rangy.saveSelection();
			const sel = JSON.parse(JSON.stringify(rawSel));
			sel.time = new Date().getTime() - this.startRecordingDate;
			sel.type = 'select';
			this.actions.push(sel);
			this.lastStr = window.getSelection().toString();
			*/
		}
	},

	startRecording: function() {

		const self = this;

		this.setState({requesting: true});

		navigator.getUserMedia({
			audio: true,
			video: true
		}, function(stream) {

			self.setState({requesting: false, recording: true});

			document.addEventListener('selectionchange', self.selected);
			document.querySelector('.centerBar').addEventListener('scroll', self.scroll);
			document.getElementById('pubContent').addEventListener('mousemove', self.mouse);
			self.startRecordingDate = new Date().getTime();
			self.actions = [];
			self.scroll();

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

		this.forceUpdate();
	},

	componentWillUnmount: function() {
		if (this.state.recording === true) {
			navigator.getUserMedia({audio: false, video: false}, null);
			document.removeEventListener('selectionchange', this.selected);
			document.querySelector('.centerBar').removeEventListener('scroll', this.scroll);
			document.getElementById('pubContent').removeEventListener('mousemove', this.mouse);
			this.recordVideo.stopRecording();
		}
	},

	stopRecording: function() {

		// this.cameraPreview.stop();
		this.cameraPreview.src = null;
		this.setState({recording: false, saving: true});

		this.duration = new Date().getTime() - this.startRecordingDate;

		const self = this;

		document.removeEventListener('selectionchange', this.selected);
		document.querySelector('.centerBar').removeEventListener('scroll', this.scroll);
		document.getElementById('pubContent').removeEventListener('mousemove', this.mouse);

		const onStopRecording = function() {
			this.recordAudio.getDataURL(function(audioDataURL) {
				if (!this.isFirefox) {
					this.recordVideo.getDataURL(function(videoDataURL) {
						self.videoDataURL = videoDataURL;
						self.audioDataURL = audioDataURL;
						self.setState({recorded: true, saving: false});
						// navigator.getUserMedia({audio: false, video: false}, null);
					});
				} else {
					this.postFiles(audioDataURL, null, this.actions);
				}
			}.bind(this));
		}.bind(this);

		this.recordAudio.stopRecording(function() {
			if (this.isFirefox) onStopRecording();
		}.bind(this));

		if (!this.isFirefox) {
			this.recordVideo.stopRecording();
			onStopRecording();
		}

	},

	previewRecording: function() {
		this.setState({previewing: true});
		this.cameraPreview.src = this.videoDataURL;
		this.cameraPreview.play();
		this.previewTimer = setTimeout(this.stopPreview, this.duration);
	},

	stopPreview: function() {
		if (this.previewTimer) {
			clearTimeout(this.previewTimer);
		}
		this.previewTimer = null;
		this.setState({previewing: false, recorded: true});
		this.cameraPreview.src = null;
	},

	uploadRecording: function() {
		this.postFiles(this.audioDataURL, this.videoDataURL, this.actions);
		this.setState({uploading: true});
	},

	retryRecording: function() {
		this.videoDataURL = null;
		this.audioDataURL = null;
		this.actions = [];
		this.setState({recorded: false});
		this.startRecording();
	},


	postFiles: function(audioDataURL, videoDataURL, actions) {

		const fileName = new Rwg().generate();
		const files = { };
		const duration = this.duration;

		files.audio = {
			name: fileName + (this.isFirefox ? '.webm' : '.wav'),
			type: this.isFirefox ? 'video/webm' : 'audio/wav',
			contents: audioDataURL
		};

		files.actions = actions;
		files.duration = duration;

		if (!this.isFirefox) {
			files.video = {
				name: fileName + '.webm',
				type: 'video/webm',
				contents: videoDataURL
			};
		}

		files.isFirefox = this.isFirefox;


		xhr('https://videoreviews.herokuapp.com/upload', JSON.stringify(files), function(_fileName) {

			this.props.onSave(_fileName, duration);
			// console.log(_fileName);
			// const href = location.href.substr(0, location.href.lastIndexOf('/') + 1);
			// this.cameraPreview.src = 'http://videoreviews.herokuapp.com/uploads/' + _fileName;
			// this.cameraPreview.play();
		}.bind(this));

	},

	close: function() {
		this.props.onSave(null);
	},

	render: function() {

		let button;
		if (this.state.uploading) {
			button = <div key="uploading" style={[globalStyles.button, styles.recordButton]}>Uploading</div>;
		} else if (this.state.saving) {
			button = <div key="saving" style={[globalStyles.button, styles.recordButton]}>Saving</div>;
		} else if (this.state.requesting) {
			button = <div key="requesstng" style={[globalStyles.button, styles.recordButton]}>Requesting Permission</div>;
		} else if (this.state.previewing) {
			button = <div key="previewing" style={[globalStyles.button, styles.recordButton]} onClick={this.stopPreview}>Stop Preview</div>;
		} else if (this.state.recorded) {
			button = (
				<div>
 					<div key="toUpload" style={[globalStyles.button, styles.recordButton]} onClick={this.uploadRecording}>Upload</div>
					<div key="toPreview" style={[globalStyles.button, styles.recordButton]} onClick={this.previewRecording}>Preview</div>
					<div key="toRetry" style={[globalStyles.button, styles.recordButton]} onClick={this.retryRecording}>Retry</div>

				</div>
			);
		} else if (this.state.recording) {
			button = <div key="stop" style={[globalStyles.button, styles.recordButton]} id="stop-recording" onClick={this.stopRecording}>◼ Stop Recording</div>;
		} else {
			button = <div key="start" style={[globalStyles.button, styles.recordButton]} id="start-recording" onClick={this.startRecording}>● Record Video Comment</div>;
		}

		return (
			<div style={styles.modal}>
				<div>

					<div style={styles.show(true)}>
						<video id="camera-preview" ref={(ref) => this.cameraPreview = ref} muted style={styles.preview}></video>
					</div>

					{button}

					<p style={styles.paragraph}>A Video Comment allows you record a live reading of a paper. In addition to your webcam and sound, viewers will see you navigate the pub,
					 e.g. where you click, where you scroll, what you select, etc.</p>
					<p style={styles.paragraph}>Video Comments can be used to:</p>
					<ul style={styles.paragraph}>
						<li>Point out parts of a document which are hard to understand textually.</li>
						<li>Review a document as you read it to provide instant feedback.</li>
						<li>Add character by doing a personal walkthrough of your document.</li>
						<li>Anything else you can think of! Email pubpub@media.mit.edu if you have suggestions or feedback.</li>

						</ul>
				</div>

				<div key="back" style={[globalStyles.button]} onClick={this.close}>Back</div>


				{(this.state.previewing) ? <ActionPlayer actions={this.actions}/> : null}
			</div>
		);
	}
});

styles = {
	show: function(recording) {
		const cameraStyle = {};
		if (recording) {
			cameraStyle.display = 'block';
		} else {
			cameraStyle.display = 'none';
		}
		return cameraStyle;
	},
	preview: {
		border: '1px solid #eee',
		backgroundColor: '#222',
		borderRadius: '2px',
		width: '90%',
		margin: 'auto',
		display: 'block',
	},
	recordButton: {
		border: '2px solid black',
		width: '60%',
		margin: '15px auto',
		textAlign: 'center',
		cursor: 'pointer',
	},
	paragraph: {
		width: '90%',
		margin: '10px auto',
		cursor: 'auto',
	},
	modal: {
		display: 'block',
		// height: '100vh',
		// width: '37vw',
		// width: 'calc(100vw - 200px - 950px - 45px)',
		height: '100vh',
		position: 'fixed',
		top: '30px',
		right: '0px',
		backgroundColor: 'whitesmoke',
		zIndex: '1000',
		width: 'calc(100% - 800px - 10px)',

		'@media screen and (min-resolution: 3dppx), screen and (max-width: 767px)': {
			display: 'none',
		},
		// Desktop Sizes
		'@media screen and (min-width: 768px) and (max-width: 1023px)': {
			padding: pubSizes.xSmallPadding,
			width: 'calc(100% - ' + pubSizes.xSmallLeft + 'px - ' + pubSizes.xSmallPub + 'px - ' + (2 * pubSizes.xSmallPadding) + 'px - 5px)',
			height: 'calc(100vh - ' + globalStyles.headerHeight + ' - ' + (2 * pubSizes.xSmallPadding) + 'px)',
		},
		'@media screen and (min-width: 1024px) and (max-width: 1300px)': {
			padding: pubSizes.smallPadding,
			width: 'calc(100% - ' + pubSizes.smallLeft + 'px - ' + pubSizes.smallPub + 'px - ' + (2 * pubSizes.smallPadding) + 'px - 5px)',
			height: 'calc(100vh - ' + globalStyles.headerHeight + ' - ' + (2 * pubSizes.smallPadding) + 'px)',
		},
		'@media screen and (min-width: 1301px) and (max-width: 1600px)': {
			padding: pubSizes.mediumPadding,
			width: 'calc(100% - ' + pubSizes.mediumLeft + 'px - ' + pubSizes.mediumPub + 'px - ' + (2 * pubSizes.mediumPadding) + 'px - 5px)',
			height: 'calc(100vh - ' + globalStyles.headerHeight + ' - ' + (2 * pubSizes.mediumPadding) + 'px)',
		},
		'@media screen and (min-width: 1600px) and (max-width: 2000px)': {
			padding: pubSizes.largePadding,
			width: 'calc(100% - ' + pubSizes.largeLeft + 'px - ' + pubSizes.largePub + 'px - ' + (2 * pubSizes.largePadding) + 'px - 5px)',
			height: 'calc(100vh - ' + globalStyles.headerHeight + ' - ' + (2 * pubSizes.largePadding) + 'px)',
		},
		'@media screen and (min-width: 2000px)': {
			padding: pubSizes.xLargePadding,
			width: 'calc(100% - ' + pubSizes.xLargeLeft + 'px - ' + pubSizes.xLargePub + 'px - ' + (2 * pubSizes.xLargePadding) + 'px - 5px)',
			height: 'calc(100vh - ' + globalStyles.headerHeight + ' - ' + (2 * pubSizes.xLargePadding) + 'px)',
		},

	},
	wrapper: {
		position: 'fixed',
		top: '0px',
		left: 'calc(60vw - 350px)',
		width: '350px',
		height: '350px',
		zIndex: '10000000'
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

export default Radium(VideoReviews);
