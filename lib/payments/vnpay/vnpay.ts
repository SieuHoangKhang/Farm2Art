import crypto from "crypto";

export type VnpayConfig = {
  tmnCode: string;
  hashSecret: string;
  paymentUrl: string; // sandbox/prod
  returnUrl: string;
};

export type CreateVnpayPaymentInput = {
  txnRef: string; // mã đơn hàng / mã giao dịch phía bạn
  amountVnd: number; // VND (ví dụ 100000)
  orderInfo: string;
  orderType?: string;
  locale?: "vn" | "en";
  ipAddr: string;
  bankCode?: string;
};

export type VnpayVerifyResult =
  | { ok: true; code: string; message?: string; params: Record<string, string> }
  | { ok: false; reason: string };

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

export function formatVnpayDate(date: Date) {
  // yyyyMMddHHmmss
  return (
    `${date.getFullYear()}` +
    pad2(date.getMonth() + 1) +
    pad2(date.getDate()) +
    pad2(date.getHours()) +
    pad2(date.getMinutes()) +
    pad2(date.getSeconds())
  );
}

export function sortObject(obj: Record<string, string>) {
  const sortedKeys = Object.keys(obj).sort();
  const result: Record<string, string> = {};
  for (const key of sortedKeys) result[key] = obj[key];
  return result;
}

export function buildQueryString(params: Record<string, string>) {
  const urlSearch = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    urlSearch.append(key, value);
  }
  // VNPay ký trên chuỗi query dạng key=value&... (URL-encoded)
  return urlSearch.toString();
}

export function hmacSha512(hexSecret: string, data: string) {
  return crypto.createHmac("sha512", hexSecret).update(Buffer.from(data, "utf-8")).digest("hex");
}

export function createPaymentUrl(config: VnpayConfig, input: CreateVnpayPaymentInput) {
  if (!Number.isFinite(input.amountVnd) || input.amountVnd <= 0) {
    throw new Error("amountVnd must be > 0");
  }

  const vnpParams: Record<string, string> = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: config.tmnCode,
    vnp_Locale: input.locale ?? "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: input.txnRef,
    vnp_OrderInfo: input.orderInfo,
    vnp_OrderType: input.orderType ?? "other",
    vnp_Amount: String(Math.round(input.amountVnd * 100)),
    vnp_ReturnUrl: config.returnUrl,
    vnp_IpAddr: input.ipAddr,
    vnp_CreateDate: formatVnpayDate(new Date()),
  };

  if (input.bankCode) vnpParams.vnp_BankCode = input.bankCode;

  const sorted = sortObject(vnpParams);
  const signData = buildQueryString(sorted);
  const secureHash = hmacSha512(config.hashSecret, signData);

  const finalParams: Record<string, string> = {
    ...sorted,
    vnp_SecureHash: secureHash,
  };

  return `${config.paymentUrl}?${buildQueryString(finalParams)}`;
}

export function verifyVnpayReturn(queryParams: Record<string, string>, hashSecret: string): VnpayVerifyResult {
  const params = { ...queryParams };

  const receivedHash = params.vnp_SecureHash;
  // vnp_SecureHashType có thể có trong payload, nhưng không cần dùng để verify.

  if (!receivedHash) return { ok: false, reason: "Missing vnp_SecureHash" };

  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;

  // Một số payload có thể chứa các key rỗng; để an toàn, loại bỏ giá trị undefined/null
  const normalized: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === "string") normalized[k] = v;
  }

  const sorted = sortObject(normalized);
  const signData = buildQueryString(sorted);
  const expectedHash = hmacSha512(hashSecret, signData);

  if (expectedHash !== receivedHash) {
    return { ok: false, reason: "Invalid signature" };
  }

  // vnp_ResponseCode = "00" là thành công (thường)
  const code = queryParams.vnp_ResponseCode ?? "";
  return {
    ok: true,
    code,
    message: queryParams.vnp_Message,
    params: queryParams,
  };
}
