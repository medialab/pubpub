import React, {PropTypes} from 'react';
export default React.createClass({
	propTypes: {
		containerWidth: PropTypes.number,
		maxPage: PropTypes.number,
		nextText: PropTypes.string,
		previousText: PropTypes.string,
		currentPage: PropTypes.number,
		setPage: PropTypes.func,
		next: PropTypes.func,
		previous: PropTypes.func
	},
	getDefaultProps() {
		return {
			maxPage: 0,
			nextText: 'next',
			previousText: 'previous',
			currentPage: 0
		};
	},
	pageChange(event) {
		this.props.setPage(parseInt(event.target.getAttribute('data-value'), 10));
	},
	render() {
		const options = [];
		for (let index = 0; index < this.props.maxPage; index++) {
			options.push(<option key={index} value={index}>{index + 1}</option>);
		}
		return (
			<div className="pager">
				<button style={{margin: 8, border: 'none', background: 'none'}}
												type="button" onClick={this.props.previous}
												disabled={this.props.currentPage === 0}
												className="previous">{this.props.previousText}</button>
				<select value={this.props.currentPage} onChange={(event) => this.props.setPage(parseInt(event.target.value, 10))}>{options}</select>
				<button style={{margin: 8, border: 'none', background: 'none'}}
												type="button" onClick={this.props.next}
												disabled={this.props.currentPage >= this.props.maxPage - 1}
												className="next">{this.props.nextText}</button>
			</div>
		);
	}
});
