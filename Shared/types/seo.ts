export interface SEO_Article {
	'@context': 'http://schema.org/';
	'@type': 'Article';
	headline: string;
	description: string;
	image: string[];
	datePublished: Date;
	dateModified: Date;
	author: SEO_Person | SEO_Organization;
	mainEntityOfPage: string;
	publisher: SEO_Person | SEO_Organization;
}

export interface SEO_BreadcrumbList {
	'@context': 'http://schema.org/';
	'@type': 'BreadcrumbList';
	itemListElement: SEO_ListItem[];

}

export interface SEO_ListItem {
	'@type': 'ListItem';
	position: number;
	name: string;
	item: string;
}


export interface SEO_Person {
	'@type': 'Person';
	name: string;
}

export interface SEO_Organization {
	'@context'?: 'https://schema.org/';
	'@type': 'Organization';
	name: string;
	logo: SEO_Logo | string;
	url: string;
}


export interface SEO_Logo {
	'@type': 'ImageObject';
	url: string;
}
