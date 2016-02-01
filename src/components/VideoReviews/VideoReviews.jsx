import React, {PropTypes} from 'react';
import RecordRTC from '../../utils/RTCWrapper';
import Radium from 'radium';
import lodash from 'lodash';
import Rwg from 'random-word-generator';

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
		this.selected = lodash.debounce(this._selected, 25);

		return {
			recording: false,
			playing: false
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

		xhr('http://videoreviews.herokuapp.com/record', JSON.stringify(videoData), function(fileName) {
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

		this.state.recording = true;

		document.addEventListener('selectionchange', this.selected);
		document.querySelector('.centerBar').addEventListener('scroll', this.scroll);
		document.getElementById('pubContent').addEventListener('mousemove', this.mouse);
		this.startRecordingDate = new Date().getTime();
		this.actions = [];
		this.scroll();

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

		this.forceUpdate();
	},

	stopRecording: function() {

		this.state.recording = false;
		this.forceUpdate();

		this.duration = new Date().getTime() - this.startRecordingDate;

		document.removeEventListener('selectionchange', this.selected);
		document.querySelector('.centerBar').removeEventListener('scroll', this.scroll);
		document.getElementById('pubContent').removeEventListener('mousemove', this.mouse);

		const onStopRecording = function() {
			this.recordAudio.getDataURL(function(audioDataURL) {
				if (!this.isFirefox) {
					this.recordVideo.getDataURL(function(videoDataURL) {
						this.postFiles(audioDataURL, videoDataURL, this.actions);
						this.forceUpdate();
					}.bind(this));
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

	postFiles: function(audioDataURL, videoDataURL, actions) {

		const fileName = new Rwg().generate();
		const files = { };

		files.audio = {
			name: fileName + (this.isFirefox ? '.webm' : '.wav'),
			type: this.isFirefox ? 'video/webm' : 'audio/wav',
			contents: audioDataURL
		};

		files.actions = actions;
		files.duration = this.duration;

		if (!this.isFirefox) {
			files.video = {
				name: fileName + '.webm',
				type: 'video/webm',
				contents: videoDataURL
			};
		}

		files.isFirefox = this.isFirefox;

		this.setState({uploading: true});

		xhr('http://videoreviews.herokuapp.com/upload', JSON.stringify(files), function(_fileName) {

			this.props.onSave(_fileName);
			// console.log(_fileName);
			// const href = location.href.substr(0, location.href.lastIndexOf('/') + 1);
			// this.cameraPreview.src = 'http://videoreviews.herokuapp.com/uploads/' + _fileName;
			// this.cameraPreview.play();
		}.bind(this));

	},

	render: function() {

		let button;
		if (this.state.uploading) {
			button = <button disabled>Uploading</button>;
		} else if (this.state.recording) {
			button = <button id="stop-recording" onClick={this.stopRecording}>Stop Recording</button>;
		} else {
			button = <button id="start-recording" onClick={this.startRecording}>Record Video Comment</button>;
		}

		return (
			<div style={styles.modal}>
				<div ref={(ref) => this.mouseElem = ref} style={styles.mouse}/>
				<div>
					<p style={styles.show(true)}>
						<video id="camera-preview" ref={(ref) => this.cameraPreview = ref} controls style={styles.preview}></video>
					</p>
					<div>
						{button}
					</div>
				</div>
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
		border: '1px solid rgb(15, 158, 238)',
		width: '94%'
	},
	modal: {
		display: 'block',
		height: '100vh',
		width: '37vw',
		position: 'fixed',
		top: '30px',
		right: '0px',
		backgroundColor: 'whitesmoke',
		zIndex: '1000',
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
