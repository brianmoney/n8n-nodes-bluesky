// This is a debug script to understand how binary data is processed in the n8n workflow
const fs = require('fs');

// Log environment information
console.log('Node.js version:', process.version);
console.log('Process working directory:', process.cwd());

// Create a file to check if we can write to the filesystem
fs.writeFileSync('./debug.log', 'Debug started\n', { flag: 'w' });

// Log a message to help the user understand what to try
console.log('\n-- DEBUG INFO FOR BINARY DATA UPLOADING --');
console.log('When testing in n8n, please check:');
console.log('1. Does the previous node (Google Drive) provide binary data?');
console.log('   - Open the output of the Google Drive node');
console.log('   - Verify it has a "binary" section with a "data" property');
console.log('2. Try accessing the data directly:');
console.log('   - In your workflow, add a "Function" node between Google Drive and Bluesky');
console.log('   - Use this code to inspect the binary data:');
console.log(`
// n8n Function node code
const item = $input.item;
if (item.binary && item.binary.data) {
  const binaryInfo = {
    exists: true,
    mimeType: item.binary.data.mimeType,
    fileName: item.binary.data.fileName,
    fileSize: item.binary.data.fileSize,
    // Don't log the data itself as it would be too large
  };
  $input.item.json.binaryInfo = binaryInfo;
  return $input;
} else {
  $input.item.json.binaryInfo = { exists: false };
  return $input;
}
`);

// Provide info on debugging the Bluesky node
console.log('\n-- HOW TO DEBUG THE BLUESKY NODE --');
console.log('You can add debugging in the Bluesky node by modifying postOperations.ts:');
console.log(`
// Add at the beginning of the uploadImageHelper function:
console.log('DEBUG: Starting uploadImageHelper');
console.log('DEBUG: Binary property name:', binaryPropertyName);
console.log('DEBUG: Item index:', itemIndex);

// Before getting binary data:
console.log('DEBUG: About to get binary data');

// After getting binary data:
console.log('DEBUG: Binary data fetched, type:', typeof binaryData);
console.log('DEBUG: Binary data is Buffer?', Buffer.isBuffer(binaryData));
console.log('DEBUG: Binary data length:', binaryData?.length || 'undefined');

// Before upload:
console.log('DEBUG: About to upload blob');

// After successful upload:
console.log('DEBUG: Blob uploaded successfully:', JSON.stringify(uploadResponse.data.blob));
`);

// Create sample test for debugging the Bluesky API directly
console.log('\n-- TEST SCRIPT FOR BLUESKY API --');
console.log('You can test the Bluesky API directly with this code:');
console.log(`
const { BskyAgent } = require('@atproto/api');
const fs = require('fs');

async function testBskyUpload() {
  // Replace with your credentials
  const agent = new BskyAgent({ 
    service: 'https://bsky.social' 
  });
  
  await agent.login({ 
    identifier: 'your-username', 
    password: 'your-app-password' 
  });

  // Load an image file
  const imageData = fs.readFileSync('./test-image.jpg');
  
  console.log('Image loaded, size:', imageData.length);
  
  // Upload the image
  const uploadResponse = await agent.uploadBlob(imageData);
  
  console.log('Upload response:', JSON.stringify(uploadResponse.data, null, 2));
  
  // Create a post with the image
  const postData = {
    text: 'Testing image upload',
    embed: {
      $type: 'app.bsky.embed.images',
      images: [
        {
          image: uploadResponse.data.blob,
          alt: 'Test image'
        }
      ]
    }
  };
  
  const postResponse = await agent.post(postData);
  console.log('Post created:', postResponse);
}

testBskyUpload().catch(console.error);
`);

// Add a tip for debugging
fs.appendFileSync('./debug.log', 'Debugging resources created\n');
console.log('\nCheck n8n logs for any error messages related to binary data processing.');
console.log('Look for specific errors like "TypeError" or "Cannot read properties of undefined".');
