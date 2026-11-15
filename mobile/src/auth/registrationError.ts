type AuthFailure = { code?: string; status?: number; message?: string };
export function registrationError(error: AuthFailure): { message: string; action?: "sign-in" | "password" } {
  if (["user_already_exists", "email_exists"].includes(error.code ?? "") || (!error.code && error.status === 422 && error.message === "User already registered")) return {
    message: "An account already exists for this email. Sign in with its existing password to finish setting up your workspace.", action: "sign-in",
  };
  if (error.code === "weak_password") return { message: "Choose a different password. It must meet the requirements and must not be a known compromised password.", action: "password" };
  if (error.status === 429 || ["over_email_send_rate_limit", "over_request_rate_limit", "over_sms_send_rate_limit"].includes(error.code ?? "")) return { message: "Too many registration or email requests. Please wait before trying again. Your details remain saved." };
  if (error.code === "email_address_not_authorized") return { message: "Confirmation email delivery is not configured for this address. Contact TrustBridge support; your details remain saved." };
  if (error.code === "signup_disabled") return { message: "New account registration is currently unavailable. Existing members can sign in.", action: "sign-in" };
  return { message: "The account service could not complete registration. Your details remain saved. Check your connection and try again, or sign in if you already registered." };
}
