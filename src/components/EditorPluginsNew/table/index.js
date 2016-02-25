import React, {PropTypes} from 'react';
import Media from '../baseMediaPlugin';
import createPubPubPlugin from '../PubPub';
import Griddle from 'griddle-react';
import Radium, {Style} from 'radium';
import loadData from '../loadDataPlugin';

const TableInputFields = [
	{title: 'source', type: 'asset', params: {assetType: 'data'}},
	{title: 'align', type: 'align'},
	{title: 'size', type: 'size'},
	{title: 'caption', type: 'text', params: {placeholder: 'Caption describing the table'}},
	{title: 'reference', type: 'reference'}
];

const TableConfig = {
	title: 'table',
	inline: true,
	autocomplete: true,
	highlight: 'rgba(185, 215, 249, 0.5)'
};

const TablePlugin = Radium(React.createClass({
	propTypes: {
		containerWidth: PropTypes.number,
		containerHeight: PropTypes.number,
		error: PropTypes.string,
		children: PropTypes.string,
		size: React.PropTypes.oneOfType([React.PropTypes.oneOf(['small', 'medium', 'large']), React.PropTypes.number]),
		align: React.PropTypes.oneOf(['left', 'right', 'full']),
		caption: PropTypes.string,
		source: PropTypes.object,
		reference: PropTypes.object
	},
	getInitialState() {
		return {
			url: null,
			width: 500,
			height: 500,
			data: []
		};
	},
	preloader() {
		let result;
		result = <span>loading</span>;
		return result;
	},
	loadTableData(url) {
		console.log('fetching data');
		loadData(url, 'csv', {
			skip_empty_lines: true,
			auto_parse: true,
			columns: true,
			auto_parse_date: true
		}, (data) => {console.log(data); this.setState({data: data});});
	},
	componentWillReceiveProps(nextProps) {
		if (nextProps.source && nextProps.source.url_s3 !== this.state.url) {
			const url = nextProps.source.url_s3;
			this.setState({url: url, data: [], headers: []});
			if (typeof window !== 'undefined') {
				this.loadTableData(url);
			}
		}
	},
	render() {
		const size = this.props.size;
		const align = this.props.align;
		const caption = this.props.caption;
		const reference = this.props.reference;

		let height;
		switch (this.props.size) {
		case 'small':
			height = 200;
			break;
		case 'medium':
			height = 300;
			break;
		case 'large':
			height = 400;
			break;
		default:
			height = 400;
			break;
		}

		return (<Media ref="media" caption={caption} size={size} align={align} reference={reference}>
			<Style
				scopeSelector=".griddle"
				rules={{
					table: {
						display: 'block',
						overflowX: 'auto'
					}
				}} />
				<Style
					scopeSelector="tr.standard-row"
					rules={{
						td: {
							whiteSpace: 'nowrap'
						}
					}} />
				<Griddle
					enableInfiniteScroll={true}
					bodyHeight={height}
					results={this.state.data}
					noDataMessage="loading... " />
			</Media>
		);
	}
}));


export default createPubPubPlugin(TablePlugin, TableConfig, TableInputFields);
