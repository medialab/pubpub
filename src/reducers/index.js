import Immutable from 'immutable';
import { combineReducers } from 'redux';
import { routerStateReducer } from 'redux-router';

import editor from './editor';
import explore from './explore';
import landing from './landing';
import login from './login';
import profile from './profile';
import reader from './reader';

export default combineReducers({
	router: routerStateReducer,
	editor,
	explore,
	landing,
	login,
	profile,
	reader
});

export function ensureImmutable(state) {
	// For some reason the @@INIT action is receiving a state variable that is a regular object.
	// If that's the case, cast it to Immutable and keep chugging.
	// If the @@INIT weirdness can be solved, we can remove this function.
	let output;
	if (!Immutable.Iterable.isIterable(state)) {
		output = Immutable.fromJS(state);
	} else {
		output = state;	
	}
	return output;
}
