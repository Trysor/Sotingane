export interface SeoArticle {
	'@context': 'http://schema.org/';
	'@type': 'Article';
	headline: string;
	description: string;
	image: string[];
	datePublished: Date;
	dateModified: Date;
	author: SeoPerson | SeoOrganization;
	mainEntityOfPage: string;
	publisher: SeoPerson | SeoOrganization;
}

export interface SeoBreadCrumbList {
	'@context': 'http://schema.org/';
	'@type': 'BreadcrumbList';
	itemListElement: SeoListItem[];

}

export interface SeoListItem {
	'@type': 'ListItem';
	position: number;
	name: string;
	item: string;
}


export interface SeoPerson {
	'@type': 'Person';
	name: string;
}

export interface SeoOrganization {
	'@context'?: 'https://schema.org/';
	'@type': 'Organization';
	name: string;
	logo: SeoLogo | string;
	url: string;
}


export interface SeoLogo {
	'@type': 'ImageObject';
	url: string;
}
