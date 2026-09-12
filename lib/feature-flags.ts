// lib/feature-flags.ts
//
// Single source of truth for the admin login 2FA toggle. The OTP
// architecture (route, form, generation/verification helpers, DB
// cleanup, email dispatch) stays fully in place regardless of this
// flag — flipping it only changes whether app/admin/login/actions.ts
// and proxy.ts invoke that path. Set ENABLE_ADMIN_2FA=true in
// .env.local to resume requiring the OTP challenge on every login;
// leave it unset (or "false") to sign straight in after a correct
// password, which is the current default.
export const FEATURE_FLAGS = {
  REQUIRE_OTP: process.env.ENABLE_ADMIN_2FA === "true",
};
