import assert from "node:assert/strict";

function computeAmount(order) {
  const warehouseFeeTotal =
    order.warehouseService?.serviceFeeTotal ??
    ((order.warehouseService?.storageFee ?? 0) +
      (order.warehouseService?.processingFee ?? 0) +
      (order.warehouseService?.shippingFee ?? 0));

  return (
    order.grandTotal ??
    (order.subTotal ?? order.totalAmount) +
      (order.platformFee ?? 0) +
      warehouseFeeTotal
  );
}

function run() {
  // Case 1: ưu tiên grandTotal
  assert.equal(
    computeAmount({
      grandTotal: 123000,
      subTotal: 100000,
      platformFee: 2500,
      warehouseService: { serviceFeeTotal: 20500 },
    }),
    123000
  );

  // Case 2: fallback đầy đủ theo serviceFeeTotal
  assert.equal(
    computeAmount({
      subTotal: 100000,
      platformFee: 2500,
      warehouseService: { serviceFeeTotal: 49000 },
    }),
    151500
  );

  // Case 3: fallback chi tiết khi thiếu serviceFeeTotal
  assert.equal(
    computeAmount({
      totalAmount: 100000,
      platformFee: 2500,
      warehouseService: { storageFee: 4000, processingFee: 15000, shippingFee: 30000 },
    }),
    151500
  );

  // Case 4: không có warehouseService
  assert.equal(
    computeAmount({
      totalAmount: 100000,
      platformFee: 2500,
    }),
    102500
  );

  console.log("VNPay amount regression checks passed");
}

run();
