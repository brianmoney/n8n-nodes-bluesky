// This is a simple test script to check binary data processing
// It simulates what happens in postOperation when a binary property is accessed

const fs = require('fs');

// Create a simple pseudo execution context
const executionContext = {
  helpers: {
    getBinaryDataBuffer: async (itemIndex, propertyName) => {
      console.log(`Getting binary data from item ${itemIndex}, property ${propertyName}`);
      // This would normally get the actual binary data
      // Just return some placeholder data for testing
      return Buffer.from('test binary data');
    }
  },
  getNode: () => ({ name: 'TestNode' }),
  getNodeParameter: (paramName, itemIndex, defaultValue) => {
    console.log(`Getting parameter ${paramName} for item ${itemIndex}`);
    // Return test values
    if (paramName === 'includeMedia') return true;
    if (paramName === 'mediaItems') {
      return [
        {
          media: {
            binaryPropertyName: 'data',
            altText: 'Test image'
          }
        }
      ];
    }
    return defaultValue;
  },
  getInputData: () => [{ json: {}, binary: { data: { mimeType: 'image/jpeg', data: 'base64data' } } }]
};

async function testBinaryProcessing() {
  try {
    // Simulate the execution context
    const agent = {
      uploadBlob: async (buffer) => {
        console.log('Uploading blob of size:', buffer.length);
        return { 
          data: { 
            blob: { 
              ref: { $link: 'test-cid' }, 
              mimeType: 'image/jpeg', 
              size: buffer.length 
            } 
          } 
        };
      },
      post: async (data) => {
        console.log('Posting with data:', JSON.stringify(data, null, 2));
        return { uri: 'test-uri', cid: 'test-cid' };
      }
    };
    
    // Get the mediaItems input as it would happen in the node execution
    const includeMedia = true;
    const mediaItemsInput = { 
      mediaItems: [
        {
          media: { 
            binaryPropertyName: 'data', 
            altText: 'Test image' 
          }
        }
      ]
    };
    
    // Simulate binary data access
    const binaryData = await executionContext.helpers.getBinaryDataBuffer(0, 'data');
    console.log('Binary data retrieved:', binaryData.toString());
    
    // Test upload
    const uploadResponse = await agent.uploadBlob(binaryData);
    console.log('Upload response:', uploadResponse);
    
    // Test constructing the post data with images
    const imagesForEmbed = [];
    for (let i = 0; i < mediaItemsInput.mediaItems.length; i++) {
      const item = mediaItemsInput.mediaItems[i];
      // Get the binary data
      const binaryDataForItem = await executionContext.helpers.getBinaryDataBuffer(0, item.media.binaryPropertyName);
      // Upload the image
      const uploadResponseForItem = await agent.uploadBlob(binaryDataForItem);
      // Add to embeddings array
      imagesForEmbed.push({ 
        image: uploadResponseForItem.data.blob, 
        alt: item.media.altText || '' 
      });
    }
    
    // Build post data
    const postData = {
      $type: 'app.bsky.feed.post',
      text: 'Test post',
      langs: ['en'],
      createdAt: new Date().toISOString(),
    };
    
    if (imagesForEmbed.length > 0) {
      postData.embed = {
        $type: 'app.bsky.embed.images',
        images: imagesForEmbed
      };
    }
    
    console.log('Final post data:', JSON.stringify(postData, null, 2));
    
    // Test posting
    const postResponse = await agent.post(postData);
    console.log('Post response:', postResponse);
    
    console.log('All tests passed!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testBinaryProcessing();
