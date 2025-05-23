// Test script for Bluesky API image upload
// To run: node test-bluesky-upload.js <username> <app-password> <image-path>

const fs = require('fs');
const { BskyAgent } = require('@atproto/api');

async function testImageUpload() {
  if (process.argv.length < 5) {
    console.log('Usage: node test-bluesky-upload.js <username> <app-password> <image-path>');
    console.log('Example: node test-bluesky-upload.js yourusername.bsky.social yourpassword ./test-image.jpg');
    process.exit(1);
  }

  const username = process.argv[2];
  const password = process.argv[3];
  const imagePath = process.argv[4];

  console.log(`Testing Bluesky image upload with: ${username}, ${imagePath}`);

  try {
    // 1. Check if image exists
    if (!fs.existsSync(imagePath)) {
      console.error(`Error: Image file not found at path: ${imagePath}`);
      process.exit(1);
    }

    const fileStats = fs.statSync(imagePath);
    console.log(`Image file size: ${fileStats.size} bytes`);

    // 2. Read image data
    console.log('Reading image file...');
    const imageData = fs.readFileSync(imagePath);
    console.log(`Successfully read ${imageData.length} bytes`);

    // 3. Initialize Bluesky agent
    console.log('Initializing Bluesky agent...');
    const agent = new BskyAgent({ service: 'https://bsky.social' });

    // 4. Login
    console.log('Logging in...');
    const loginResponse = await agent.login({
      identifier: username,
      password: password
    });
    console.log('Login successful!', loginResponse.success);
    
    // 5. Upload image
    console.log('Uploading image...');
    const uploadStart = Date.now();
    const uploadResponse = await agent.uploadBlob(imageData);
    const uploadDuration = Date.now() - uploadStart;
    
    console.log(`Upload successful! Took ${uploadDuration}ms`);
    console.log('Upload response:', JSON.stringify(uploadResponse.data, null, 2));
    
    // 6. Create post with image
    console.log('Creating post with image...');
    const postResponse = await agent.post({
      text: 'Testing image upload via API',
      embed: {
        $type: 'app.bsky.embed.images',
        images: [
          {
            image: uploadResponse.data.blob,
            alt: 'Test image'
          }
        ]
      }
    });
    
    console.log('Post created successfully!');
    console.log('Post URI:', postResponse.uri);
    console.log('Post CID:', postResponse.cid);
    
    console.log('\nAll tests passed successfully! The image should now appear in your Bluesky feed.');
    
  } catch (error) {
    console.error('Error during test:', error);
    if (error.status) {
      console.error('HTTP Status:', error.status);
      console.error('Error details:', error.data);
    }
  }
}

testImageUpload();
