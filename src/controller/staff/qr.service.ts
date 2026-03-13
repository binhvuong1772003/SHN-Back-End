// src/service/staff/qr.service.ts
import QRCode from 'qrcode';

export const generateStaffQRService = async (
  userId: string,
  shopSlug: string
) => {
  const payload = JSON.stringify({ userId, shopSlug });
  const qrImage = await QRCode.toDataURL(payload);
  return qrImage; // base64 image
};
