import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cron from "node-cron";
import { createClient } from "@supabase/supabase-js";
import { formatInTimeZone } from "date-fns-tz";
import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase Setup
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Regular client (anon key) used by notification engine
const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

// Admin client using service role key (bypasses RLS)
const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Twilio Setup
const twilioSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
const twilioClient = (twilioSid && twilioSid.startsWith('AC') && twilioAuthToken) ? twilio(twilioSid, twilioAuthToken) : null;

app.use(express.static(path.join(__dirname, "dist")));

// Notification Engine logic
const checkNotifications = async () => {
  console.log("[Cron] Checking for upcoming deadlines...");
  
  try {
    // 1. Get all profiles with notification settings
    const { data: profiles, error: pError } = await supabase
      .from("profiles")
      .select("*")
      .not("phone_number", "is", null);

    if (pError) throw pError;

    for (const profile of profiles) {
      const tz = profile.timezone || "UTC";
      const nowInTz = new Date();
      const currentHour = formatInTimeZone(nowInTz, tz, "HH:00:00");
      const prefHour = profile.notify_time_pref || "09:00:00";

      // If it's the user's preferred notification hour
      if (currentHour === prefHour) {
        console.log(`[Cron] Notifying ${profile.email} (${tz}) at ${currentHour}`);
        
        // Find milestones due within next 48 hours for this user
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 2);
        const tomorrowStr = tomorrow.toISOString().split("T")[0];

        const { data: milestones, error: mError } = await supabase
          .from("milestones")
          .select("*, pillars!inner(*)")
          .eq("pillars.owner_id", profile.id)
          .lte("due_date", tomorrowStr)
          .neq("status", "done");

        if (mError) {
          console.error(`[Cron] Error fetching milestones for ${profile.email}:`, mError);
          continue;
        }

        for (const m of milestones) {
          const message = `Reminder: "${m.name}" for pillar "${m.pillars.title}" is due soon (${m.due_date}).`;
          
          // Avoid duplicate notifications for same milestone in same hour
          const { data: existing } = await supabase
            .from("notifications")
            .select("id")
            .eq("profile_id", profile.id)
            .eq("milestone_id", m.id)
            .gte("sent_at", new Date(Date.now() - 3600000).toISOString())
            .maybeSingle();

          if (!existing) {
            const { data: nData, error: nError } = await supabase
              .from("notifications")
              .insert([{
                profile_id: profile.id,
                milestone_id: m.id,
                message,
                status: "pending"
              }])
              .select()
              .single();

            if (nError) {
              console.error(`[Cron] Database Error for ${profile.email}:`, nError);
              continue;
            }

            console.log(`[Cron] Queued notification for ${profile.email}: ${message}`);

            // Dispatch SMS if Twilio is configured
            if (twilioClient && profile.phone_number) {
              try {
                const result = await twilioClient.messages.create({
                  body: message,
                  from: twilioFrom,
                  to: profile.phone_number
                });
                
                await supabase
                  .from("notifications")
                  .update({ status: "sent", sent_at: new Date().toISOString() })
                  .eq("id", nData.id);
                  
                console.log(`[SMS] Message sent SID: ${result.sid}`);
              } catch (smsErr) {
                console.error(`[SMS] Failed to send to ${profile.phone_number}:`, smsErr);
                await supabase
                  .from("notifications")
                  .update({ status: "failed" })
                  .eq("id", nData.id);
              }
            } else {
              console.log(`[SMS] Skipping (Client not configured or phone missing)`);
              // Mark as "notified" (or stay pending for next check if it was supposed to be SMS)
              // Actually, since we logged it in DB, it's tracked.
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("[Cron] Critical Error:", err);
  }
};

// Run every hour at the top of the hour
cron.schedule("0 * * * *", checkNotifications);

// Manual trigger for testing (Optional)
app.get("/api/trigger-notifications", async (req, res) => {
  await checkNotifications();
  res.json({ status: "Notification check triggered" });
});

// Test SMS ping utility
app.post("/api/test-sms", express.json(), async (req, res) => {
  const { phone_number } = req.body;
  if (!phone_number) {
    return res.status(400).json({ error: "Phone number is required" });
  }
  
  if (!twilioClient) {
    return res.status(500).json({ error: "Twilio client is not configured. Please check your API keys." });
  }

  try {
    const result = await twilioClient.messages.create({
      body: "Hello from the Marium Dashboard! Your SMS alerts are active.",
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone_number
    });
    res.json({ success: true, sid: result.sid });
  } catch (err) {
    console.error("[SMS TEST ERROR]:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/users", express.json(), async (req, res) => {
  const { email, password, full_name, phone_number, notify_time_pref } = req.body;

  if (!supabaseAdmin) {
    console.error("[Admin Users] SUPABASE_SERVICE_ROLE_KEY is not set!");
    return res.status(500).json({
      success: false,
      error: "Server misconfiguration: SUPABASE_SERVICE_ROLE_KEY is missing. Please add it to your Railway environment variables."
    });
  }

  if (!email || !password) {
    return res.status(400).json({ success: false, error: "Email and Password are required." });
  }

  try {
    console.log(`[Admin Users] Creating auth user: ${email}`);
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name || email }
    });

    if (authError) {
      console.error(`[Admin Users] Auth error:`, authError);
      // "User not allowed" means Supabase Auth has "Allow new users to sign up" disabled
      let friendlyMsg = authError.message;
      if (authError.message?.toLowerCase().includes("not allowed") || authError.code === "user_not_allowed") {
        friendlyMsg = `Supabase Auth is blocking new users (error: "${authError.message}"). ` +
          `Fix: Go to Supabase Dashboard → Authentication → Providers → Email → ` +
          `enable "Allow new users to sign up". Or check Authentication → Configuration → ` +
          `"Disable email confirmations" if applicable.`;
      }
      return res.status(400).json({ success: false, error: friendlyMsg, code: authError.code });
    }

    const newUser = authData.user;
    console.log(`[Admin Users] Auth user created: ${newUser.id}`);

    // Explicitly upsert the profile row — the handle_new_user trigger
    // does NOT always fire when user is created via the Admin API.
    const isAdmin = email.toLowerCase() === 'shishiny@gmail.com';
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: newUser.id,
        email: email,
        full_name: full_name || email,
        role: isAdmin ? 'admin' : 'contributor',
        ...(phone_number && { phone_number }),
        ...(notify_time_pref && { notify_time_pref })
      }, { onConflict: 'id' });

    if (profileError) {
      // Profile insert failed — auth user still created, log the issue
      console.error(`[Admin Users] Profile upsert error (auth user was created):`, profileError);
      return res.status(207).json({
        success: true,
        warning: `User auth account created but profile row failed: ${profileError.message}. The user may need to log in once to trigger profile creation.`,
        user: newUser
      });
    }

    console.log(`[Admin Users] Profile upserted for: ${email}`);
    res.json({ success: true, user: newUser });
  } catch (err) {
    console.error(`[Admin Users] Unexpected error:`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/test-sms", express.json(), async (req, res) => {
  const { phone_number } = req.body;
  console.log(`[Test SMS] Request to send message to ${phone_number}`);
  
  if (!twilioClient) {
    return res.status(500).json({ success: false, error: "Twilio credentials not configured in Railway settings." });
  }

  if (!phone_number) {
    return res.status(400).json({ success: false, error: "Phone number is required." });
  }

  try {
    const result = await twilioClient.messages.create({
      body: "🔔 Dashboard: This is a test notification. Your SMS integration is now live!",
      from: twilioFrom,
      to: phone_number
    });
    console.log(`[Test SMS] Success! SID: ${result.sid}`);
    res.json({ success: true, sid: result.sid });
  } catch (err) {
    console.error(`[Test SMS] Failed:`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Diagnostic endpoint — tells us what environment variables are configured
app.get("/api/diag", (_req, res) => {
  res.json({
    version: "2026-04-14-v2",
    hasSupabaseUrl: Boolean(supabaseUrl),
    hasAnonKey: Boolean(supabaseAnonKey),
    hasServiceKey: Boolean(supabaseServiceKey),
    hasAdminClient: Boolean(supabaseAdmin),
    hasTwilio: Boolean(twilioClient),
    port
  });
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(port, () => {
  console.log(`Project Pillars running on port ${port}`);
  console.log(`Notification cron scheduled (Top of every hour)`);
});
