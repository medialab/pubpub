import React, {PropTypes} from 'react';

export default React.createClass({
	propTypes: {
		portalId: PropTypes.any,
		children: PropTypes.any
	},
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
