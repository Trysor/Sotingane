import { get, IncomingMessage, ClientRequest } from 'http';
import { get as httpsGet } from 'https';
import * as sizeOf from 'image-size';

import { ImageContentData  } from '../../types';

export class ImageSize {

	/**
	 * Request Image Size data for a given image
	 * @param url		An URL pointing to the image of which the size is wanted
	 */
	public static async sizeOf(url: string) {
		try {
			const imageInfo = await new Promise<ImageContentData>((resolve, reject) => {
				let req: ClientRequest;

				const responseHandler = (res: IncomingMessage) => {
					const chunks: any[] = [];
					res.on('data', chunk => {
						chunks.push(chunk);
						if (chunks.reduce((acc, e) => acc + e.length, 0) > 10) {
							req.abort();
						}
					}).on('end', () => {
						const data = <ImageContentData>sizeOf(Buffer.concat(chunks));
						data.url = url;
						resolve(data);
					}).on('error', (err) => reject(err));
				};

				if (url.startsWith('https')) {
					req = httpsGet(url, responseHandler);
				} else {
					req = get(url, responseHandler);
				}

				req.on('error', (err) => reject(err));
			});
			return imageInfo;
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

