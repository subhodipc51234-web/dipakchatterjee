// app/admin/verify-otp/page.tsx
//
// Only reachable with a valid admin_pending_2fa cookie — proxy.ts
// redirects anyone else to /admin/login before this ever renders. See
// VerifyOtpForm.tsx and app/admin/login/actions.ts for the flow.

import { createClient } from "@/utils/supabase/server";
import VerifyOtpForm from "./VerifyOtpForm";

const DEFAULT_NAME = "Dipak Chatterjee";
const DEFAULT_SUBTITLE = "Admin Dashboard";

export default async function VerifyOtpPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("site_settings")
    .select("header_name, header_subtitle")
    .eq("id", "default")
    .single();

  return (
    <VerifyOtpForm
      brandName={settings?.header_name || DEFAULT_NAME}
      brandSubtitle={settings?.header_subtitle || DEFAULT_SUBTITLE}
    />
  );
}
