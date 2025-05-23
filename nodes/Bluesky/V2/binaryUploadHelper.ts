// This file contains improved binary data handling for the Bluesky post operation
// It will help debug and fix the issue with image uploads

import { AtpAgent, BskyAgent, ComAtprotoRepoUploadBlob } from '@atproto/api';
import { IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

// Additional logging function to provide better debug info
function logDebug(message: string, data?: any): void {
  console.log(`[BLUESKY DEBUG] ${message}`);
  if (data !== undefined) {
    console.log(JSON.stringify(data, null, 2));
  }
}

// Enhanced upload helper with better error handling and logging
export async function improvedUploadImageHelper(
  this: IExecuteFunctions,
  agent: BskyAgent,
  binaryPropertyName: string,
  altText?: string,
  itemIndex: number = 0
): Promise<{ blob: ComAtprotoRepoUploadBlob.OutputSchema['blob']; altText: string }> {
  const node = this.getNode();
  
  try {
    logDebug(`Beginning image upload process for binary property: ${binaryPropertyName}`);
    
    // Get all input data
    const items = this.getInputData();
    logDebug(`Total input items: ${items.length}`);
    
    // Validate the binary data exists
    if (!items[itemIndex]) {
      throw new NodeOperationError(node, `Item at index ${itemIndex} does not exist`);
    }
    
    const item = items[itemIndex];
    logDebug(`Item binary properties available:`, Object.keys(item.binary || {}));
    
    if (!item.binary || !item.binary[binaryPropertyName]) {
      throw new NodeOperationError(
        node,
        `Binary property '${binaryPropertyName}' not found in input item at index ${itemIndex}. ` +
        `Available binary properties: ${Object.keys(item.binary || {}).join(', ') || 'none'}`
      );
    }
    
    // Log binary metadata if available
    const binaryMetadata = item.binary[binaryPropertyName];
    logDebug(`Binary metadata for ${binaryPropertyName}:`, {
      fileName: binaryMetadata.fileName,
      mimeType: binaryMetadata.mimeType,
      fileSize: binaryMetadata.fileSize
    });
    
    // Get the actual binary data buffer
    logDebug(`Requesting binary data buffer for ${binaryPropertyName}...`);
    const binaryData = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);
    
    if (!binaryData) {
      throw new NodeOperationError(node, `Failed to get binary data for property '${binaryPropertyName}'`);
    }
    
    logDebug(`Successfully retrieved binary data: ${binaryData.length} bytes`);
    
    // Upload the binary data to Bluesky
    logDebug(`Uploading binary data to Bluesky...`);
    const uploadStartTime = Date.now();
    const uploadResponse = await agent.uploadBlob(binaryData);
    const uploadDuration = Date.now() - uploadStartTime;
    
    logDebug(`Upload successful in ${uploadDuration}ms. Response:`, uploadResponse.data.blob);
    
    return {
      blob: uploadResponse.data.blob,
      altText: altText || '',
    };
  } catch (error) {
    logDebug(`Error uploading image: ${error.message}`);
    if (error.stack) {
      logDebug(`Stack trace: ${error.stack}`);
    }
    
    // Re-throw as a NodeOperationError with helpful message
    throw new NodeOperationError(node, error, {
      message: `Failed to upload image from binary property '${binaryPropertyName}': ${error.message}`,
      itemIndex: itemIndex,
    });
  }
}
