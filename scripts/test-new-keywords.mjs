import fetch from 'node-fetch';

const testMessages = [
  // Greeting variants
  "halo", "heyyy", "chào các bạn",
  
  // Product search variants
  "bạn bán gì", "farm2art bán gì", "có bán gì tốt không",
  
  // Vegetable variants
  "rau an toàn", "rau sạch", "rau không hóa chất",
  
  // New categories
  "hỗ trợ nông dân không", "farm2art có hỗ trợ nông dân không",
  "artisan", "handmade", "người làm thủ công",
  "chất lượng sao", "chứng chỉ", "kiểm chứng",
  "farm2art uy tín không", "brand farm2art",
  "có khuyến mãi không", "flash sale hôm nay",
  "đổi hàng sao", "trả hàng",
  "quà tặng gì tốt", "quà sinh nhật",
];

async function testChat(message) {
  try {
    const response = await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      return { error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { reply: data.reply || 'No reply' };
  } catch (err) {
    return { error: err.message };
  }
}

async function run() {
  console.log('\n🧪 NEW KEYWORDS TEST');
  console.log('='.repeat(70));
  
  let passed = 0;
  let failed = 0;
  
  for (const msg of testMessages) {
    const result = await testChat(msg);
    
    if (result.error) {
      console.log(`❌ "${msg}" -> Error: ${result.error}`);
      failed++;
    } else if (result.reply && result.reply.length > 10) {
      console.log(`✅ "${msg}" -> OK`);
      passed++;
    } else {
      console.log(`❌ "${msg}" -> Empty reply`);
      failed++;
    }
    
    await new Promise(r => setTimeout(r, 300));
  }
  
  console.log('\n' + '='.repeat(70));
  console.log(`✅ Passed: ${passed}/${testMessages.length}`);
  console.log(`❌ Failed: ${failed}/${testMessages.length}`);
  console.log(`📊 Success Rate: ${((passed / testMessages.length) * 100).toFixed(0)}%\n`);
}

run();
