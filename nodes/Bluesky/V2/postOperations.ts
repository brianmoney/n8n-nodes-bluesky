import { AtpAgent, RichText, BskyAgent, ComAtprotoRepoUploadBlob } from '@atproto/api';
import { INodeExecutionData, INodeProperties, NodeOperationError, IExecuteFunctions } from 'n8n-workflow';
import { getLanguageOptions } from './languages';
import ogs from 'open-graph-scraper';

export const postProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		default: 'post',
		displayOptions: {
			show: {
				resource: ['post'],
			},
		},
		name: 'operation',
		noDataExpression: true,
		options: [
			{
				name: 'Create a Post',
				value: 'post',
				action: 'Create a post',
			},
			{
				name: 'Delete a Post',
				value: 'deletePost',
				action: 'Delete a post',
			},
			{
				name: 'Delete Repost',
				value: 'deleteRepost',
				action: 'Delete a repost',
			},
			{
				name: 'Like a Post',
				value: 'like',
				action: 'Like a post',
			},
			{
				name: 'Repost a Post',
				value: 'repost',
				action: 'Repost a post',
			},
			{
				name: 'Unline a Post',
				value: 'deleteLike',
				action: 'Unlike a post',
			},
			{
				name: 'Reply to a Post',
				value: 'reply',
				action: 'Reply to a post',
			},
			{
				name: 'Quote a Post',
				value: 'quote',
				action: 'Quote a post',
			},
		],
		type: 'options',
	},
	{
		displayName: 'Post Text',
		name: 'postText',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['post'],
				operation: ['post'],
			},
		},
	},
	{
		displayName: 'Language Names or IDs',
		name: 'langs',
		type: 'multiOptions',
		description:
			'Choose from the list of supported languages. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
		options: getLanguageOptions(),
		default: ['en'],
		displayOptions: {
			show: {
				resource: ['post'],
				operation: ['post'],
			},
		},
	},
	{
		displayName: 'Uri',
		name: 'uri',
		type: 'string',
		description: 'The URI of the post',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['post'],
				operation: ['deletePost', 'like', 'deleteLike', 'repost', 'reply', 'quote'],
			},
		},
	},
	{
		displayName: 'Cid',
		name: 'cid',
		type: 'string',
		description: 'The CID of the post',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['post'],
				operation: ['like', 'repost', 'reply', 'quote'],
			},
		},
	},
	{
		displayName: 'Reply Text',
		name: 'replyText',
		type: 'string',
		default: '',
		required: true,
		description: 'The text content of your reply',
		displayOptions: {
			show: {
				resource: ['post'],
				operation: ['reply'],
			},
		},
	},
	{
		displayName: 'Reply Languages',
		name: 'replyLangs',
		type: 'multiOptions',
		description:
			'Choose from the list of supported languages. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
		options: getLanguageOptions(),
		default: ['en'],
		displayOptions: {
			show: {
				resource: ['post'],
				operation: ['reply'],
			},
		},
	},
	{
		displayName: 'Quote Text',
		name: 'quoteText',
		type: 'string',
		default: '',
		required: true,
		description: 'The text content of your quote post',
		displayOptions: {
			show: {
				resource: ['post'],
				operation: ['quote'],
			},
		},
	},
	{
		displayName: 'Quote Languages',
		name: 'quoteLangs',
		type: 'multiOptions',
		description:
			'Choose from the list of supported languages. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
		options: getLanguageOptions(),
		default: ['en'],
		displayOptions: {
			show: {
				resource: ['post'],
				operation: ['quote'],
			},
		},
	},
	{
		displayName: 'Website Card',
		name: 'websiteCard',
		type: 'fixedCollection',
		default: {},
		placeholder: 'Add Website Card',
		options: [
			{
				displayName: 'Details',
				name: 'details',
				values: [
					{
						displayName: 'URI',
						name: 'uri',
						type: 'string',
						default: '',
						required: true,
					},
					{
						displayName: 'Fetch Open Graph Tags',
						name: 'fetchOpenGraphTags',
						type: 'boolean',
						description: 'Whether to fetch open graph tags from the website',
						hint: 'If enabled, the node will fetch the open graph tags from the website URL provided and use them to create a website card',
						default: false,
					},
					{
						displayName: 'Title',
						name: 'title',
						type: 'string',
						default: '',
						required: true,
						displayOptions: {
							show: {
								fetchOpenGraphTags: [false],
							},
						}
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: '',
						displayOptions: {
							show: {
								fetchOpenGraphTags: [false],
							},
						}
					},
					{
						displayName: 'Binary Property',
						name: 'thumbnailBinaryProperty',
						type: 'string',
						default: 'data',
						description: 'Name of the binary property containing the thumbnail image',
						displayOptions: {
							show: {
								fetchOpenGraphTags: [false],
							},
						}
					},
				],
			},
		],
		displayOptions: {
			show: {
				resource: ['post'],
				operation: ['post'],
				includeMedia: [false], // Hide if includeMedia is true
			},
		},
	},
	{
		displayName: 'Include Media',
		name: 'includeMedia',
		type: 'boolean',
		default: false,
		description: 'Whether to include media in the post',
		displayOptions: {
			show: {
				resource: ['post'],
				operation: ['post'],
			},
		},
	},
	{
		displayName: 'Media Items',
		name: 'mediaItems',
		type: 'fixedCollection',
		default: {},
		placeholder: 'Add Media Item',
		typeOptions: {
			multiple: true,
			multipleValueButtonText: 'Add Media',
			sortable: true,
		},
		displayOptions: {
			show: {
				resource: ['post'],
				operation: ['post'],
				includeMedia: [true],
			},
		},
		options: [
			{
				displayName: 'Media',
				name: 'media',
				values: [
					{
						displayName: 'Binary Property',
						name: 'binaryPropertyName',
						type: 'string',
						default: 'data',
						required: true,
						description: 'Name of the binary property containing the image data. Maximum 4 images.',
					},
					{
						displayName: 'Alt Text',
						name: 'altText',
						type: 'string',
						default: '',
						description: 'Alt text for the image (max 1000 bytes)',
					},
				],
			},
		],
	},
];

// Helper types for the post function
// Helper type for mediaItems
interface MediaItem {
	media: {
		binaryPropertyName: string;
		altText?: string;
	};
}

export async function postOperation(
	this: IExecuteFunctions, // 'this' is the IExecuteFunctions context
	agent: BskyAgent,
	postText: string,
	langs: string[],
	websiteCard?: {
		thumbnailBinaryProperty?: string;
		description: string | undefined;
		title: string | undefined;
		uri: string | undefined;
		fetchOpenGraphTags: boolean | undefined;
	},
	includeMedia?: boolean,
	mediaItemsInput?: { mediaItems?: any[] },
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];
	const node = this.getNode();

	let rt = new RichText({ text: postText });
	await rt.detectFacets(agent as AtpAgent); // BskyAgent extends AtpAgent

	const postData: any = {
		$type: 'app.bsky.feed.post',
		text: rt.text,
		langs: langs,
		facets: rt.facets,
		createdAt: new Date().toISOString(),
	};

	// Enhanced mediaItems handling
	if (includeMedia === true) {
		// Make sure we have valid media items to process
		if (!mediaItemsInput || !mediaItemsInput.mediaItems || !Array.isArray(mediaItemsInput.mediaItems) || mediaItemsInput.mediaItems.length === 0) {
			// No valid media items found - continue without media
		} else {
			// Valid media items available
			if (mediaItemsInput.mediaItems.length > 4) {
				throw new NodeOperationError(node, 'Cannot attach more than 4 images to a post.');
			}
			
			const imagesForEmbed: { image: ComAtprotoRepoUploadBlob.OutputSchema['blob']; alt: string }[] = [];
			
			try {
				// Check if we have access to binary data
				const items = this.getInputData();
				if (!items || items.length === 0) {
					throw new NodeOperationError(node, 'No input items available');
				}
				
				// For each media item defined in the node configuration
				for (let i = 0; i < mediaItemsInput.mediaItems.length; i++) {
					const mediaItem: MediaItem = mediaItemsInput.mediaItems[i];
					
					// Validate media item structure
					if (!mediaItem || !mediaItem.media || !mediaItem.media.binaryPropertyName) {
						continue; // Skip invalid media item
					}
					
					const binaryPropName = mediaItem.media.binaryPropertyName;
					
					// Validate binary property exists before trying to upload
					const inputItem = items[0]; // Always use first item for now
					if (!inputItem?.binary || !inputItem.binary[binaryPropName]) {
						throw new NodeOperationError(
							node,
							`Binary property '${binaryPropName}' not found in input data. ` +
							`Available properties: ${Object.keys(inputItem?.binary || {}).join(', ') || 'none'}`
						);
					}
					
					// Access helpers from the passed IExecuteFunctions context
					const binaryData = await this.helpers.getBinaryDataBuffer(0, binaryPropName);
					
					if (!binaryData || !Buffer.isBuffer(binaryData)) {
						throw new NodeOperationError(node, 
							`Invalid binary data received from property '${binaryPropName}'. ` +
							`Expected a Buffer but got ${typeof binaryData}.`
						);
					}
					
					const uploadResponse = await agent.uploadBlob(binaryData);
					
					// Add to our images array
					imagesForEmbed.push({ 
						image: uploadResponse.data.blob, 
						alt: mediaItem.media.altText || '' 
					});
				}
				
				// If images were uploaded successfully, add them to the post
				if (imagesForEmbed.length > 0) {
					postData.embed = {
						$type: 'app.bsky.embed.images',
						images: imagesForEmbed,
					};
				}
			} catch (error) {
				console.error('[ERROR] Error processing media:', error);
				throw new NodeOperationError(node, `Failed to process media: ${error.message}`);
			}
		}
	} else if (websiteCard?.uri) {
		// Website card handling
		let thumbBlob: ComAtprotoRepoUploadBlob.OutputSchema['blob'] | undefined = undefined;

		if (websiteCard.thumbnailBinaryProperty) {
			try {
				const binaryData = await this.helpers.getBinaryDataBuffer(0, websiteCard.thumbnailBinaryProperty);
				const uploadResponse = await agent.uploadBlob(binaryData);
				thumbBlob = uploadResponse.data.blob;
			} catch (error) {
				throw new NodeOperationError(node, error, {
					message: `Failed to upload website card thumbnail from binary property '${websiteCard.thumbnailBinaryProperty}'`,
				});
			}
		}

		if (websiteCard.fetchOpenGraphTags === true) {
			try {
				const ogsResponse = await ogs({ url: websiteCard.uri });
				if (ogsResponse.error || !ogsResponse.result) {
					throw new Error(`Error fetching Open Graph tags: ${ogsResponse.error || 'No result'}`);
				}
				const ogResult = ogsResponse.result;
				if (ogResult.ogImage && ogResult.ogImage.length > 0 && ogResult.ogImage[0].url) {
					const imageUrl = ogResult.ogImage[0].url;
					const imageResponse = await fetch(imageUrl);
					if (!imageResponse.ok) {
						throw new Error(`Failed to fetch Open Graph image from ${imageUrl}: ${imageResponse.statusText}`);
					}
					const imageArrayBuffer = await imageResponse.arrayBuffer();
					const imageBuffer = Buffer.from(imageArrayBuffer);
					const uploadResponse = await agent.uploadBlob(imageBuffer);
					thumbBlob = uploadResponse.data.blob;
				}
				if (ogResult.ogTitle) {
					websiteCard.title = ogResult.ogTitle;
				}
				if (ogResult.ogDescription) {
					websiteCard.description = ogResult.ogDescription;
				}
			} catch (error) {
				throw new NodeOperationError(node, error, {
					message: 'Failed to process Open Graph data for website card',
				});
			}
		}

		postData.embed = {
			$type: 'app.bsky.embed.external',
			external: {
				uri: websiteCard.uri,
				title: websiteCard.title || '',
				description: websiteCard.description || '',
				thumb: thumbBlob,
			},
		};
	}

	// Create the post
	const postResponse: { uri: string; cid: string } = await agent.post(postData);

	returnData.push({
		json: {
			uri: postResponse.uri,
			cid: postResponse.cid,
		},
	});

	return returnData;
}

export async function deletePostOperation(agent: AtpAgent, uri: string): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];
	await agent.deletePost(uri)

	returnData.push({
		json: {
			uri: uri,
		},
	});

	return returnData;
}

export async function likeOperation(
	agent: AtpAgent,
	uri: string,
	cid: string,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	// https://docs.bsky.app/docs/tutorials/like-repost#liking-a-post
	const likeResponse: { uri: string; cid: string } = await agent.like(uri, cid);

	returnData.push({
		json: {
			uri: likeResponse.uri,
			cid: likeResponse.cid,
		},
	});

	return returnData;
}

export async function deleteLikeOperation(
	agent: AtpAgent,
	uri: string,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	// no response from deleteLike
	// https://docs.bsky.app/docs/tutorials/like-repost#unliking-a-post
	await agent.deleteLike(uri);

	returnData.push({
		json: {
			uri: uri,
		},
	});

	return returnData;
}

export async function repostOperation(
	agent: AtpAgent,
	uri: string,
	cid: string,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	// https://docs.bsky.app/docs/tutorials/like-repost#quote-reposting
	const repostResult: { uri: string; cid: string } = await agent.repost(uri, cid);

	returnData.push({
		json: {
			uri: repostResult.uri,
			cid: repostResult.cid,
		},
	});

	return returnData;
}

export async function deleteRepostOperation(
	agent: AtpAgent,
	uri: string,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	// no response from deleteRepost
	await agent.deleteRepost(uri);

	returnData.push({
		json: {
			uri: uri,
		},
	});

	return returnData;
}

export async function replyOperation(
	agent: BskyAgent,
	replyText: string,
	langs: string[],
	parentUri: string,
	parentCid: string,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	let rt = new RichText({ text: replyText });
	await rt.detectFacets(agent as AtpAgent);

	// Get the parent post to find the root of the thread
	const parentThreadResponse = await agent.getPostThread({ uri: parentUri });
	
	// Extract the root from the thread - if parent is part of a thread, use its root
	let root = { uri: parentUri, cid: parentCid };
	if (parentThreadResponse.data.thread && 'post' in parentThreadResponse.data.thread) {
		const threadPost = parentThreadResponse.data.thread.post;
		if (threadPost.record && typeof threadPost.record === 'object' && 'reply' in threadPost.record) {
			const replyRecord = threadPost.record.reply as any;
			if (replyRecord?.root) {
				root = replyRecord.root;
			}
		}
	}

	const replyData = {
		$type: 'app.bsky.feed.post' as const,
		text: rt.text,
		langs: langs,
		facets: rt.facets,
		createdAt: new Date().toISOString(),
		reply: {
			root: root,
			parent: {
				uri: parentUri,
				cid: parentCid,
			},
		},
	};

	const replyResponse: { uri: string; cid: string } = await agent.post(replyData);

	returnData.push({
		json: {
			uri: replyResponse.uri,
			cid: replyResponse.cid,
		},
	});

	return returnData;
}

export async function quoteOperation(
	agent: BskyAgent,
	quoteText: string,
	langs: string[],
	quotedUri: string,
	quotedCid: string,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	let rt = new RichText({ text: quoteText });
	await rt.detectFacets(agent as AtpAgent);

	const quoteData = {
		$type: 'app.bsky.feed.post' as const,
		text: rt.text,
		langs: langs,
		facets: rt.facets,
		createdAt: new Date().toISOString(),
		embed: {
			$type: 'app.bsky.embed.record' as const,
			record: {
				uri: quotedUri,
				cid: quotedCid,
			},
		},
	};

	const quoteResponse: { uri: string; cid: string } = await agent.post(quoteData);

	returnData.push({
		json: {
			uri: quoteResponse.uri,
			cid: quoteResponse.cid,
		},
	});

	return returnData;
}
