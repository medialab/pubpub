import React, {PropTypes} from 'react';
import Media from '../baseMediaPlugin';
import createPubPubPlugin from '../PubPub';
import Griddle from 'griddle-react';
import Radium, {Style} from 'radium';
import loadData from '../loadDataPlugin';
import csv from '../parsers/csv/parser.js';
import Pager from './pager.js';

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
			data: []
		};
	},
	loadTableData(url) {
		const records = [];
		const params = {
			skip_empty_lines: true,
			auto_parse: true,
			columns: true
			// auto_parse_date: true
		};
		loadData(url, csv, params, (data) => records.push(data), (result) => this.setState({data: records}));
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

		let page;
		switch (this.props.size) {
		case 'small':
			page = 5;
			break;
		case 'medium':
			page = 10;
			break;
		case 'large':
			page = 15;
			break;
		default:
			page = 15;
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
				<Style
					scopeSelector=".griddle-columns"
					rules={{
						'.griddle-column-selection': {
							width: 'auto !important',
							margin: '0 4px 0 4px'
						}
					}} />
				<Griddle
					// enableInfiniteScroll={true}
					resultsPerPage={page}
					results={this.state.data}
					showSettings={true}
					useCustomPagerComponent={true}
					useGriddleStyles={true}					
					customPagerComponent={Pager}
					noDataMessage="loading... " />
			</Media>
		);
	}
}));


export default createPubPubPlugin(TablePlugin, TableConfig, TableInputFields);
