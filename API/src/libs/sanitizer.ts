import * as sanitizeHtml from 'sanitize-html';


/*
 |--------------------------------------------------------------------------
 | sanitize
 |--------------------------------------------------------------------------
*/

const sanitizeOptions: sanitizeHtml.IOptions = {
	allowedTags: [
		'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
		'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
		'table', 'thead', 'tbody', 'tr', 'th', 'td', 'pre',
		'figure', 'caption', 'figcaption', 'img',
	],
	allowedAttributes: {
		'a': ['href'],
		'*': ['class', 'style'],
		'img': ['src', 'alt'],
	},
	allowedSchemesByTag: {
		'a': ['http', 'https', 'steam']
	}
};

/**
 * Sanitize HTML
 * @param  {string} htmlInput       the HTML to sanitize
 * @return {string}                 the sanitized HTML output
 */
export const sanitize = (htmlInput: string) => sanitizeHtml(htmlInput, sanitizeOptions);


/*
 |--------------------------------------------------------------------------
 | stripHTML
 |--------------------------------------------------------------------------
*/

const stripOptions = {
	allowedTags: <string[]>[],
	allowedAttributes: {},
	exclusiveFilter: (frame: sanitizeHtml.IFrame) => !frame.text.trim(),
	textFilter: (text: string) => text.trim().concat(' '),
};

/**
 * Removes all HTML tags from a serialized HTML string
 * @param  {string} htmlInput       the HTML to sanitize
 * @return {string}                 plain text output
 */
export const stripHTML = (htmlInput: string) => sanitizeHtml(htmlInput, stripOptions).trim().replace(/ {1,}/g, ' ');
