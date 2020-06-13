import * as sanitizeHtml from 'sanitize-html';


/*
 |--------------------------------------------------------------------------
 | sanitize
 |--------------------------------------------------------------------------
*/

const sanitizeOptions: sanitizeHtml.IOptions = {
	allowedTags: [
		'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'span', 'a', 'ul', 'ol',
		'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
		'table', 'thead', 'tbody', 'tr', 'th', 'td', 'pre',
		'figure', 'caption', 'figcaption', 'img',
		'oembed'
	],
	allowedAttributes: {
		'*': ['class', 'style'],
		a: ['href'],
		img: ['src', 'alt', 'srcset', 'sizes'],
		div: ['data-oembed-url'],
		oembed: ['url']
	},
	allowedStyles: {
		'*': {
			color: [
				/^#(0x)?[0-9a-f]+$/i,																		// HEX
				/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/,									// RGB
				/^hsl\(\d{1,3}(?:,\s*\d{1,3}%){2}\)|hsla\(\d{1,3}(?:,\s*\d{1,3}%){2},\s*\d*\.?\d+\)$/gi		// HSL(A)
			],
			'text-align': [/^left$/, /^right$/, /^center$/],
		}
	},
	allowedSchemesByTag: {
		a: ['http', 'https', 'steam']
	}
};

/**
 * Sanitize HTML
 */
export const sanitize = (htmlInput: string) => sanitizeHtml(htmlInput, sanitizeOptions);


/*
 |--------------------------------------------------------------------------
 | stripHTML
 |--------------------------------------------------------------------------
*/

const stripOptions = {
	allowedTags:  [] as string[],
	allowedAttributes: {},
	exclusiveFilter: (frame: sanitizeHtml.IFrame) => !frame.text.trim(),
	textFilter: (text: string) => text.trim().concat(' '),
};

/**
 * Removes all HTML tags from a serialized HTML string
 */
export const stripHTML = (htmlInput: string): string => sanitizeHtml(htmlInput, stripOptions).trim().replace(/ {1,}/g, ' ');
