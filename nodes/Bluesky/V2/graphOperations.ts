import { INodeProperties } from 'n8n-workflow';
import { AtpAgent } from '@atproto/api';

export const graphProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Mute Thread',
				value: 'muteThread',
				action: 'Mute a thread',
				description: 'Mute a conversation thread',
			},
		],
		default: 'muteThread',
	},
	{
		displayName: 'Thread URI',
		name: 'uri',
		type: 'string',
		required: true,
		default: '',
		description: 'The URI of the root post of the thread to mute',
		displayOptions: {
			show: {
				operation: ['muteThread'],
				resource: ['graph'],
			},
		},
	},
];

export async function muteThreadOperation(
	agent: AtpAgent,
	uri: string,
): Promise<void> {
	await agent.app.bsky.graph.muteThread({ root: uri });
}
