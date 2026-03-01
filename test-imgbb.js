/**
 * ImgBB Configuration Test
 *
 * 测试 ImgBB API 配置是否正常工作
 */

const IMGBB_API_KEY = '6f48de8c80b77edf976a5f60d5c915c4';
const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';

// 创建一个简单的测试图片（1x1 透明PNG的Base64）
const TEST_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function testImgBB() {
  console.log('🧪 Testing ImgBB Configuration...\n');

  try {
    console.log('📋 Configuration:');
    console.log(`   API Key: ${IMGBB_API_KEY.substring(0, 8)}...${IMGBB_API_KEY.substring(IMGBB_API_KEY.length - 4)}`);
    console.log(`   API URL: ${IMGBB_API_URL}\n`);

    console.log('📤 Uploading test image...');

    const formData = new URLSearchParams({
      key: IMGBB_API_KEY,
      image: TEST_IMAGE_BASE64,
      expiration: (7 * 24 * 60 * 60).toString(), // 7 days
      name: 'test-image-' + Date.now()
    });

    const response = await fetch(IMGBB_API_URL, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Upload successful!\n');
      console.log('📊 Result:');
      console.log(`   Image URL: ${result.data.url}`);
      console.log(`   Delete URL: ${result.data.delete_url}`);
      console.log(`   Image Size: ${result.data.size} bytes`);
      console.log(`   Image ID: ${result.data.id}`);

      if (result.data.expiration) {
        const expiresAt = new Date(result.data.expiration * 1000);
        console.log(`   Expires At: ${expiresAt.toLocaleString()}`);
      } else {
        console.log(`   Expires At: Never (Permanent)`);
      }

      console.log('\n🎉 ImgBB configuration is working correctly!');
      console.log('✅ Your image storage is ready to use.\n');

      // 测试图片是否可访问
      console.log('🔍 Verifying image accessibility...');
      const imageCheck = await fetch(result.data.url);
      if (imageCheck.ok) {
        console.log('✅ Image is publicly accessible!\n');
      } else {
        console.log('⚠️  Image URL returned status:', imageCheck.status, '\n');
      }

      return true;
    } else {
      console.log('❌ Upload failed!\n');
      console.log('Error:', result.error || 'Unknown error');
      console.log('Status:', result.status_code || 'N/A');

      if (result.error && result.error.message) {
        console.log('Message:', result.error.message);
      }

      console.log('\n💡 Troubleshooting:');
      console.log('   1. Check if API key is correct');
      console.log('   2. Ensure API key is active on https://api.imgbb.com/');
      console.log('   3. Check your internet connection\n');

      return false;
    }
  } catch (error) {
    console.log('❌ Test failed with error!\n');
    console.log('Error:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Check your internet connection');
    console.log('   2. Verify API endpoint is accessible');
    console.log('   3. Check firewall/proxy settings\n');

    return false;
  }
}

// Run the test
testImgBB()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
