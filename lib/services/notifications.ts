// Notification services - SMS and Email
import "server-only";
import nodemailer from "nodemailer";

// Email transporter
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Send SMS
export async function sendSMS(
  phone: string,
  message: string,
): Promise<boolean> {
  try {
    const smsGatewayUrl = process.env.SMS_GATEWAY_URL;
    const apiKey = process.env.SMS_GATEWAY_API_KEY;
    const senderId = process.env.SMS_SENDER_ID || "ELECNM";

    if (!smsGatewayUrl || !apiKey) {
      console.warn("SMS Gateway not configured, logging message instead");
      console.log(`SMS to ${phone}: ${message}`);
      return true; // Return true for development
    }

    // Format phone number (ensure 10 digits for Indian numbers)
    const formattedPhone = phone.replace(/\D/g, "").slice(-10);

    const response = await fetch(smsGatewayUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        to: formattedPhone,
        message,
        senderId,
        route: "transactional",
      }),
    });

    if (!response.ok) {
      console.error("SMS send failed:", await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("SMS send error:", error);
    return false;
  }
}

// Send Email
export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html?: string,
): Promise<boolean> {
  try {
    if (!process.env.SMTP_HOST) {
      console.warn("SMTP not configured, logging email instead");
      console.log(`Email to ${to}: ${subject}\n${text}`);
      return true; // Return true for development
    }

    const info = await emailTransporter.sendMail({
      from: process.env.SMTP_FROM || "Election NMS <noreply@election.gov>",
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, "<br>"),
    });

    console.log("Email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
}

// Send notification (SMS + Email)
export async function sendNotification(
  phone: string | null,
  email: string | null,
  subject: string,
  message: string,
): Promise<{ sms: boolean; email: boolean }> {
  const results = { sms: false, email: false };

  if (phone) {
    results.sms = await sendSMS(phone, message);
  }

  if (email) {
    results.email = await sendEmail(email, subject, message);
  }

  return results;
}

// Predefined notification templates
export const NotificationTemplates = {
  OTP: (otp: string, expiryMinutes: number) =>
    `Your Election NMS verification code is: ${otp}. Valid for ${expiryMinutes} minutes. Do not share this code.`,

  NOMINATION_SUBMITTED: (applicationNo: string) =>
    `Your nomination ${applicationNo} has been submitted successfully. Please wait for receipt confirmation from the Returning Officer.`,

  NOMINATION_RECEIVED: (applicationNo: string) =>
    `Your nomination ${applicationNo} has been received by the Returning Officer.`,

  NOMINATION_ACCEPTED: (applicationNo: string) =>
    `Congratulations! Your nomination ${applicationNo} has been accepted after scrutiny.`,

  NOMINATION_REJECTED: (applicationNo: string, reason: string) =>
    `Your nomination ${applicationNo} has been rejected. Reason: ${reason}`,

  WITHDRAWAL_CONFIRMED: (applicationNo: string) =>
    `Your nomination ${applicationNo} has been withdrawn successfully.`,

  PAYMENT_SUCCESS: (applicationNo: string, amount: number) =>
    `Payment of ₹${amount} received for nomination ${applicationNo}. Transaction successful.`,

  PAYMENT_FAILED: (applicationNo: string) =>
    `Payment failed for nomination ${applicationNo}. Please retry.`,
};
