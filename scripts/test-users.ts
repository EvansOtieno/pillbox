/**
 * Accounts for LOCAL development and the Playwright tests only. They are written to
 * supabase/seed.test-users.sql, which `supabase db reset` loads into the local database.
 * Never load that file into the cloud project (Milestone 5 uses its own demo account).
 */
export const TEST_USERS = {
  owner: {
    id: "00000000-0000-4000-8000-00000000a0a1",
    email: "owner@afya-corner.test",
    password: "local-owner-2026",
    fullName: "Test Owner",
    role: "owner",
  },
  staff: {
    id: "00000000-0000-4000-8000-00000000a0a2",
    email: "staff@afya-corner.test",
    password: "local-staff-2026",
    fullName: "Test Pharmacist",
    role: "staff",
  },
} as const;
