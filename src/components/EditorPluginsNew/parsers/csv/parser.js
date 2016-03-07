import csv from 'csv-parse';

export default function(params, step, done) {
	const stream = csv(params);
	stream.on('readable', function() {
		let record = stream.read();
		while (record) {
			step(record);
			record = stream.read();
		}
	});
	if (done)	stream.on('finish', done);
	return stream;
}
