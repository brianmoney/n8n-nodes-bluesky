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
import { getAuthorFeed, feedProperties, getTimeline, getPostThread } from './feedOperations';
import { searchUsersOperation, searchPostsOperation, searchProperties } from './searchOperations';
import { graphProperties, muteThreadOperation } from './graphOperations';

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
			properties: [resourcesProperty, ...userProperties, ...postProperties, ...feedProperties, ...searchProperties, ...graphProperties],
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
			
			if (resource === 'graph') {
				// Handle graph operations
				switch (operation) {
					case 'muteThread':
						const threadUriToMute = this.getNodeParameter('uri', i) as string;
						await muteThreadOperation(agent, threadUriToMute);
						// Mute operation does not return data, so we push a success message
						returnData.push({ json: { success: true, message: `Thread ${threadUriToMute} muted.` } });
						break;
					default:
						throw new NodeOperationError(
							this.getNode(),
							`The operation "${operation}" is not supported for resource "${resource}"!`,
						);
				}
				continue; // Skip the rest of the loop for graph operations
			}

			// Handle other resources' operations
			switch (operation) {
				/**
				 * Post operations
				 */

				case 'post':
					try {
						console.log('[DEBUG] Starting post operation');
						const postText = this.getNodeParameter('postText', i) as string;
						const langs = this.getNodeParameter('langs', i) as string[];
						const includeMedia = this.getNodeParameter('includeMedia', i, false) as boolean;
						
						console.log(`[DEBUG] Post configuration - Text: "${postText.substring(0, 30)}...", Include Media: ${includeMedia}`);
						
						// Log input data for debugging
						const inputItems = this.getInputData();
						console.log(`[DEBUG] Input items count: ${inputItems.length}`);
						if (inputItems.length > 0) {
							const firstItem = inputItems[0];
							console.log(`[DEBUG] First item binary properties: ${Object.keys(firstItem.binary || {}).join(', ') || 'none'}`);
						}

						let mediaItemsInput: any = undefined;
						if (includeMedia) {
							// The 'mediaItems' parameter is a fixedCollection with typeOptions.multiple = true.
							// This means it will return an array of objects, where each object has a 'media' property.
							// Each 'media' property then contains 'binaryPropertyName' and 'altText'.
							try {
								const rawMediaItemsArray = this.getNodeParameter('mediaItems', i, []);
								// Always ensure mediaItems is a valid array
								mediaItemsInput = { mediaItems: Array.isArray(rawMediaItemsArray) ? rawMediaItemsArray : [] };
								
								console.log(`[DEBUG] Media items type: ${typeof mediaItemsInput.mediaItems}, isArray: ${Array.isArray(mediaItemsInput.mediaItems)}`);
								
								// Make sure mediaItems is an array before trying to iterate
								if (Array.isArray(mediaItemsInput.mediaItems) && mediaItemsInput.mediaItems.length > 0) {
									console.log(`[DEBUG] Media configuration received: ${mediaItemsInput.mediaItems.length} items`);
									for (let j = 0; j < mediaItemsInput.mediaItems.length; j++) {
										const item = mediaItemsInput.mediaItems[j];
										if (item && item.media) {
											console.log(`[DEBUG] Media item ${j+1} - Binary property: ${item.media.binaryPropertyName}, Alt text: ${item.media.altText || '(none)'}`);
										} else {
											console.log(`[DEBUG] Invalid media item detected at index ${j}:`, item);
										}
									}
								} else {
									console.log(`[DEBUG] No valid media items found in configuration`);
									// Ensure we have a valid array even if empty
									mediaItemsInput = { mediaItems: [] };
								}
							} catch (error) {
								console.error(`[ERROR] Error processing media items:`, error);
								// Ensure mediaItems is a valid array in case of any error
								mediaItemsInput = { mediaItems: [] };
							}
						}

						let websiteCardData: any = undefined;
						if (!includeMedia) {
							const websiteCardDetails = this.getNodeParameter('websiteCard', i, {}) as {
								details?: {
									uri: string;
									title: string;
									description: string;
									thumbnailBinaryProperty?: string;
									fetchOpenGraphTags: boolean;
								};
							};
							if (websiteCardDetails.details?.uri) {
								websiteCardData = {
									uri: websiteCardDetails.details.uri,
									title: websiteCardDetails.details.title,
									description: websiteCardDetails.details.description,
									thumbnailBinaryProperty: websiteCardDetails.details.thumbnailBinaryProperty,
									fetchOpenGraphTags: websiteCardDetails.details.fetchOpenGraphTags,
								};
							}
						}

						console.log(`[DEBUG] Calling postOperation function`);
						const postData = await postOperation.call(
							this, // Pass IExecuteFunctions context to postOperation
							agent,
							postText,
							langs,
							websiteCardData,
							includeMedia,
							mediaItemsInput,
						);

						console.log(`[DEBUG] Post operation completed successfully`);
						returnData.push(...postData);
					} catch (error) {
						console.error(`[ERROR] Post operation failed: ${error.message}`, error);
						throw error;
					}
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
				
				case 'getPostThread':
					const threadUriForGet = this.getNodeParameter('uri', i) as string;
					const depth = this.getNodeParameter('depth', i, 0) as number;
					const parentHeight = this.getNodeParameter('parentHeight', i, 0) as number;
					// Assuming getPostThread returns INodeExecutionData[] based on compiler error
					const threadDataArray: INodeExecutionData[] = await getPostThread(agent, threadUriForGet, depth, parentHeight);
					returnData.push(...threadDataArray); 
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
