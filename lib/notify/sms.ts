// lib/notify/sms.ts
//
// Sends the login OTP by SMS. Both gateways are plain REST APIs, so
// this uses `fetch` directly rather than pulling in either vendor's
// SDK as a dependency. Pick one with SMS_PROVIDER=fast2sms|twilio; if
// neither is configured, `sendOtpSms` resolves to a soft failure (see
// return type) rather than throwing — lib/otp-login.ts treats a
// missing SMS channel as non-fatal as long as email still goes out, so
// the admin is never locked out just because a gateway isn't set up
// yet (see that file for the full fallback policy).

export type SmsResult = { sent: boolean; skipped: boolean; error?: string };

async function sendViaFast2Sms(toPhone: string, message: string): Promise<SmsResult> {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) return { sent: false, skipped: true };

  try {
    const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "q",
        message,
        numbers: toPhone.replace(/\D/g, ""),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { sent: false, skipped: false, error: `Fast2SMS ${res.status}: ${body}` };
    }

    return { sent: true, skipped: false };
  } catch (err) {
    return { sent: false, skipped: false, error: err instanceof Error ? err.message : "Fast2SMS request failed" };
  }
}

async function sendViaTwilio(toPhone: string, message: string): Promise<SmsResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  if (!accountSid || !authToken || !fromNumber) return { sent: false, skipped: true };

  try {
    const body = new URLSearchParams({ To: toPhone, From: fromNumber, Body: message });
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (!res.ok) {
      const responseBody = await res.text();
      return { sent: false, skipped: false, error: `Twilio ${res.status}: ${responseBody}` };
    }

    return { sent: true, skipped: false };
  } catch (err) {
    return { sent: false, skipped: false, error: err instanceof Error ? err.message : "Twilio request failed" };
  }
}

export async function sendOtpSms(toPhone: string, code: string): Promise<SmsResult> {
  const message = `Your Dipak Chatterjee admin login code is ${code}. It expires in 5 minutes. Do not share it.`;
  const provider = (process.env.SMS_PROVIDER || "").toLowerCase();

  if (provider === "twilio") return sendViaTwilio(toPhone, message);
  if (provider === "fast2sms") return sendViaFast2Sms(toPhone, message);

  // No SMS_PROVIDER configured — try whichever gateway has credentials
  // set, so setup only requires the provider's own env vars.
  const fast2sms = await sendViaFast2Sms(toPhone, message);
  if (!fast2sms.skipped) return fast2sms;
  return sendViaTwilio(toPhone, message);
}
