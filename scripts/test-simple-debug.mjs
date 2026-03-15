import fetch from 'node-fetch';

const testMessages = [
  "chào bạn",
  "sản phẩm",
  "chính sách",
  "xin chào",
  "chào",
  "tôi muốn tìm rau",
];

async function testChat(message) {
  try {
    console.log(`\n📝 Input: "${message}"`);
    const response = await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      console.log(`❌ HTTP Error: ${response.status}`);
      const text = await response.text();
      console.log(`Response: ${text}`);
      return;
    }

    const data = await response.json();
    if (data.reply) {
      console.log(`✅ Reply: ${data.reply}`);
    } else if (data.error) {
      console.log(`❌ Error: ${data.error}`);
    } else {
      console.log(`❓ No reply in response:`, data);
    }
  } catch (err) {
    console.log(`❌ Exception: ${err.message}`);
  }
}

async function run() {
  console.log('🧪 SIMPLE DEBUG TEST');
  console.log('='.repeat(60));
  
  for (const msg of testMessages) {
    await testChat(msg);
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log('\n✨ Debug test completed');
}

run();
