export default function(url, type, params, callback) {
	fetch('https://stream-transform.herokuapp.com', {
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		},
		method: 'POST',
		body: JSON.stringify({
			url: url,
			params: params,
			type: type
		})
	}).then((res) => res.json()).then((data) => callback(data));
}
