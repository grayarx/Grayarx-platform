const EMAIL_KEY = "grayarx_remember_email";
const REMEMBER_KEY = "grayarx_remember_me";

export function loadRememberedEmail(): string {
  if (typeof window === "undefined") return "";
  if (localStorage.getItem(REMEMBER_KEY) !== "1") return "";
  return localStorage.getItem(EMAIL_KEY) ?? "";
}

export function isRememberMeEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(REMEMBER_KEY);
  return stored === null ? true : stored === "1";
}

export function persistRememberMe(email: string, remember: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
  if (remember) {
    localStorage.setItem(EMAIL_KEY, email.trim());
  } else {
    localStorage.removeItem(EMAIL_KEY);
  }
}
