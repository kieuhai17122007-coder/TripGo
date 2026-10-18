import paymentQrUrl from "../assets/tripgo-payment-qr.png";

const env = import.meta.env;

export const paymentConfig = {
  mode: env.VITE_PAYMENT_MODE || "unconfigured",
  createEndpoint: env.VITE_PAYMENT_CREATE_ENDPOINT || "",
  statusEndpoint: env.VITE_PAYMENT_STATUS_ENDPOINT || "",
  cancelEndpoint: env.VITE_PAYMENT_CANCEL_ENDPOINT || "",
  bankName: env.VITE_PAYMENT_BANK_NAME || "Techcombank",
  accountName: env.VITE_PAYMENT_ACCOUNT_NAME || "KIEU DUC HAI",
  accountNumber: env.VITE_PAYMENT_ACCOUNT_NUMBER || "8881 7122 0078 88",
  qrImageUrl: paymentQrUrl,
};

export const paymentAvailable =
  paymentConfig.mode === "live" &&
  Boolean(paymentConfig.createEndpoint && paymentConfig.statusEndpoint);
export const manualQrAvailable = Boolean(
  paymentConfig.qrImageUrl &&
  paymentConfig.bankName &&
  paymentConfig.accountName &&
  paymentConfig.accountNumber,
);
