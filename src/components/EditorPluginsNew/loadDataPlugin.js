import request from 'request';

export default function(url, parser, params, step, callback) {
	const stream = parser(params, step, callback);
	request({
		url: url, 
		method: 'GET', 
		withCredentials: false,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET,POST',
			'Access-Control-Allow-Headers': 'Content-Type'
		}
	}).pipe(stream);
}
