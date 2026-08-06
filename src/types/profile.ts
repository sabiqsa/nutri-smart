// 5 roles: 4 operational (spec) + admin (bootstrapping/user management,
// not one of the spec's 4 — see get-profile.ts).
export type UserRole = "perawat" | "ahli_gizi" | "produksi" | "distribusi" | "admin";

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: UserRole | null;
  created_at: string;
};
