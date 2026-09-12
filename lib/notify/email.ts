// lib/notify/email.ts
//
// Sends the login OTP by email via Resend's REST API (no SDK
// dependency needed — it's a single authenticated POST). Resolves to a
// soft failure rather than throwing when RESEND_API_KEY isn't set, for
// the same reason as lib/notify/sms.ts: a missing channel shouldn't be
// able to lock the admin out on its own.

export type EmailResult = { sent: boolean; skipped: boolean; error?: string };

export async function sendOtpEmail(toEmail: string, code: string): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !fromEmail) return { sent: false, skipped: true };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: toEmail,
        subject: `Your admin login code: ${code}`,
        html: `
          <p>Your Dipak Chatterjee admin dashboard login code is:</p>
          <p style="font-size:28px;font-weight:700;letter-spacing:4px;">${code}</p>
          <p>It expires in 5 minutes. If you didn't request this, you can ignore this email.</p>
        `,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { sent: false, skipped: false, error: `Resend ${res.status}: ${body}` };
    }

    return { sent: true, skipped: false };
  } catch (err) {
    return { sent: false, skipped: false, error: err instanceof Error ? err.message : "Resend request failed" };
  }
}
