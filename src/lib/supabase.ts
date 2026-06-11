import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey);

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export type Role = "resident" | "board_member" | "chair" | "president" | "admin";
export type BookingStatus = "pending" | "approved" | "rejected" | "cancelled";

export type Profile = {
  id: string;
  display_name: string | null;
  role: Role;
  building: string | null;
  unit_number: string | null;
  phone: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  parking_application_blocked?: boolean;
  parking_application_blocked_reason?: string | null;
};
