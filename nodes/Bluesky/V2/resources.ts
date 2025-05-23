import { INodeProperties } from 'n8n-workflow';

export const resourcesProperty: INodeProperties = {
	displayName: 'Resource',
	name: 'resource',
	type: 'options',
	noDataExpression: true,
	options: [
		{
			name: 'User',
			value: 'user',
		},
		{
			name: 'Feed',
			value: 'feed',
		},
		{
			name: 'Graph',
			value: 'graph',
		},
		{
			name: 'Post',
			value: 'post',
		},
		{
			name: 'Search',
			value: 'search',
		},
	],
	default: 'post',
};
