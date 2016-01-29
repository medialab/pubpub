import React, {PropTypes} from 'react';
import createPubPubPlugin from './PubPub';

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

const Portal = React.createClass({
  render: () => null,
  portalElement: null,
  componentDidMount() {
    let portal = this.props.portalId && document.getElementById(this.props.portalId);
    if (!portal) {
      portal = document.createElement('div');
      portal.id = this.props.portalId;
      document.body.appendChild(portal);
    }
    this.portalElement = portal;
    this.componentDidUpdate();
  },
  componentWillUnmount() {
    document.body.removeChild(this.portalElement);
  },
  componentDidUpdate() {
    React.render(<div {...this.props}>{this.props.children}</div>, this.portalElement);
  }
});


const VideoReviewPlugin = React.createClass({
	propTypes: {
		name: PropTypes.string,
		children: PropTypes.string,
		caption: PropTypes.string
	},
	getInitialState: function() {
		return {playing: false};
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
	},

	fetchRecording: function() {
		// this.restoreSelections(this.actions);
		xhrGet('http://videoreviews.herokuapp.com/fetch', function(review) {
			this.restoreSelections(review.actions);
			this.playVideo(review.video);
			this.setState({playing: true});
		}.bind(this));
	},

	playVideo: function(videoName) {
    console.log('this');
		// this.cameraPreview.src = 'http://videoreviews.herokuapp.com/uploads/' + _fileName;
		this.cameraPreview.src = 'http://videoreview.s3-website-us-west-2.amazonaws.com/' + videoName;
		this.cameraPreview.play();
	},

	restoreSelections: function(actions) {

		let lastSelection = null;

		const playSelection = function(action) {

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


		for (const action of actions) {
			if (action.type === 'select') {
				setTimeout(playSelection.bind(this, action), action.time);
			} else if (action.type === 'scroll') {
				setTimeout(playScroll.bind(this, action), action.time);
			} else if (action.type === 'mouse') {
				setTimeout(playMouse.bind(this, action), action.time);
			}
		}

	},

	render: function() {
		console.log('RE-RENDERINGGG');
		return (
			<div>
			<span style={styles.button} onClick={this.fetchRecording}> CLICK ME</span>
      <Portal>
        <div ref={(ref) => this.mouseElem = ref} style={styles.mouse}/>
      </Portal>
			<div style={styles.wrapper}>
			<p style={styles.camera(this.state.playing)}>
			<video id="camera-preview" ref={(ref) => this.cameraPreview = ref} style={styles.preview}></video>
			</p>
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
		width: '250px',
		height: '250px',
		zIndex: '10000000',
    opacity: 0.75
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
