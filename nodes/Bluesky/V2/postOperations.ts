import { AtpAgent, RichText, ComAtprotoRepoUploadBlob } from '@atproto/api';
import { IExecuteFunctions, INodeExecutionData, INodeProperties, NodeOperationError } from 'n8n-workflow';
import { getLanguageOptions } from './languages';
import { uploadVideo } from './videoOperations';
import { improvedUploadImageHelper } from './binaryUploadHelper';
import ogs from 'open-graph-scraper';

export const postProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		default: 'post',
		displayOptions: { show: { resource: ['post'] } },
		name: 'operation',
		noDataExpression: true,
		options: [
			{ name: 'Create a Post', value: 'post', action: 'Create a post' },
			{ name: 'Delete a Post', value: 'deletePost', action: 'Delete a post' },
			{ name: 'Delete Repost', value: 'deleteRepost', action: 'Delete a repost' },
			{ name: 'Like a Post', value: 'like', action: 'Like a post' },
			{ name: 'Quote a Post', value: 'quote', action: 'Quote a post' },
			{ name: 'Reply to a Post', value: 'reply', action: 'Reply to a post' },
			{ name: 'Repost a Post', value: 'repost', action: 'Repost a post' },
			{ name: 'Unline a Post', value: 'deleteLike', action: 'Unlike a post' },
		],
		type: 'options',
	},
	{
		displayName: 'Post Text',
		name: 'postText',
		type: 'string',
		default: '',
		displayOptions: { show: { resource: ['post'], operation: ['post'] } },
	},
	{
		displayName: 'Language Names or IDs',
		name: 'langs',
		type: 'multiOptions',
		description:
			'Choose from the list of supported languages. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
		options: getLanguageOptions(),
		default: ['en'],
		displayOptions: { show: { resource: ['post'], operation: ['post'] } },
	},
	{
		displayName: 'Uri',
		name: 'uri',
		type: 'string',
		description: 'The URI of the post',
		default: '',
		required: true,
		displayOptions: {
			show: { resource: ['post'], operation: ['deletePost', 'like', 'deleteLike', 'repost', 'reply', 'quote'] },
		},
	},
	{
		displayName: 'Cid',
		name: 'cid',
		type: 'string',
		description: 'The CID of the post',
		default: '',
		required: true,
		displayOptions: { show: { resource: ['post'], operation: ['like', 'repost', 'reply', 'quote'] } },
	},
	{
		displayName: 'Reply Text',
		name: 'replyText',
		type: 'string',
		default: '',
		required: true,
		description: 'The text content of your reply',
		displayOptions: { show: { resource: ['post'], operation: ['reply'] } },
	},
	{
		displayName: 'Reply Languages',
		name: 'replyLangs',
		type: 'multiOptions',
		description:
			'Choose from the list of supported languages. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
		options: getLanguageOptions(),
		default: ['en'],
		displayOptions: { show: { resource: ['post'], operation: ['reply'] } },
	},
	{
		displayName: 'Quote Text',
		name: 'quoteText',
		type: 'string',
		default: '',
		required: true,
		description: 'The text content of your quote post',
		displayOptions: { show: { resource: ['post'], operation: ['quote'] } },
	},
	{
		displayName: 'Quote Languages',
		name: 'quoteLangs',
		type: 'multiOptions',
		description:
			'Choose from the list of supported languages. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
		options: getLanguageOptions(),
		default: ['en'],
		displayOptions: { show: { resource: ['post'], operation: ['quote'] } },
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
					{ displayName: 'URI', name: 'uri', type: 'string', default: '', required: true },
					{
						displayName: 'Fetch Open Graph Tags',
						name: 'fetchOpenGraphTags',
						type: 'boolean',
						description: 'Whether to fetch open graph tags from the website',
						hint: 'If enabled, the node will fetch the open graph tags from the website URL provided and use them to create a website card',
						default: false,
					},
					{ displayName: 'Title', name: 'title', type: 'string', default: '', required: true, displayOptions: { show: { fetchOpenGraphTags: [false] } } },
					{ displayName: 'Description', name: 'description', type: 'string', default: '', displayOptions: { show: { fetchOpenGraphTags: [false] } } },
					{
						displayName: 'Binary Property',
						name: 'thumbnailBinaryProperty',
						type: 'string',
						default: 'data',
						description: 'Name of the binary property containing the thumbnail image',
						displayOptions: { show: { fetchOpenGraphTags: [false] } },
					},
				],
			},
		],
		displayOptions: { show: { resource: ['post'], operation: ['post', 'reply'], includeMedia: [false] } },
	},
	{
		displayName: 'Include Media',
		name: 'includeMedia',
		type: 'boolean',
		default: false,
		description: 'Whether to include media in the post',
		displayOptions: { show: { resource: ['post'], operation: ['post', 'reply'] } },
	},
	{
		displayName: 'Media Items',
		name: 'mediaItems',
		type: 'fixedCollection',
		default: {},
		placeholder: 'Add Media Item',
		typeOptions: { multiple: true, multipleValueButtonText: 'Add Media', sortable: true },
		displayOptions: { show: { resource: ['post'], operation: ['post', 'reply'], includeMedia: [true] } },
		options: [
			{
				displayName: 'Media',
				name: 'media',
				values: [
					{
						displayName: 'Media Type',
						name: 'mediaType',
						type: 'options',
						options: [ { name: 'Image', value: 'image' }, { name: 'Video', value: 'video' } ],
						default: 'image',
						required: true,
						description: 'Type of media to upload',
					},
					{
						displayName: 'Binary Property',
						name: 'binaryPropertyName',
						type: 'string',
						default: 'data',
						required: true,
						description: 'Name of the binary property containing the media data. For images: max 4 items. For videos: max 1 item per post.',
					},
					{ displayName: 'Alt Text', name: 'altText', type: 'string', default: '', description: 'Alt text for accessibility (max 1000 characters for images, max 1000 characters for videos)' },
				],
			},
		],
	},
];

interface MediaItem { media: { mediaType?: 'image' | 'video'; binaryPropertyName: string; altText?: string } }

async function buildMediaEmbed(
	context: IExecuteFunctions,
		agent: AtpAgent,
	includeMedia?: boolean,
	mediaItemsInput?: { mediaItems?: any[] },
): Promise<any | undefined> {
	if (includeMedia !== true) return undefined;
	if (!mediaItemsInput || !Array.isArray(mediaItemsInput.mediaItems) || mediaItemsInput.mediaItems.length === 0) return undefined;

	const node = context.getNode();
	const items = context.getInputData();
	if (!items || items.length === 0) throw new NodeOperationError(node, 'No input items available');

	const images: MediaItem[] = [];
	const videos: MediaItem[] = [];
	for (const item of mediaItemsInput.mediaItems) {
		let mediaType = item?.media?.mediaType as 'image' | 'video' | undefined;
		const binaryPropName = item?.media?.binaryPropertyName as string | undefined;
		if ((!mediaType || mediaType === 'image') && binaryPropName) {
			try {
				const mimeType = items[0]?.binary?.[binaryPropName]?.mimeType as string | undefined;
				if (mimeType?.startsWith('video/')) mediaType = 'video';
			} catch {}
		}
		if (mediaType === 'video') videos.push(item); else images.push(item);
	}

	if (images.length > 4) throw new NodeOperationError(node, 'Cannot attach more than 4 images to a post.');
	if (videos.length > 1) throw new NodeOperationError(node, 'Cannot attach more than 1 video to a post.');
	if (videos.length > 0 && images.length > 0) throw new NodeOperationError(node, 'Cannot mix images and videos in the same post. Choose either images OR a video.');

	if (videos.length > 0) {
		const videoItem = videos[0];
		const binaryPropName = videoItem.media.binaryPropertyName;
		const inputItem = items[0];
		if (!inputItem?.binary || !inputItem.binary[binaryPropName]) {
			throw new NodeOperationError(node, `Binary property '${binaryPropName}' not found in input data. ` + `Available properties: ${Object.keys(inputItem?.binary || {}).join(', ') || 'none'}`);
		}
		const videoResult = await uploadVideo.call(context, agent, binaryPropName, videoItem.media.altText);
		return { $type: 'app.bsky.embed.video', video: videoResult.blob, alt: videoResult.altText, ...(videoResult.aspectRatio && { aspectRatio: videoResult.aspectRatio }) };
	}

	if (images.length > 0) {
		const imagesForEmbed: { image: ComAtprotoRepoUploadBlob.OutputSchema['blob']; alt: string; aspectRatio?: { width: number; height: number } }[] = [];
		for (const mediaItem of images) {
			const binaryPropName = mediaItem?.media?.binaryPropertyName;
			if (!binaryPropName) continue;
			const inputItem = items[0];
			if (!inputItem?.binary || !inputItem.binary[binaryPropName]) {
				throw new NodeOperationError(node, `Binary property '${binaryPropName}' not found in input data. ` + `Available properties: ${Object.keys(inputItem?.binary || {}).join(', ') || 'none'}`);
			}
			const uploadResult = await improvedUploadImageHelper.call(context, agent, binaryPropName, mediaItem.media.altText, 0);
			imagesForEmbed.push({ image: uploadResult.blob, alt: uploadResult.altText, ...(uploadResult.aspectRatio && { aspectRatio: uploadResult.aspectRatio }) });
		}
		if (imagesForEmbed.length > 0) return { $type: 'app.bsky.embed.images', images: imagesForEmbed };
	}

	return undefined;
}

async function buildWebsiteCardEmbed(
	context: IExecuteFunctions,
		agent: AtpAgent,
	websiteCard?: { thumbnailBinaryProperty?: string; description?: string; title?: string; uri?: string; fetchOpenGraphTags?: boolean },
): Promise<any | undefined> {
	if (!websiteCard?.uri) return undefined;
	const node = context.getNode();
	let thumbBlob: ComAtprotoRepoUploadBlob.OutputSchema['blob'] | undefined = undefined;
	if (websiteCard.thumbnailBinaryProperty) {
		try {
			const binaryData = await context.helpers.getBinaryDataBuffer(0, websiteCard.thumbnailBinaryProperty);
			const uploadResponse = await agent.uploadBlob(binaryData);
			thumbBlob = uploadResponse.data.blob;
		} catch (error: any) {
			throw new NodeOperationError(node, error, { message: `Failed to upload website card thumbnail from binary property '${websiteCard.thumbnailBinaryProperty}'` });
		}
	}
	if (websiteCard.fetchOpenGraphTags === true) {
		try {
			const ogsResponse = await ogs({ url: websiteCard.uri });
			if (ogsResponse.error || !ogsResponse.result) throw new Error(`Error fetching Open Graph tags: ${ogsResponse.error || 'No result'}`);
			const ogResult: any = ogsResponse.result;
			if (ogResult.ogImage && ogResult.ogImage.length > 0 && ogResult.ogImage[0].url) {
				const imageUrl = ogResult.ogImage[0].url as string;
				const imageResponse = await fetch(imageUrl);
				if (!imageResponse.ok) throw new Error(`Failed to fetch Open Graph image from ${imageUrl}: ${imageResponse.statusText}`);
				const imageArrayBuffer = await imageResponse.arrayBuffer();
				const imageBuffer = Buffer.from(imageArrayBuffer);
				const uploadResponse = await agent.uploadBlob(imageBuffer);
				thumbBlob = uploadResponse.data.blob;
			}
			if (ogResult.ogTitle) websiteCard.title = ogResult.ogTitle as string;
			if (ogResult.ogDescription) websiteCard.description = ogResult.ogDescription as string;
		} catch (error: any) {
			throw new NodeOperationError(node, error, { message: 'Failed to process Open Graph data for website card' });
		}
	}
	return { $type: 'app.bsky.embed.external', external: { uri: websiteCard.uri, title: websiteCard.title || '', description: websiteCard.description || '', thumb: thumbBlob } };
}

export async function postOperation(
	this: IExecuteFunctions,
		agent: AtpAgent,
	postText: string,
	langs: string[],
	websiteCard?: { thumbnailBinaryProperty?: string; description?: string; title?: string; uri?: string; fetchOpenGraphTags?: boolean },
	includeMedia?: boolean,
	mediaItemsInput?: { mediaItems?: any[] },
): Promise<INodeExecutionData[]> {
	const rt = new RichText({ text: postText });
	await rt.detectFacets(agent as AtpAgent);
	const postData: any = { $type: 'app.bsky.feed.post', text: rt.text, langs, facets: rt.facets, createdAt: new Date().toISOString() };
	const mediaEmbed = await buildMediaEmbed(this, agent, includeMedia, mediaItemsInput);
	if (mediaEmbed) postData.embed = mediaEmbed; else {
		const websiteEmbed = await buildWebsiteCardEmbed(this, agent, websiteCard);
		if (websiteEmbed) postData.embed = websiteEmbed;
	}
	const postResponse: { uri: string; cid: string } = await agent.post(postData);
	return [{ json: { uri: postResponse.uri, cid: postResponse.cid } }];
}

export async function deletePostOperation(agent: AtpAgent, uri: string): Promise<INodeExecutionData[]> {
	await agent.deletePost(uri);
	return [{ json: { uri } }];
}

export async function likeOperation(agent: AtpAgent, uri: string, cid: string): Promise<INodeExecutionData[]> {
	const likeResponse: { uri: string; cid: string } = await agent.like(uri, cid);
	return [{ json: { uri: likeResponse.uri, cid: likeResponse.cid } }];
}

export async function deleteLikeOperation(agent: AtpAgent, uri: string): Promise<INodeExecutionData[]> {
	await agent.deleteLike(uri);
	return [{ json: { uri } }];
}

export async function repostOperation(agent: AtpAgent, uri: string, cid: string): Promise<INodeExecutionData[]> {
	const repostResult: { uri: string; cid: string } = await agent.repost(uri, cid);
	return [{ json: { uri: repostResult.uri, cid: repostResult.cid } }];
}

export async function deleteRepostOperation(agent: AtpAgent, uri: string): Promise<INodeExecutionData[]> {
	await agent.deleteRepost(uri);
	return [{ json: { uri } }];
}

export async function replyOperation(
	this: IExecuteFunctions,
	agent: AtpAgent,
	replyText: string,
	langs: string[],
	parentUri: string,
	parentCid: string,
	websiteCard?: { thumbnailBinaryProperty?: string; description?: string; title?: string; uri?: string; fetchOpenGraphTags?: boolean },
	includeMedia?: boolean,
	mediaItemsInput?: { mediaItems?: any[] },
): Promise<INodeExecutionData[]> {
	const rt = new RichText({ text: replyText });
	await rt.detectFacets(agent as AtpAgent);
	const parentThreadResponse = await agent.getPostThread({ uri: parentUri });
	let root = { uri: parentUri, cid: parentCid } as { uri: string; cid: string };
	if (parentThreadResponse.data.thread && 'post' in parentThreadResponse.data.thread) {
		const threadPost: any = (parentThreadResponse.data as any).thread.post;
		if (threadPost.record && typeof threadPost.record === 'object' && 'reply' in threadPost.record) {
			const replyRecord = threadPost.record.reply as any;
			if (replyRecord?.root) root = replyRecord.root;
		}
	}
	const replyData: any = { $type: 'app.bsky.feed.post', text: rt.text, langs, facets: rt.facets, createdAt: new Date().toISOString(), reply: { root, parent: { uri: parentUri, cid: parentCid } } };
	const mediaEmbed = await buildMediaEmbed(this, agent, includeMedia, mediaItemsInput);
	if (mediaEmbed) replyData.embed = mediaEmbed; else {
		const websiteEmbed = await buildWebsiteCardEmbed(this, agent, websiteCard);
		if (websiteEmbed) replyData.embed = websiteEmbed;
	}
	const replyResponse: { uri: string; cid: string } = await agent.post(replyData);
	return [{ json: { uri: replyResponse.uri, cid: replyResponse.cid } }];
}

export async function quoteOperation(
	agent: AtpAgent,
	quoteText: string,
	langs: string[],
	quotedUri: string,
	quotedCid: string,
): Promise<INodeExecutionData[]> {
	const rt = new RichText({ text: quoteText });
	await rt.detectFacets(agent as AtpAgent);
	const quoteData = { $type: 'app.bsky.feed.post' as const, text: rt.text, langs, facets: rt.facets, createdAt: new Date().toISOString(), embed: { $type: 'app.bsky.embed.record' as const, record: { uri: quotedUri, cid: quotedCid } } };
	const quoteResponse: { uri: string; cid: string } = await agent.post(quoteData);
	return [{ json: { uri: quoteResponse.uri, cid: quoteResponse.cid } }];
}
