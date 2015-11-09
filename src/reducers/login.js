import Immutable from 'immutable';
import {ensureImmutable} from './';

/*--------*/
// Load Actions
/*--------*/
import {
	TOGGLE_VISIBILITY,
	TOGGLE_VIEWMODE,
	LOGIN_LOAD,
	LOGIN_LOAD_SUCCESS,
	LOGIN_LOAD_FAIL,
	RESTORE_LOGIN_LOAD,
	RESTORE_LOGIN_LOAD_SUCCESS,
	RESTORE_LOGIN_LOAD_FAIL,
	LOGOUT_LOAD,
	LOGOUT_LOAD_SUCCESS,
	LOGOUT_LOAD_FAIL,
	REGISTER_LOAD,
	REGISTER_LOAD_SUCCESS,
	REGISTER_LOAD_FAIL
} from '../actions/login';

/*--------*/
// Initialize Default State 
/*--------*/
export const defaultState = Immutable.Map({
	isVisible: false,
	loggedIn: false,
	loggingIn: false,
	viewMode: 'login',
	// attemptedRestoreState: false,
	userData: {},
	error: undefined
});

/*--------*/
// Define reducing functions 
//
// These functions take in an initial state and return a new
// state. They are pure functions. We use Immutable to enforce this. 
/*--------*/
function toggle(state) {
	return state.merge({
		isVisible: !state.get('isVisible'),
		viewMode: 'login',
		error: undefined
	});
}

function toggleViewMode(state) {
	let newViewMode = 'login';
	if (state.get('viewMode') === 'login') {
		newViewMode = 'register';
	}
	return state.merge({
		viewMode: newViewMode,
		error: undefined
	});
}

function loading(state) {
	return state.merge({
		loggingIn: true,
		error: undefined
	});
}

function loggedIn(state, user) {
	let outputMerge = {};
	if (user === 'No Session') {
		outputMerge = {
			isVisible: false,
			loggingIn: false,
			loggedIn: false,
			error: undefined,
			userData: {}
		};
	} else {
		outputMerge = {
			isVisible: false,
			loggingIn: false,
			loggedIn: true,
			error: undefined,
			userData: user
		};
	}
	return state.merge(outputMerge);
}

function loggedOut(state) {
	return state.merge({
		isVisible: false,
		loggedIn: false,
		loggingIn: false,
		userData: undefined
	});
}

function failed(state, error) {
	console.log('failed error is: ');
	let errorMessage = '';
	if (error.toString() === 'Error: Unauthorized') {
		errorMessage = 'Invalid Username or Password';
	} else {
		errorMessage = 'Email already used';
	}
	
	return state.merge({
		loggedIn: false,
		loggingIn: false,
		error: errorMessage,
		userData: {'error': true}
	});
}

/*--------*/
// Bind actions to specific reducing functions.
/*--------*/
export default function loginReducer(state = defaultState, action) {

	switch (action.type) {
	case TOGGLE_VISIBILITY:
		return toggle(state);

	case TOGGLE_VIEWMODE:
		return toggleViewMode(state);

	case LOGIN_LOAD:
		return loading(state);

	case LOGIN_LOAD_SUCCESS:
		return loggedIn(state, action.result);

	case LOGIN_LOAD_FAIL:
		return failed(state, action.error);

	case RESTORE_LOGIN_LOAD:
		return state;

	case RESTORE_LOGIN_LOAD_SUCCESS:
		return loggedIn(state, action.result);

	case RESTORE_LOGIN_LOAD_FAIL:
		return failed(state, action.error);

	case LOGOUT_LOAD:
		return loading(state);

	case LOGOUT_LOAD_SUCCESS:
		return loggedOut(state);

	case LOGOUT_LOAD_FAIL:
		return failed(state, action.error);

	case REGISTER_LOAD:
		return loading(state);

	case REGISTER_LOAD_SUCCESS:
		return loggedIn(state, action.result);

	case REGISTER_LOAD_FAIL:
		return failed(state, action.error);


	default:
		return ensureImmutable(state);
	}
}