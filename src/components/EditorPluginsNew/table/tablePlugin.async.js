import React, {PropTypes} from 'react';
import Media from '../baseMediaPlugin';
import DataGrid from './react-datagrid.min.js';
import createPubPubPlugin from '../PubPub';
import ErrorMsg from '../ErrorPlugin';

console.log('WE LOADED THE TABLE PLUGIN');

const TableInputFields = [
	{title: 'source', type: 'asset', params: {assetType: 'data'}},
	{title: 'align', type: 'align'},
	{title: 'size', type: 'size'},
	{title: 'caption', type: 'text', params: {placeholder: 'Caption describing the image'}},
	{title: 'reference', type: 'reference'},

];

const TableConfig = {
	title: 'table',
	inline: true,
	autocomplete: true,
	highlight: 'rgba(185, 215, 249, 0.5)'
};


const TablePlugin = React.createClass({
	propTypes: {
		error: PropTypes.string,
		children: PropTypes.string,
		size: React.PropTypes.oneOfType([React.PropTypes.oneOf(['small', 'medium', 'large']), React.PropTypes.number]),
		align: React.PropTypes.oneOf(['left', 'right', 'full']),
		caption: PropTypes.string,
		source: PropTypes.object,
		reference: PropTypes.object
	},
	getInitialState: function() {
		return {};
	},
	preloader: function() {
		let result;
		result = <span>loading</span>;
		return result;
	},
	loadedImage: function() {
		return;
	},
	render: function() {
		// const refName = this.props.children;
		if (!this.props.source || !this.props.source.url_s3) {
			return (<span></span>);
		}
		const url = this.props.source.url_s3;
		const size = this.props.size;
		const align = this.props.align;
		const caption = this.props.caption;
		const reference = this.props.reference;

		let html;

		return (<Media caption={caption} size={size} align={align} reference={reference}>
				<DataGrid />
			</Media>
		);
	}
});


export default createPubPubPlugin(TablePlugin, TableConfig, TableInputFields);
