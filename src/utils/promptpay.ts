/**
 * Thai PromptPay EMVCo QR Code Payload Generator
 * Complies with Bank of Thailand & EMVCo Standard Specifications
 */

function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function tag(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

export function generatePromptPayPayload(target: string, amount?: number): string {
  // Sanitize target (strip dashes, spaces)
  const cleaned = target.replace(/[^0-9]/g, '');
  let targetType = '01'; // 01 for mobile, 02 for Tax ID / Citizen ID
  let formattedTarget = '';

  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    // Mobile phone: 08x-xxx-xxxx -> 00668xxxxxxxx (13 chars)
    targetType = '01';
    formattedTarget = `0066${cleaned.slice(1)}`;
  } else if (cleaned.length === 9) {
    // 9-digit mobile (without leading 0)
    targetType = '01';
    formattedTarget = `0066${cleaned}`;
  } else if (cleaned.length === 13) {
    // Citizen ID or Tax ID
    targetType = '02';
    formattedTarget = cleaned;
  } else {
    // Fallback default format
    formattedTarget = cleaned.padStart(13, '0');
  }

  // Tag 29 sub-tags: AID + Target
  const aid = tag('00', 'A000000677010111');
  const merchantTarget = tag(targetType, formattedTarget);
  const tag29 = tag('29', aid + merchantTarget);

  let raw = '';
  raw += tag('00', '01'); // Format indicator
  raw += tag('01', amount !== undefined && amount > 0 ? '12' : '11'); // Point of initiation (12 = dynamic with amount)
  raw += tag29;
  raw += tag('53', '764'); // THB currency code

  if (amount !== undefined && amount > 0) {
    raw += tag('54', amount.toFixed(2)); // Transaction amount
  }

  raw += tag('58', 'TH'); // Country code

  // Tag 63: Checksum
  const checksumInput = raw + '6304';
  const checksum = crc16(checksumInput);

  return checksumInput + checksum;
}
