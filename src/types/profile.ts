export type UserRole = "admin" | "ahli_gizi" | "ppm";

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: UserRole | null;
  created_at: string;
};
