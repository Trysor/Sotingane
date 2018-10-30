import { Response as Res, NextFunction as Next } from 'express';
import { QueryCursor, Aggregate, Query } from 'mongoose';
import { StatusMessage } from './validate';

interface StreamerOptions {
	type: 'query' | 'aggregation';
	res: Res;
	query: () => Aggregate<any> | Query<any>;
	errStatus: StatusMessage;
	noneFoundStatus: StatusMessage;
	batchSize?: number;
}

/**
 * Stream data from MongoDB to the client using Mongoose Cursor
 * @param opts		configuration for the stream and its resulting response
 */
export const MongoStream = (opts: StreamerOptions) => {
	// Init stream variables
	let hasData = false;
	let err = false;
	let spacer = '';
	const cursorOpts = { batchSize: opts.batchSize || 2000 };

	// Set response content type
	opts.res.type('application/json');

	// Create cursor
	let cursor: QueryCursor<any>;
	if (opts.type === 'query') {
		cursor = <QueryCursor<any>>opts.query().cursor(cursorOpts);
	} else {
		cursor = (<Aggregate<any>>opts.query()).cursor(cursorOpts).exec();
	}

	// On Error
	cursor.on('error', () => { err = true; cursor.close(); });

	// On Data
	cursor.on('data', (doc: any) => {
		// On first document
		const s = spacer;
		if (!hasData) {
			opts.res.write('['); // send array opening bracket
			spacer = ',';
			hasData = true;
		}
		opts.res.write(`${s}${JSON.stringify(doc)}`);
	});

	// On End
	cursor.on('end', () => {
		if (err) { return opts.res.status(200).send(opts.errStatus); }
		if (!hasData) { return opts.res.status(200).send(opts.noneFoundStatus); }
		opts.res.end(']'); // Else end with closing array bracket
	});
};
