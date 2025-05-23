import type {
	INodeExecutionData,
	IExecuteFunctions,
	INodeType,
	INodeTypeDescription,
	INodeTypeBaseDescription,
} from 'n8n-workflow';

import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';

import { AtpAgent, CredentialSession } from '@atproto/api';

import { resourcesProperty } from './resources';

// Operations
import {
	deleteLikeOperation,
	deletePostOperation,
	likeOperation,
	postOperation,
	deleteRepostOperation,
	postProperties,
	repostOperation,
} from './postOperations';
import {
	getProfileOperation,
	listAllFollowersOperation,
	listAllFollowsOperation,
	muteOperation,
	userProperties,
	unmuteOperation,
	blockOperation,
	unblockOperation,
} from './userOperations';
import { getAuthorFeed, feedProperties, getTimeline } from './feedOperations';
import { searchUsersOperation, searchPostsOperation, searchProperties } from './searchOperations';

export class BlueskyV2 implements INodeType {
	description: INodeTypeDescription;

	constructor(baseDescription: INodeTypeBaseDescription) {
		this.description = {
			...baseDescription,
			version: 2,
			defaults: {
				name: 'Bluesky',
			},
			inputs: [NodeConnectionType.Main],
			outputs: [NodeConnectionType.Main],
			credentials: [
				{
					name: 'blueskyApi',
					required: true,
				},
			],
			properties: [resourcesProperty, ...userProperties, ...postProperties, ...feedProperties, ...searchProperties],
		};
	}

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// Load credentials
		const credentials = (await this.getCredentials('blueskyApi')) as {
			identifier: string;
			appPassword: string;
			serviceUrl: string;
		};

		const serviceUrl = new URL(credentials.serviceUrl.replace(/\/+$/, '')); // Ensure no trailing slash

		const session = new CredentialSession(serviceUrl);
		const agent = new AtpAgent(session);
		await agent.login({
			identifier: credentials.identifier,
			password: credentials.appPassword,
		});

		for (let i = 0; i < items.length; i++) {
			const resource = this.getNodeParameter('resource', i) as string;
			const operation = this.getNodeParameter('operation', i) as string;
			
			if (resource === 'search') {
				// Handle search operations
				switch (operation) {
					case 'searchUsers':
						const usersQuery = this.getNodeParameter('q', i) as string;
						const usersLimit = this.getNodeParameter('limit', i, 50) as number;
						const usersData = await searchUsersOperation(agent, usersQuery, usersLimit);
						returnData.push(...usersData);
						break;
					
					case 'searchPosts':
						const postsQuery = this.getNodeParameter('q', i) as string;
						const postsLimit = this.getNodeParameter('limit', i, 50) as number;
						const postsAuthor = this.getNodeParameter('author', i, '') as string;
						const postsData = await searchPostsOperation(
							agent, 
							postsQuery, 
							postsLimit,
							postsAuthor || undefined
						);
						returnData.push(...postsData);
						break;
					
					default:
						throw new NodeOperationError(
							this.getNode(),
							`The operation "${operation}" is not supported for resource "${resource}"!`
						);
				}
				continue; // Skip the rest of the loop for search operations
			}
			
			// Handle other resources' operations
			switch (operation) {
				/**
				 * Post operations
				 */

				case 'post':
					const postText = this.getNodeParameter('postText', i) as string;
					const langs = this.getNodeParameter('langs', i) as string[];

					// Get website card details if provided
					const websiteCardDetails = this.getNodeParameter('websiteCard', i, {}) as {
						details?: {
							uri: string;
							title: string;
							description: string;
							thumbnailBinaryProperty?: string;
							fetchOpenGraphTags: boolean;
						};
					};

					let thumbnailBinary: Buffer | undefined;
					if (websiteCardDetails.details?.thumbnailBinaryProperty
						  && websiteCardDetails.details?.fetchOpenGraphTags === false
					) {
						thumbnailBinary = await this.helpers.getBinaryDataBuffer(
							i,
							websiteCardDetails.details.thumbnailBinaryProperty as string
						);
					}

					const postData = await postOperation(
						agent,
						postText,
						langs,
						{
							uri: websiteCardDetails.details?.uri,
							title: websiteCardDetails.details?.title,
							description: websiteCardDetails.details?.description,
							thumbnailBinary: thumbnailBinary,
							fetchOpenGraphTags: websiteCardDetails.details?.fetchOpenGraphTags,
						}
					);

					returnData.push(...postData);
					break;

				case 'deletePost':
					const uriDeletePost = this.getNodeParameter('uri', i) as string;
					const deletePostData = await deletePostOperation(agent, uriDeletePost);
					returnData.push(...deletePostData);
					break;

				case 'like':
					const uriLike = this.getNodeParameter('uri', i) as string;
					const cidLike = this.getNodeParameter('cid', i) as string;
					const likeData = await likeOperation(agent, uriLike, cidLike);
					returnData.push(...likeData);
					break;

				case 'deleteLike':
					const uriDeleteLike = this.getNodeParameter('uri', i) as string;
					const deleteLikeData = await deleteLikeOperation(agent, uriDeleteLike);
					returnData.push(...deleteLikeData);
					break;

				case 'repost':
					const uriRepost = this.getNodeParameter('uri', i) as string;
					const cidRepost = this.getNodeParameter('cid', i) as string;
					const repostData = await repostOperation(agent, uriRepost, cidRepost);
					returnData.push(...repostData);
					break;

				case 'deleteRepost':
					const uriDeleteRepost = this.getNodeParameter('uri', i) as string;
					const deleteRepostData = await deleteRepostOperation(agent, uriDeleteRepost);
					returnData.push(...deleteRepostData);
					break;

				/**
				 * Feed operations
				 */

				case 'getAuthorFeed':
					const authorFeedActor = this.getNodeParameter('actor', i) as string;
					const authorFeedPostLimit = this.getNodeParameter('limit', i) as number;
					const feedData = await getAuthorFeed(agent, authorFeedActor, authorFeedPostLimit);
					returnData.push(...feedData);
					break;

				case 'getTimeline':
					const timelinePostLimit = this.getNodeParameter('limit', i) as number;
					const timelineData = await getTimeline(agent, timelinePostLimit);
					returnData.push(...timelineData);
					break;

				/**
				 * User operations
				 */

				case 'getProfile':
					const actor = this.getNodeParameter('actor', i) as string;
					const profileData = await getProfileOperation(agent, actor);
					returnData.push(...profileData);
					break;

				case 'listAllFollowers':
					const handle = this.getNodeParameter('handle', i) as string;
					const maxResults = this.getNodeParameter('maxResults', i, 1000) as number;
					const pageSize = this.getNodeParameter('pageSize', i, 100) as number;
					const followersData = await listAllFollowersOperation(agent, handle, maxResults, pageSize);
					returnData.push(...followersData);
					break;

				case 'listAllFollows':
					const followsHandle = this.getNodeParameter('handle', i) as string;
					const followsMaxResults = this.getNodeParameter('maxResults', i, 1000) as number;
					const followsPageSize = this.getNodeParameter('pageSize', i, 100) as number;
					const followsData = await listAllFollowsOperation(agent, followsHandle, followsMaxResults, followsPageSize);
					returnData.push(...followsData);
					break;

				case 'mute':
					const didMute = this.getNodeParameter('did', i) as string;
					const muteData = await muteOperation(agent, didMute);
					returnData.push(...muteData);
					break;

				case 'unmute':
					const didUnmute = this.getNodeParameter('did', i) as string;
					const unmuteData = await unmuteOperation(agent, didUnmute);
					returnData.push(...unmuteData);
					break;

				case 'block':
					const didBlock = this.getNodeParameter('did', i) as string;
					const blockData = await blockOperation(agent, didBlock);
					returnData.push(...blockData);
					break;

				case 'unblock':
					const uriUnblock = this.getNodeParameter('uri', i) as string;
					const unblockData = await unblockOperation(agent, uriUnblock);
					returnData.push(...unblockData);
					break;

					default:
					throw new NodeOperationError(
						this.getNode(),
						`The operation "${operation}" is not supported!`
					);
			}
		}

		return [returnData];
	}
}
