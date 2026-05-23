import jsQR from "jsqr";

export function decodeQrFromImageData(imageData: ImageData): string | null {
  const code = jsQR(imageData.data, imageData.width, imageData.height);
  return code?.data || null;
}

export function parseQrisString(raw: string): {
  merchantName: string;
  merchantCity: string;
  acquirer: string;
  terminalId?: string;
  txId?: string;
} {
  const result = {
    merchantName: "",
    merchantCity: "",
    acquirer: "",
    terminalId: "",
    txId: "",
  };

  // EMVCo TLV parsing — read tags sequentially
  let i = 0;
  while (i < raw.length - 3) {
    const tag = raw.substring(i, i + 2);
    i += 2;
    if (i + 2 > raw.length) break;
    const lenStr = raw.substring(i, i + 2);
    i += 2;
    const len = parseInt(lenStr, 10);
    if (isNaN(len) || i + len > raw.length) break;
    const value = raw.substring(i, i + len);
    i += len;

    if (tag === "59") {
      result.merchantName = value.trim();
    } else if (tag === "60") {
      result.merchantCity = value.trim();
    } else if (tag === "26" || tag === "29" || tag === "30" || tag === "31") {
      // Merchant Account Information — sub-TLV
      let j = 0;
      while (j < value.length - 3) {
        const subTag = value.substring(j, j + 2);
        j += 2;
        if (j + 2 > value.length) break;
        const subLenStr = value.substring(j, j + 2);
        j += 2;
        const subLen = parseInt(subLenStr, 10);
        if (isNaN(subLen) || j + subLen > value.length) break;
        const subVal = value.substring(j, j + subLen);
        j += subLen;

        if (subTag === "00") {
          // GUI — Globally Unique Identifier, often contains "ID.CO.QRIS"
          if (subVal.includes("QRIS")) {
            result.acquirer = extractAcquirer(value, j);
          }
        } else if (subTag === "01") {
          result.acquirer = subVal.trim();
        }
      }
    } else if (tag === "62") {
      // Additional Data
      let j = 0;
      while (j < value.length - 3) {
        const subTag = value.substring(j, j + 2);
        j += 2;
        if (j + 2 > value.length) break;
        const subLenStr = value.substring(j, j + 2);
        j += 2;
        const subLen = parseInt(subLenStr, 10);
        if (isNaN(subLen) || j + subLen > value.length) break;
        const subVal = value.substring(j, j + subLen);
        j += subLen;

        if (subTag === "07") {
          result.txId = subVal.trim();
        } else if (subTag === "01") {
          result.terminalId = subVal.trim();
        }
      }
    }
  }

  return result;
}

function extractAcquirer(merchantAccountInfo: string, currentPos: number): string {
  // Try to find the acquirer PAN (tag 01 or 04) after the GUI
  let j = currentPos;
  const remaining = merchantAccountInfo.substring(j);
  let k = 0;
  while (k < remaining.length - 3) {
    const subTag = remaining.substring(k, k + 2);
    k += 2;
    if (k + 2 > remaining.length) break;
    const subLenStr = remaining.substring(k, k + 2);
    k += 2;
    const subLen = parseInt(subLenStr, 10);
    if (isNaN(subLen) || k + subLen > remaining.length) break;
    const subVal = remaining.substring(k, k + subLen);
    k += subLen;

    if (subTag === "01" || subTag === "04") {
      return subVal.trim();
    }
  }
  return "Unknown";
}
