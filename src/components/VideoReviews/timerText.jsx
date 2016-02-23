import React from 'react';
import Timer from '../../utils/timer';
import hhmmss from 'hhmmss';

const TimerText = React.createClass({
	getInitialState: function() {
		return {seconds: 0};
	},
	componentWillUnmount: function() {
		if (this.timer) this.timer.clear();
	},
	play: function() {
		if (this.timer) this.timer.clear();
		this.setState({seconds: 0});
		this.timer = new Timer(this.increment.bind(this), 1000, true);
	},
	increment: function() {
		this.setState({seconds: this.state.seconds + 1});
	},
	stop: function() {
		this.timer.clear();
		this.timer = null;
	},
	pause: function() {
		this.timer.pause();
	},
	resume: function() {
		this.timer.resume();
	},

	render: function() {
		return (
			<span>{`${hhmmss(this.state.seconds)}`}</span>
		);
	}
});

export default TimerText;
