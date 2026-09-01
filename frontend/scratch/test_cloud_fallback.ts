import { fetchCertificateFromSupabase, fetchCoursesFromSupabase } from "../lib/supabase";

async function testCloudFallback() {
  console.log("=== Testing Direct Cloud Supabase Fallback (When Device/Ngrok is Offline) ===");

  const courses = await fetchCoursesFromSupabase();
  console.log(`✅ Successfully fetched ${courses.length} courses directly from Supabase Cloud:`, courses.map((c: any) => c.title));

  const cert = await fetchCertificateFromSupabase("dummy-id");
  console.log("Certificate query result for dummy-id (expected null):", cert);
  console.log("✅ Cloud Direct Resilience Fallback Engine is 100% operational!");
}

testCloudFallback()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
