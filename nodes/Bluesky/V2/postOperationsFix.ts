// This is a fixed version of the media handling code
// Import the relevant types from the existing postOperations.ts file
import { BskyAgent, ComAtprotoRepoUploadBlob } from '@atproto/api';
import { NodeOperationError, IExecuteFunctions } from 'n8n-workflow';

// Define the MediaItem interface explicitly
interface MediaItem {
	media: {
		binaryPropertyName: string;
		altText?: string;
	};
}

// Define the MediaItemsInput interface explicitly
interface MediaItemsInput {
	mediaItems?: MediaItem[];
}

// Fixed helper function to upload an image and return its BlobRef and alt text
async function uploadImageHelper(
	executeFunctions: IExecuteFunctions,
	agent: BskyAgent,
	binaryPropertyName: string,
	altText?: string,
	itemIndex: number = 0,
): Promise<{ blob: ComAtprotoRepoUploadBlob.OutputSchema['blob']; altText: string }> {
	try {
		// First check if binary data exists for this item
		const items = executeFunctions.getInputData();
		const item = items[itemIndex];
		
		if (!item?.binary || !item.binary[binaryPropertyName]) {
			const node = executeFunctions.getNode();
			throw new NodeOperationError(node, 
				`Binary data property '${binaryPropertyName}' not found for item at index ${itemIndex}. ` +
				`Make sure the previous node provides binary data with the property name '${binaryPropertyName}'.`
			);
		}
		
		// Access helpers from the passed IExecuteFunctions context
		const binaryData = await executeFunctions.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);
		
		if (!binaryData || !Buffer.isBuffer(binaryData)) {
			const node = executeFunctions.getNode();
			throw new NodeOperationError(node, 
				`Invalid binary data received from property '${binaryPropertyName}'. ` +
				`Expected a Buffer but got ${typeof binaryData}.`
			);
		}

		console.log(`Uploading image data: ${binaryData.length} bytes`);
		const uploadResponse = await agent.uploadBlob(binaryData);
		console.log('Upload succeeded');

		return {
			blob: uploadResponse.data.blob,
			altText: altText || '',
		};
	} catch (error) {
		console.error('Upload image error:', error);
		const node = executeFunctions.getNode();
		throw new NodeOperationError(node, error, {
			message: `Failed to upload image from binary property '${binaryPropertyName}'`,
			itemIndex: itemIndex,
		});
	}
}

// The media handling part of the postOperation function
async function processMediaItems(
	executeFunctions: IExecuteFunctions,
	agent: BskyAgent,
	includeMedia: boolean,
	mediaItemsInput: MediaItemsInput | undefined,
): Promise<{ $type: string; images: { image: ComAtprotoRepoUploadBlob.OutputSchema['blob']; alt: string }[] } | undefined> {
	const node = executeFunctions.getNode();
	
	if (!includeMedia || !mediaItemsInput?.mediaItems || mediaItemsInput.mediaItems.length === 0) {
		return undefined;
	}
	
	if (mediaItemsInput.mediaItems.length > 4) {
		throw new NodeOperationError(node, 'Cannot attach more than 4 images to a post.');
	}
	
	console.log(`Processing ${mediaItemsInput.mediaItems.length} media items`);
	
	const imagesForEmbed: { image: ComAtprotoRepoUploadBlob.OutputSchema['blob']; alt: string }[] = [];
	
	try {
		// Check if we have access to binary data
		const items = executeFunctions.getInputData();
		if (!items || items.length === 0) {
			throw new NodeOperationError(node, 'No input items available');
		}
		
		// For each media item defined in the node configuration
		for (let i = 0; i < mediaItemsInput.mediaItems.length; i++) {
			// Use explicit type annotation
			const mediaItem: MediaItem = mediaItemsInput.mediaItems[i];
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
				executeFunctions,
				agent,
				binaryPropName,
				mediaItem.media.altText,
				0, // Always use first item for now
			);
			
			console.log(`Successfully uploaded image ${i + 1}`);
			imagesForEmbed.push({ image: uploadedImage.blob, alt: uploadedImage.altText });
		}
		
		// If images were uploaded successfully, return the embed data
		if (imagesForEmbed.length > 0) {
			console.log(`Adding ${imagesForEmbed.length} images to post embed`);
			return {
				$type: 'app.bsky.embed.images',
				images: imagesForEmbed,
			};
		} else {
			console.log('No images were successfully uploaded');
			return undefined;
		}
	} catch (error) {
		console.error('Error processing media:', error);
		throw new NodeOperationError(node, `Failed to process media: ${error.message}`);
	}
}

// Export the fixed functions
export {
	MediaItem,
	MediaItemsInput,
	uploadImageHelper,
	processMediaItems,
};
