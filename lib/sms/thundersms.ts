// ThunderSMS Integration Service
// Sends SMS via ThunderSMS API with retry logic
import "server-only";

export interface ThunderSMSResponse {
  success: boolean;
  code: string;
  desc: string;
  raw: Record<string, unknown> | null;
}

interface ThunderSMSConfig {
  username: string;
  apiKey: string;
  senderId: string;
  baseUrl: string;
  entityId?: string;
  templateId?: string;
}

function getConfig(): ThunderSMSConfig {
  const username = process.env.THUNDERSMS_USERNAME;
  const apiKey = process.env.THUNDERSMS_API_KEY;
  const senderId = process.env.THUNDERSMS_SENDER_ID;
  const baseUrl =
    process.env.THUNDERSMS_BASE_URL ||
    "https://newportal.thundersms.com/pushapi/sendmsg";
  const entityId = process.env.THUNDERSMS_ENTITY_ID;
  const templateId = process.env.THUNDERSMS_TEMPLATE_ID;

  const missing: string[] = [];
  if (!username) missing.push("THUNDERSMS_USERNAME");
  if (!apiKey) missing.push("THUNDERSMS_API_KEY");
  if (!senderId) missing.push("THUNDERSMS_SENDER_ID");

  if (missing.length > 0) {
    throw new Error(
      `Missing ThunderSMS env vars: ${missing.join(", ")}. Check your .env file.`,
    );
  }

  return {
    username: username!,
    apiKey: apiKey!,
    senderId: senderId!,
    baseUrl,
    entityId,
    templateId,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate the OTP message text matching the DLT-approved template
 */
export function generateOTPMessage(
  otp: string,
  expiryMinutes: number = 5,
): string {
  return `District Collector:\nYour verification code is ${otp}. This code will expire in ${expiryMinutes} minutes. For your security, please do not share it with anyone. -DACGOV`;
}

/**
 * Send SMS via ThunderSMS API
 */
export async function sendSms(
  dest: string,
  text: string,
  opts: {
    templateId?: string;
    entityId?: string;
    custRef?: string;
    campaign?: string;
  } = {},
): Promise<ThunderSMSResponse> {
  // Allow SSL issues for ThunderSMS API
  if (typeof process !== "undefined") {
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
  }

  const config = getConfig();

  // Clean phone number to 10 digits
  const cleanedDest = dest.replace(/\D/g, "");
  if (cleanedDest.length !== 10) {
    return {
      success: false,
      code: "INVALID_PHONE",
      desc: "Phone number must be 10 digits",
      raw: null,
    };
  }

  const params = new URLSearchParams({
    username: config.username,
    apikey: config.apiKey,
    signature: config.senderId,
    msgtxt: text,
    msgtype: "PM",
    dest: cleanedDest,
  });

  if (opts.templateId || config.templateId) {
    params.append("templateid", opts.templateId || config.templateId!);
  }
  if (opts.entityId || config.entityId) {
    params.append("entityid", opts.entityId || config.entityId!);
  }
  if (opts.custRef) {
    params.append("custref", opts.custRef);
  }
  if (opts.campaign) {
    params.append("campaign", opts.campaign);
  }

  const url = `${config.baseUrl}?${params.toString()}`;

  const maxRetries = 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `📱 ThunderSMS attempt ${attempt + 1}/${maxRetries + 1} for ${cleanedDest}`,
      );

      const response = await fetch(url, {
        method: "GET",
        headers: { "User-Agent": "Election-NMS/1.0" },
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log("📱 ThunderSMS Response:", responseData);

      const success =
        responseData.code === "6001" || responseData.code === 6001;

      return {
        success,
        code: String(responseData.code || "UNKNOWN"),
        desc: responseData.desc || responseData.message || "No description",
        raw: responseData,
      };
    } catch (error) {
      lastError = error as Error;
      console.error(`📱 ThunderSMS attempt ${attempt + 1} failed:`, error);

      const msg = (error as Error).message?.toLowerCase() || "";
      if (
        msg.includes("invalid destination") ||
        msg.includes("unauthorized") ||
        msg.includes("forbidden")
      ) {
        break;
      }

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`📱 ThunderSMS: Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  return {
    success: false,
    code: "NETWORK_ERROR",
    desc: `Failed after ${maxRetries + 1} attempts: ${lastError?.message || "Unknown error"}`,
    raw: { error: lastError?.message },
  };
}

/**
 * Check if ThunderSMS is configured
 */
export function isThunderSMSConfigured(): boolean {
  return !!(
    process.env.THUNDERSMS_USERNAME &&
    process.env.THUNDERSMS_API_KEY &&
    process.env.THUNDERSMS_SENDER_ID
  );
}

/**
 * Send OTP via ThunderSMS
 */
export async function sendOTPSms(
  phoneNumber: string,
  otp: string,
  expiryMinutes: number = 5,
): Promise<ThunderSMSResponse> {
  const message = generateOTPMessage(otp, expiryMinutes);
  return sendSms(phoneNumber, message, {
    custRef: `otp_${Date.now()}`,
    campaign: "OTP",
  });
}
