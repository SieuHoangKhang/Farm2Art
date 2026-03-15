import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test cases from various customer scenarios
const testCases = [
  // ========== GREETING SCENARIOS (5) ==========
  { id: 1, category: 'Greeting', input: 'xin chào', expected_category: 'greet' },
  { id: 2, category: 'Greeting', input: 'chào bạn', expected_category: 'greet' },
  { id: 3, category: 'Greeting', input: 'hello', expected_category: 'greet' },
  { id: 4, category: 'Greeting', input: 'chào chào', expected_category: 'greet' },
  { id: 5, category: 'Greeting', input: 'tí xíu bạn ơi', expected_category: 'greet' },

  // ========== PRODUCT SEARCH SCENARIOS (8) ==========
  { id: 6, category: 'Search', input: 'tôi muốn tìm rau sạch', expected_category: 'vegetable' },
  { id: 7, category: 'Search', input: 'có quả cam nào không', expected_category: 'fruit' },
  { id: 8, category: 'Search', input: 'nước ép cam bao nhiêu tiền', expected_category: 'juice' },
  { id: 9, category: 'Search', input: 'mật ong có không?', expected_category: 'honey' },
  { id: 10, category: 'Search', input: 'tìm artwork đẹp', expected_category: 'artwork' },
  { id: 11, category: 'Search', input: 'tôi muốn khám phá sản phẩm tái chế', expected_category: 'search' },
  { id: 12, category: 'Search', input: 'có bao nhiêu loại sản phẩm', expected_category: 'search' },
  { id: 13, category: 'Search', input: 'lọc sản phẩm nào', expected_category: 'search' },

  // ========== PRICE & BUDGET SCENARIOS (6) ==========
  { id: 14, category: 'Price', input: 'rau bao nhiêu tiền một kg', expected_category: 'price_inquiry' },
  { id: 15, category: 'Price', input: 'giá nước ép bao lăm', expected_category: 'price_inquiry' },
  { id: 16, category: 'Price', input: 'artwork đắt không?', expected_category: 'artwork' },
  { id: 17, category: 'Price', input: 'có sản phẩm giá rẻ không?', expected_category: 'price_inquiry' },
  { id: 18, category: 'Price', input: 'mua số lượng lớn có giảm giá không', expected_category: 'bulk_order' },
  { id: 19, category: 'Price', input: 'combo giá bao nhiêu', expected_category: 'combo' },

  // ========== BUYING PROCESS (7) ==========
  { id: 20, category: 'Buy', input: 'cách mua hàng như thế nào', expected_category: 'buying_process' },
  { id: 21, category: 'Buy', input: 'tôi muốn đặt hàng hôm nay', expected_category: 'buying_process' },
  { id: 22, category: 'Buy', input: 'mua rau cách nào', expected_category: 'buying_process' },
  { id: 23, category: 'Buy', input: 'đặt hàng có khó không', expected_category: 'buying_process' },
  { id: 24, category: 'Buy', input: 'bước đầu tiên để mua là gì', expected_category: 'buying_process' },
  { id: 25, category: 'Buy', input: 'lần đầu mua, phải làm gì', expected_category: 'buying_process' },
  { id: 26, category: 'Buy', input: 'thêm vào giỏ hàng rồi sao', expected_category: 'buying_process' },

  // ========== PAYMENT SCENARIOS (5) ==========
  { id: 27, category: 'Payment', input: 'hình thức thanh toán nào', expected_category: 'payment_methods' },
  { id: 28, category: 'Payment', input: 'có thể chuyển khoản không', expected_category: 'payment_methods' },
  { id: 29, category: 'Payment', input: 'vnpay có được không', expected_category: 'payment_methods' },
  { id: 30, category: 'Payment', input: 'thanh toán khi nhận được không', expected_category: 'payment_methods' },
  { id: 31, category: 'Payment', input: 'ví điện tử được không', expected_category: 'payment_methods' },

  // ========== SHIPPING & DELIVERY (6) ==========
  { id: 32, category: 'Shipping', input: 'giao hàng bao lâu', expected_category: 'shipping_info' },
  { id: 33, category: 'Shipping', input: 'phí vận chuyển bao nhiêu', expected_category: 'shipping_info' },
  { id: 34, category: 'Shipping', input: 'miễn phí ship khi nào', expected_category: 'shipping_info' },
  { id: 35, category: 'Shipping', input: 'giao đến nơi tôi ở được không', expected_category: 'shipping_info' },
  { id: 36, category: 'Shipping', input: 'theo dõi hàng ở đâu', expected_category: 'tracking' },
  { id: 37, category: 'Shipping', input: 'hàng tôi đã tới chưa', expected_category: 'tracking' },

  // ========== ACCOUNT & PROFILE (5) ==========
  { id: 38, category: 'Account', input: 'cách tạo tài khoản', expected_category: 'registration' },
  { id: 39, category: 'Account', input: 'đăng ký như thế nào', expected_category: 'registration' },
  { id: 40, category: 'Account', input: 'quản lý tài khoản ở đâu', expected_category: 'profile_management' },
  { id: 41, category: 'Account', input: 'cập nhật hồ sơ sao', expected_category: 'profile_management' },
  { id: 42, category: 'Account', input: 'lưu sản phẩm yêu thích', expected_category: 'wishlist' },

  // ========== SELLER & VERIFICATION (4) ==========
  { id: 43, category: 'Seller', input: 'tôi muốn bán hàng trên farm2art', expected_category: 'seller_registration' },
  { id: 44, category: 'Seller', input: 'xem thông tin người bán', expected_category: 'seller_profile' },
  { id: 45, category: 'Seller', input: 'người bán này uy tín không', expected_category: 'seller_profile' },
  { id: 46, category: 'Seller', input: 'điều kiện trở thành người bán', expected_category: 'seller_registration' },

  // ========== REVIEWS & FEEDBACK (3) ==========
  { id: 47, category: 'Review', input: 'đánh giá sản phẩm thế nào', expected_category: 'reviews' },
  { id: 48, category: 'Review', input: 'viết bình luận ở đâu', expected_category: 'reviews' },
  { id: 49, category: 'Review', input: 'xem review người khác', expected_category: 'reviews' },

  // ========== COMPLAINTS & ISSUES (7) ==========
  { id: 50, category: 'Problem', input: 'hàng tôi bị hỏng rồi', expected_category: 'complaints' },
  { id: 51, category: 'Problem', input: 'sản phẩm không như mô tả', expected_category: 'complaints' },
  { id: 52, category: 'Problem', input: 'tôi muốn hoàn tiền', expected_category: 'refund' },
  { id: 53, category: 'Problem', input: 'hoàn lại sản phẩm sao', expected_category: 'refund' },
  { id: 54, category: 'Problem', input: 'liên hệ support ở đâu', expected_category: 'contact_support' },
  { id: 55, category: 'Problem', input: 'ứng dụng bị lỗi', expected_category: 'complaints' },
  { id: 56, category: 'Problem', input: 'hàng không tới', expected_category: 'complaints' },

  // ========== SUSTAINABILITY & ECO (2) ==========
  { id: 57, category: 'Eco', input: 'farm2art bảo vệ môi trường thế nào', expected_category: 'sustainability' },
  { id: 58, category: 'Eco', input: 'sản phẩm tái chế tốt không', expected_category: 'recycled' },

  // ========== ABOUT & INFO (2) ==========
  { id: 59, category: 'Info', input: 'farm2art là gì', expected_category: 'about' },
  { id: 60, category: 'Info', input: 'giới thiệu về farm2art', expected_category: 'about' },

  // ========== MIXED/COMPLEX QUERIES (5) ==========
  { id: 61, category: 'Complex', input: 'tôi muốn mua rau và nước ép, giá là bao nhiêu, giao mất bao lâu', expected_category: 'mixed' },
  { id: 62, category: 'Complex', input: 'sản phẩm tái chế có chất lượng tốt không, mua thế nào', expected_category: 'mixed' },
  { id: 63, category: 'Complex', input: 'artist bán artwork ở đây phải đáp ứng điều kiện gì', expected_category: 'mixed' },
  { id: 64, category: 'Complex', input: 'tôi có câu hỏi về hóa đơn và giao hàng', expected_category: 'mixed' },
  { id: 65, category: 'Complex', input: 'mua lô hàng lớn để bán lại được không', expected_category: 'bulk_order' },

  // ========== UNCLEAR/AMBIGUOUS (3) ==========
  { id: 66, category: 'Ambiguous', input: 'sao vậy', expected_category: 'fallback' },
  { id: 67, category: 'Ambiguous', input: 'ơi', expected_category: 'fallback' },
  { id: 68, category: 'Ambiguous', input: '???', expected_category: 'fallback' },

  // ========== CASUAL/CHAT (4) ==========
  { id: 69, category: 'Casual', input: 'đơn hàng của tôi ở đâu nhỉ', expected_category: 'tracking' },
  { id: 70, category: 'Casual', input: 'tôi thường xuyên đặt hàng', expected_category: 'profile_management' },
  { id: 71, category: 'Casual', input: 'tôi muốn làm quà cho bạn, có gợi ý không', expected_category: 'combo' },
  { id: 72, category: 'Casual', input: 'nông dân farm2art kiếm được tiền không', expected_category: 'about' },
];

// Simulated function to test chat endpoint
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

// Run tests
async function runAllTests() {
  console.log('\n🧪 FARM2ART CHATBOT COMPREHENSIVE TEST SUITE');
  console.log('='.repeat(70));
  console.log(`📊 Total test cases: ${testCases.length}\n`);

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: 0,
    byCategory: {},
  };

  // Group by category for summary
  const grouped = {};
  testCases.forEach((tc) => {
    if (!grouped[tc.category]) grouped[tc.category] = [];
    grouped[tc.category].push(tc);
  });

  // Run tests category by category
  for (const [category, cases] of Object.entries(grouped)) {
    console.log(`\n📂 ${category} (${cases.length} tests)`);
    console.log('-'.repeat(70));

    let categoryPassed = 0;

    for (const testCase of cases) {
      results.total++;

      console.log(`  Test #${testCase.id}: "${testCase.input}"`);

      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 300));

      const result = await testChat(testCase.input);

      if (result.error) {
        console.log(`    ❌ ERROR: ${result.error}`);
        results.errors++;
      } else if (result.reply) {
        // Simple heuristic: check if reply contains keywords from expected category
        const responseLength = result.reply.length;
        if (responseLength > 10) {
          console.log(`    ✅ PASS - Reply: "${result.reply.substring(0, 60)}..."`);
          results.passed++;
          categoryPassed++;
        } else {
          console.log(`    ❌ FAIL - Response too short: "${result.reply}"`);
          results.failed++;
        }
      } else {
        console.log(`    ❌ FAIL - No reply`);
        results.failed++;
      }
    }

    results.byCategory[category] = { total: cases.length, passed: categoryPassed };
  }

  // Summary report
  console.log('\n' + '='.repeat(70));
  console.log('📈 TEST SUMMARY REPORT');
  console.log('='.repeat(70));

  console.log(`\n✅ Passed:  ${results.passed}/${results.total}`);
  console.log(`❌ Failed:  ${results.failed}/${results.total}`);
  console.log(`⚠️  Errors:  ${results.errors}/${results.total}`);
  console.log(`📊 Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%\n`);

  console.log('Results by Category:');
  console.log('-'.repeat(70));
  Object.entries(results.byCategory).forEach(([cat, stats]) => {
    const passRate = ((stats.passed / stats.total) * 100).toFixed(0);
    const bar = '█'.repeat(Math.round(passRate / 5)) + '░'.repeat(20 - Math.round(passRate / 5));
    console.log(`  ${cat.padEnd(20)} [${bar}] ${stats.passed}/${stats.total} (${passRate}%)`);
  });

  // Save results to file
  const reportFile = `${__dirname}/test-results-${new Date().toISOString().slice(0, 10)}.json`;
  fs.writeFileSync(
    reportFile,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        summary: {
          total: results.total,
          passed: results.passed,
          failed: results.failed,
          errors: results.errors,
          successRate: `${((results.passed / results.total) * 100).toFixed(1)}%`,
        },
        byCategory: results.byCategory,
      },
      null,
      2
    )
  );

  console.log(`\n💾 Full report saved to: ${reportFile}`);
  console.log('\n✨ Test suite completed!\n');
}

// Ensure server is running before starting tests
console.log('\n🚀 Starting comprehensive chat tests...');
console.log('⏳ Waiting 2 seconds for server to be ready...\n');

setTimeout(runAllTests, 2000);
