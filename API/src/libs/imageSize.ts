import { get, IncomingMessage, ClientRequest } from 'http';
import { get as httpsGet } from 'https';
import * as sizeOf from 'image-size';

import { ImageContentData  } from '../../types';

export class ImageSize {

	/**
	 * Request Image Size data for a given image
	 */
	public static async sizeOf(url: string) {
		try {
			return await new Promise<ImageContentData>((resolve, reject) => {
				let req: ClientRequest;
				const responseHandler = (res: IncomingMessage) => {
					const chunks: any[] = [];
					res.on('data', chunk => {
						chunks.push(chunk);
						if (chunks.reduce((acc, e) => acc + e.length, 0) > 10) {
							req.abort();
						}
					}).on('end', () => {
						try {
							const data = sizeOf(Buffer.concat(chunks)) as ImageContentData;
							data.url = url;
							resolve(data);
						} catch (e) {
							reject(e);
						}
					}).on('error', (err) => reject(err));
				};

				if (url.startsWith('https')) {
					req = httpsGet(url, responseHandler);
				} else {
					req = get(url, responseHandler);
				}

				req.on('error', (err) => reject(err));
			});
		} catch (err) {
			return null;
		}
	}

	/**
	 * Request Image Size data for several images simultaneously
	 * @param urls		An array of URLs pointing to images of which the size is wanted
	 */
	public static async imageDataFromURLs(urls: string[]) {
		const uniqueURLs = [...new Set(urls.filter(url => !!url))];
		return await Promise.all(uniqueURLs.map( url => ImageSize.sizeOf(url) ));
	}
}

