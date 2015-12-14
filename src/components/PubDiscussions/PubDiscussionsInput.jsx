/* global CodeMirror */

import React, {PropTypes} from 'react';
import Radium, {Style} from 'radium';
import {LoaderIndeterminate} from '../';
import {globalStyles} from '../../utils/styleConstants';

let styles = {};

// import {loadCss} from '../../utils/loadingFunctions';
import initCodeMirrorMode from '../../containers/Editor/editorCodeMirrorMode';
import {codeMirrorStyles} from './discussionInputStyles';
import {clearTempHighlights} from '../PubSelectionPopup/selectionFunctions';

import marked from '../../modules/markdown/markdown';
import markdownExtensions from '../../components/EditorPlugins';
marked.setExtensions(markdownExtensions);

const cmOptions = {
	lineNumbers: false,
	value: '',
	lineWrapping: true,
	viewportMargin: Infinity, // This will cause bad performance on large documents. Rendering the entire thing...
	autofocus: false,
	mode: 'pubpubmarkdown',
	extraKeys: {'Ctrl-Space': 'autocomplete'}
};

const PubDiscussionsInput = React.createClass({
	propTypes: {
		addDiscussionHandler: PropTypes.func,
		addDiscussionStatus: PropTypes.string,
		newDiscussionData: PropTypes.object,
		userThumbnail: PropTypes.string,
	},

	componentDidMount() {

		initCodeMirrorMode();
		const codeMirror = CodeMirror(document.getElementById('codemirror-wrapper'), cmOptions);
		codeMirror.on('change', this.onEditorChange);

	},

	componentWillReceiveProps(nextProps) {
		if (this.props.addDiscussionStatus === 'loading' && nextProps.addDiscussionStatus === 'loaded') {
			// This means the discussion was succesfully submitted
			// Reset any form options here.
			const cm = document.getElementsByClassName('CodeMirror')[0].CodeMirror;
			cm.setValue('');
			clearTempHighlights();

		} else if (this.props.newDiscussionData.get('selections').size !== nextProps.newDiscussionData.get('selections').size) {
			const cm = document.getElementsByClassName('CodeMirror')[0].CodeMirror;
			const spacing = cm.getValue().length ? ' ' : '';
			cm.setValue(cm.getValue() + spacing + '[selection: ' + nextProps.newDiscussionData.get('selections').size + '] ' );	
		}
		
	},

	onEditorChange: function(cm, change) {
		// console.log('change!');
		// console.log(cm);
	},

	submitDiscussion: function() {
		const newDiscussion = {};
		const cm = document.getElementsByClassName('CodeMirror')[0].CodeMirror;
		newDiscussion.markdown = cm.getValue();
		newDiscussion.assets = {};
		newDiscussion.selections = {};
		newDiscussion.references = {};
		this.props.addDiscussionHandler(newDiscussion);
	},

	render: function() {
		return (
			<div style={styles.container}>
				<Style rules={codeMirrorStyles} />

				<div style={styles.inputTopLine}>
					<div style={styles.thumbnail}>
						{this.props.userThumbnail 
							? <img style={styles.thumbnailImage}src={this.props.userThumbnail} />
							: null
						}
					</div>
					<div style={styles.topCheckbox} key={'newDiscussionAnonymous'} >
						<label style={styles.checkboxLabel} htmlFor={'anonymousDiscussion'}>Anonymous</label>
						<input style={styles.checkboxInput} name={'anonymousDiscussion'} id={'anonymousDiscussion'} type="checkbox" value={'anonymous'} ref={'anonymousDiscussion'}/>
					</div>
					<div style={styles.topCheckbox} key={'newDiscussionPrivate'} >
						<label style={styles.checkboxLabel} htmlFor={'privateDiscussion'}>Private</label>
						<input style={styles.checkboxInput} name={'privateDiscussion'} id={'privateDiscussion'} type="checkbox" value={'private'} ref={'privateDiscussion'}/>
					</div>
				</div>
				<div id="codemirror-wrapper" style={styles.inputBox}></div>

				<div style={styles.loaderContainer}>
					{(this.props.addDiscussionStatus === 'loading' ? <LoaderIndeterminate color="#444"/> : null)}
				</div>

				<div style={styles.inputBottomLine}>
					<div style={styles.submitButton} key={'newDiscussionSubmit'} onClick={this.submitDiscussion}>Submit</div>
				</div>

			</div>
		);
	}
});

export default Radium(PubDiscussionsInput);

styles = {
	container: {
		width: '100%',
		overflow: 'hidden',
		margin: '20px 0px',
		position: 'relative',
	},
	inputTopLine: {
		// backgroundColor: 'rgba(255,0,0,0.1)',
		height: 20,
	},
	inputBottomLine: {
		// backgroundColor: 'rgba(255,0,100,0.1)',
		height: 20,
	},

	inputBox: {
		border: '1px solid #ddd',
		backgroundColor: '#fff',
		minHeight: 25,
		padding: '10px 0px',
	},
	loaderContainer: {
		position: 'absolute',
		bottom: '20px',
		width: '100%',
	},
	thumbnail: {
		width: '18px',
		height: '18px',
		padding: '1px',
		float: 'left',
	},
	thumbnailImage: {
		width: '100%',
	},
	topCheckbox: {
		float: 'right',
		height: 20,
		
		userSelect: 'none',
		color: globalStyles.sideText,
		':hover': {
			cursor: 'pointer',
			color: globalStyles.sideHover,
		}
	},
	checkboxLabel: {
		fontSize: '14px',
		margin: '0px 3px 0px 15px',
		cursor: 'pointer',
	},
	checkboxInput: {
		cursor: 'pointer',
	},
	submitButton: {
		float: 'right',
		color: globalStyles.sideText,
		padding: '0px 5px',
		':hover': {
			cursor: 'pointer',
			color: globalStyles.sideHover,
		}

	},

};