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
	replyOperation,
	quoteOperation,
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
import { 
	getNotificationsOperation, 
	getUnreadCountOperation, 
	markAsSeenOperation,
	notificationProperties 
} from './notificationOperations';
import {
	listNotificationsOperation,
	getUnreadCountOperation as analyticsGetUnreadCountOperation,
	updateSeenNotificationsOperation,
	getPostInteractionsOperation,
	analyticsProperties
} from './analyticsOperations';

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
			properties: [resourcesProperty, ...userProperties, ...postProperties, ...feedProperties, ...searchProperties, ...graphProperties, ...notificationProperties, ...analyticsProperties],
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

			if (resource === 'notifications') {
				// Handle notification operations
				switch (operation) {
					case 'getNotifications':
						const limit = this.getNodeParameter('limit', i, 50) as number;
						const cursor = this.getNodeParameter('cursor', i, '') as string;
						const since = this.getNodeParameter('since', i, '') as string;
						const priority = this.getNodeParameter('priority', i, false) as boolean;
						
						const notificationsData = await getNotificationsOperation(
							agent,
							limit,
							cursor || undefined,
							since || undefined,
							priority
						);
						returnData.push(...notificationsData);
						break;
					
					case 'getUnreadCount':
						const unreadCountData = await getUnreadCountOperation(agent);
						returnData.push(...unreadCountData);
						break;
					
					case 'markAsSeen':
						const seenAt = this.getNodeParameter('seenAt', i) as string;
						const markSeenData = await markAsSeenOperation(agent, seenAt);
						returnData.push(...markSeenData);
						break;
					
					default:
						throw new NodeOperationError(
							this.getNode(),
							`The operation "${operation}" is not supported for resource "${resource}"!`,
						);
				}
				continue; // Skip the rest of the loop for notification operations
			}

			if (resource === 'analytics') {
				// Handle analytics operations
				switch (operation) {
					case 'listNotifications':
						const analyticsLimit = this.getNodeParameter('limit', i, 50) as number;
						const analyticsNotificationsData = await listNotificationsOperation(
							agent,
							analyticsLimit
						);
						returnData.push(...analyticsNotificationsData);
						break;
					
					case 'getUnreadCount':
						const analyticsUnreadCountData = await analyticsGetUnreadCountOperation(agent);
						returnData.push(...analyticsUnreadCountData);
						break;
					
					case 'updateSeenNotifications':
						const analyticsSeenData = await updateSeenNotificationsOperation(agent);
						returnData.push(...analyticsSeenData);
						break;
					
					case 'getPostInteractions':
						const postUri = this.getNodeParameter('uri', i) as string;
						const interactionTypes = this.getNodeParameter('interactionTypes', i, ['likes', 'reposts', 'replies']) as string[];
						const interactionLimit = this.getNodeParameter('interactionLimit', i, 50) as number;
						
						const interactionsData = await getPostInteractionsOperation(
							agent,
							postUri,
							interactionTypes,
							interactionLimit
						);
						returnData.push(...interactionsData);
						break;
					
					default:
						throw new NodeOperationError(
							this.getNode(),
							`The operation "${operation}" is not supported for resource "${resource}"!`,
						);
				}
				continue; // Skip the rest of the loop for analytics operations
			}

			// Handle other resources' operations
			switch (operation) {
				/**
				 * Post operations
				 */

				case 'post':
					try {
						const postText = this.getNodeParameter('postText', i) as string;
						const langs = this.getNodeParameter('langs', i) as string[];
						const includeMedia = this.getNodeParameter('includeMedia', i, false) as boolean;

						let mediaItemsInput: any = undefined;
						if (includeMedia) {
							// The 'mediaItems' parameter is a fixedCollection with typeOptions.multiple = true.
							// For fixedCollection, n8n returns an object like: { media: [array_of_items] }
							// where 'media' is the collection name and the array contains the actual items.
							try {
								const rawMediaItems = this.getNodeParameter('mediaItems', i, {}) as any;
								
								// Extract the media array from the fixedCollection structure
								let mediaArray: any[] = [];
								if (rawMediaItems && rawMediaItems.media) {
									// Handle both single object and array cases
									if (Array.isArray(rawMediaItems.media)) {
										mediaArray = rawMediaItems.media;
									} else {
										// Single media item - wrap it in an array
										mediaArray = [rawMediaItems.media];
									}
								}
								
								// Transform the array to match our expected structure
								const transformedItems = mediaArray.map((item: any) => ({
									media: {
										binaryPropertyName: item.binaryPropertyName || 'data',
										altText: item.altText || ''
									}
								}));
								
								mediaItemsInput = { mediaItems: transformedItems };
								
								// Log media configuration for troubleshooting
								if (Array.isArray(mediaItemsInput.mediaItems) && mediaItemsInput.mediaItems.length > 0) {
									console.log(`[INFO] Processing ${mediaItemsInput.mediaItems.length} media item(s) for Bluesky post`);
								} else {
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

						const postData = await postOperation.call(
							this, // Pass IExecuteFunctions context to postOperation
							agent,
							postText,
							langs,
							websiteCardData,
							includeMedia,
							mediaItemsInput,
						);

						returnData.push(...postData);
					} catch (error) {
						console.error(`[ERROR] Bluesky post operation failed: ${error.message}`, error);
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

				case 'reply':
					const uriReply = this.getNodeParameter('uri', i) as string;
					const cidReply = this.getNodeParameter('cid', i) as string;
					const replyText = this.getNodeParameter('replyText', i) as string;
					const replyLangs = this.getNodeParameter('replyLangs', i) as string[];
					const replyData = await replyOperation(agent, replyText, replyLangs, uriReply, cidReply);
					returnData.push(...replyData);
					break;

				case 'quote':
					const uriQuote = this.getNodeParameter('uri', i) as string;
					const cidQuote = this.getNodeParameter('cid', i) as string;
					const quoteText = this.getNodeParameter('quoteText', i) as string;
					const quoteLangs = this.getNodeParameter('quoteLangs', i) as string[];
					const quoteData = await quoteOperation(agent, quoteText, quoteLangs, uriQuote, cidQuote);
					returnData.push(...quoteData);
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
