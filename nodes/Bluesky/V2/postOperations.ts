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
				operation: ['deletePost', 'like', 'deleteLike', 'repost'],
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
				operation: ['like', 'repost'],
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

interface MediaItem {
	media: {
		binaryPropertyName: string;
		altText?: string;
	};
}

interface MediaItemsInput {
	mediaItems?: MediaItem[];
}

// Helper function to upload an image and return its BlobRef and alt text
async function uploadImageHelper(
	executeFunctions: IExecuteFunctions, // Keep IExecuteFunctions for type clarity
	agent: BskyAgent,
	binaryPropertyName: string,
	altText?: string,
	itemIndex: number = 0, // for getBinaryDataBuffer
): Promise<{ blob: ComAtprotoRepoUploadBlob.OutputSchema['blob']; altText: string }> {
	try {
		console.log(`[DEBUG] Starting image upload for binary property: ${binaryPropertyName}`);
		// First check if binary data exists for this item
		const items = executeFunctions.getInputData();
		console.log(`[DEBUG] Total input items: ${items.length}`);
		
		if (!items[itemIndex]) {
			console.log(`[DEBUG] No item found at index ${itemIndex}`);
			throw new NodeOperationError(executeFunctions.getNode(), `No item found at index ${itemIndex}`);
		}
		
		const item = items[itemIndex];
		console.log(`[DEBUG] Binary properties available: ${Object.keys(item.binary || {}).join(', ') || 'none'}`);
		
		if (!item?.binary || !item.binary[binaryPropertyName]) {
			const node = executeFunctions.getNode();
			throw new NodeOperationError(node, 
				`Binary data property '${binaryPropertyName}' not found for item at index ${itemIndex}. ` +
				`Available binary properties: ${Object.keys(item.binary || {}).join(', ') || 'none'}`
			);
		}
		
		// Log info about the binary data
		console.log(`[DEBUG] Binary data found for property ${binaryPropertyName}`);
		if (item.binary[binaryPropertyName].mimeType) {
			console.log(`[DEBUG] MIME type: ${item.binary[binaryPropertyName].mimeType}`);
		}
		if (item.binary[binaryPropertyName].fileSize) {
			console.log(`[DEBUG] File size: ${item.binary[binaryPropertyName].fileSize}`);
		}
		
		// Access helpers from the passed IExecuteFunctions context
		console.log(`[DEBUG] Getting binary data buffer...`);
		const binaryData = await executeFunctions.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);
		
		if (!binaryData || !Buffer.isBuffer(binaryData)) {
			const node = executeFunctions.getNode();
			throw new NodeOperationError(node, 
				`Invalid binary data received from property '${binaryPropertyName}'. ` +
				`Expected a Buffer but got ${typeof binaryData}.`
			);
		}

		console.log(`[DEBUG] Binary data buffer retrieved, size: ${binaryData.length} bytes`);
		console.log(`[DEBUG] Uploading blob to Bluesky...`);
		const uploadResponse = await agent.uploadBlob(binaryData);
		console.log(`[DEBUG] Upload successful. Blob reference received`);

		return {
			blob: uploadResponse.data.blob,
			altText: altText || '',
		};
	} catch (error) {
		console.error(`[ERROR] Upload failed: ${error.message}`, error);
		const node = executeFunctions.getNode();
		throw new NodeOperationError(node, error, {
			message: `Failed to upload image from binary property '${binaryPropertyName}': ${error.message}`,
			itemIndex: itemIndex,
		});
	}
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
	mediaItemsInput?: MediaItemsInput,
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

	if (includeMedia && mediaItemsInput?.mediaItems && mediaItemsInput.mediaItems.length > 0) {
		if (mediaItemsInput.mediaItems.length > 4) {
			throw new NodeOperationError(node, 'Cannot attach more than 4 images to a post.');
		}
		
		// Log the media items configuration for debugging
		console.log(`Attempting to process ${mediaItemsInput.mediaItems.length} media items`);
		for (const item of mediaItemsInput.mediaItems) {
			console.log(`Media item configuration: Binary property: ${item.media.binaryPropertyName}, Alt text: ${item.media.altText || '(none)'}`);
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
				const mediaItem = mediaItemsInput.mediaItems[i];
				const binaryPropName = mediaItem.media.binaryPropertyName;
				
				console.log(`Processing media item ${i + 1}: Binary property name: ${binaryPropName}`);
				
				// Validate binary property exists before trying to upload
				const inputItem = items[0]; // Always use first item for now
				if (!inputItem?.binary || !inputItem.binary[binaryPropName]) {
					throw new NodeOperationError(
						node,
						`Binary property '${binaryPropName}' not found in input data. ` +
						`Make sure the previous node provides binary data with this property name.`
					);
				}
				
				// Upload the image
				const uploadedImage = await uploadImageHelper(
					this, // Pass the IExecuteFunctions context
					agent,
					binaryPropName,
					mediaItem.media.altText,
					0, // Always use first item for now 
				);
				
				console.log(`Successfully uploaded image ${i + 1}`);
				imagesForEmbed.push({ image: uploadedImage.blob, alt: uploadedImage.altText });
			}
			
			// If images were uploaded successfully, add them to the post
			if (imagesForEmbed.length > 0) {
				console.log(`Adding ${imagesForEmbed.length} images to post embed`);
				postData.embed = {
					$type: 'app.bsky.embed.images',
					images: imagesForEmbed,
				};
			} else {
				console.log('No images were successfully uploaded');
			}
		} catch (error) {
			console.error('Error processing media:', error);
			throw new NodeOperationError(node, `Failed to process media: ${error.message}`);
		}
	} else if (websiteCard?.uri) {
		let thumbBlob: ComAtprotoRepoUploadBlob.OutputSchema['blob'] | undefined = undefined;

		if (websiteCard.thumbnailBinaryProperty) {
			try {
				// Use this.helpers here as well
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
				title: websiteCard.title || '', // Ensure title is not undefined
				description: websiteCard.description || '', // Ensure description is not undefined
				thumb: thumbBlob,
			},
		};
	}

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
