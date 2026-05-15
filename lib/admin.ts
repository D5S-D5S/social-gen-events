const BUILT_IN_ADMIN_EMAILS = [
  "daejuantd@gmail.com",
  "rominasilvetti95@gmail.com",
];

export const ADMIN_EMAILS = Array.from(
  new Set([
    ...BUILT_IN_ADMIN_EMAILS,
    ...(process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  ])
);

export function isAdminEmail(email?: string | null) {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}
