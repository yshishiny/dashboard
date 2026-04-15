// netlify/functions/daily-digest.mjs
// Netlify Scheduled Function — sends daily email digest via Resend
// Schedule: every day at 7:00 AM UTC
//
// Env vars needed in Netlify Dashboard → Site settings → Environment variables:
//   SUPABASE_URL          (same as VITE_SUPABASE_URL)
//   SUPABASE_SERVICE_ROLE_KEY
//   RESEND_API_KEY
//   DIGEST_FROM_EMAIL     e.g. "digest@yourdomain.com" (must be a verified Resend domain)

import { createClient } from "@supabase/supabase-js";

export default async () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.DIGEST_FROM_EMAIL || "digest@projectpillars.app";

  if (!supabaseUrl || !supabaseKey) {
    console.error("[digest] Missing Supabase env vars");
    return new Response("Missing Supabase config", { status: 500 });
  }
  if (!resendKey) {
    console.log("[digest] RESEND_API_KEY not set — skipping");
    return new Response("RESEND_API_KEY not configured", { status: 200 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const today = new Date().toISOString().split("T")[0];
  const in7Days = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  try {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .not("email", "is", null);

    if (!profiles?.length) {
      console.log("[digest] No profiles found");
      return new Response("No profiles", { status: 200 });
    }

    const { data: allMilestones } = await supabase
      .from("milestones")
      .select("*, pillars!inner(name, icon, owner_id, color)")
      .lte("due_date", in7Days)
      .neq("status", "done");

    let sent = 0;
    for (const profile of profiles) {
      const mine = (allMilestones || []).filter(
        (m) => m.assigned_to === profile.id || m.pillars?.owner_id === profile.id
      );
      if (!mine.length) continue;

      const overdue   = mine.filter((m) => m.due_date < today);
      const upcoming  = mine.filter((m) => m.due_date >= today);
      const doFirst   = mine.filter((m) => m.urgent && m.important);

      const milestoneRow = (m) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f0f9">
            <span style="font-weight:700;color:#1e1b4b">${m.pillars?.icon || ""} ${m.name}</span><br>
            <span style="font-size:11px;color:#6b7280">${m.pillars?.name || ""}</span>
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f0f9;white-space:nowrap">
            <span style="font-size:12px;font-weight:600;color:${m.due_date < today ? "#dc2626" : "#7c3aed"}">${m.due_date || "—"}</span>
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f0f9">
            ${m.urgent && m.important ? '<span style="background:#fee2e2;color:#991b1b;font-size:10px;font-weight:700;padding:2px 6px;border-radius:99px">DO FIRST</span>' :
              !m.urgent && m.important ? '<span style="background:#dbeafe;color:#1e40af;font-size:10px;font-weight:700;padding:2px 6px;border-radius:99px">SCHEDULE</span>' :
              m.urgent && !m.important ? '<span style="background:#fef3c7;color:#92400e;font-size:10px;font-weight:700;padding:2px 6px;border-radius:99px">DELEGATE</span>' :
              '<span style="background:#f1f5f9;color:#64748b;font-size:10px;font-weight:700;padding:2px 6px;border-radius:99px">ELIMINATE</span>'}
          </td>
        </tr>`;

      const section = (title, items, color) => items.length ? `
        <h3 style="color:${color};margin:20px 0 8px;font-size:14px">${title}</h3>
        <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb">
          <thead><tr>
            <th style="padding:8px 12px;background:#f9fafb;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase">Milestone</th>
            <th style="padding:8px 12px;background:#f9fafb;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase">Due</th>
            <th style="padding:8px 12px;background:#f9fafb;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase">Priority</th>
          </tr></thead>
          <tbody>${items.map(milestoneRow).join("")}</tbody>
        </table>` : "";

      const html = `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f3ff;margin:0;padding:20px">
<div style="max-width:600px;margin:0 auto">
  <div style="background:linear-gradient(135deg,#7c3aed,#db2777);padding:24px;border-radius:12px;margin-bottom:20px;text-align:center">
    <h1 style="color:white;margin:0;font-size:22px">📋 Daily Project Digest</h1>
    <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px">${new Date().toDateString()}</p>
  </div>
  <div style="background:white;padding:24px;border-radius:12px;border:1px solid #e5e7eb">
    <p style="margin:0 0 16px;color:#374151">Hi <strong>${profile.full_name || profile.email}</strong>, here's your project snapshot:</p>
    ${section("🔴 Do First — Urgent & Important", doFirst, "#7c3aed")}
    ${section("⚠️ Overdue", overdue, "#dc2626")}
    ${section("📅 Due This Week", upcoming.filter(m => !doFirst.includes(m)), "#2563eb")}
    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #f1f5f9;text-align:center">
      <a href="https://roumi0212.netlify.app" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#db2777);color:white;text-decoration:none;padding:10px 24px;border-radius:99px;font-weight:700;font-size:14px">Open Dashboard →</a>
    </div>
  </div>
  <p style="text-align:center;font-size:11px;color:#9ca3af;margin-top:12px">Project Pillars — You're receiving this because you have milestones due.</p>
</div></body></html>`;

      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: profile.email,
          subject: `📋 Project Digest — ${overdue.length ? `${overdue.length} overdue · ` : ""}${upcoming.length} due this week`,
          html,
        }),
      });

      if (emailRes.ok) {
        console.log(`[digest] ✓ Sent to ${profile.email}`);
        sent++;
      } else {
        console.error(`[digest] ✗ Failed for ${profile.email}:`, await emailRes.text());
      }
    }

    return new Response(JSON.stringify({ sent }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[digest] Error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

export const config = {
  schedule: "0 7 * * *", // 7:00 AM UTC daily
};
