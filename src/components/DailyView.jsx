import { useState, useEffect, useMemo } from "react";
import { BookOpen, Check, Dumbbell, Moon, Target } from "lucide-react";

// Hardcoded Cairo prayer times for MVP.
// TODO(phase 1b): fetch per-user from Aladhan API based on profile.city.
const PRAYERS_CAIRO = [
  { key: "prayer_fajr",    label: "Fajr",    time: "05:12" },
  { key: "prayer_dhuhr",   label: "Dhuhr",   time: "12:02" },
  { key: "prayer_asr",     label: "Asr",     time: "15:29" },
  { key: "prayer_maghrib", label: "Maghrib", time: "17:55" },
  { key: "prayer_isha",    label: "Isha",    time: "19:21" },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function isSameDate(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function last7DayKeys() {
  const keys = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    keys.push(d.toISOString().slice(0, 10));
  }
  return keys;
}

export default function DailyView({
  user,
  profile,
  pillars = [],
  milestones = [],
  supabase,
  demoMode,
  onCycleMilestoneStatus,
}) {
  const [todayLog, setTodayLog] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const dateISO = todayISO();

  // Load today's log + last 7 days
  useEffect(() => {
    if (demoMode || !user?.id || !supabase) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const sevenBack = new Date();
      sevenBack.setDate(sevenBack.getDate() - 6);
      const since = sevenBack.toISOString().slice(0, 10);

      const { data, error } = await supabase
        .from("daily_log")
        .select("*")
        .eq("user_id", user.id)
        .gte("log_date", since)
        .order("log_date", { ascending: false });

      if (cancelled) return;
      if (error) {
        console.error("daily_log fetch failed:", error);
      } else {
        setRecentLogs(data || []);
        setTodayLog((data || []).find((d) => d.log_date === dateISO) || null);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id, demoMode, supabase, dateISO]);

  // Upsert a single field for today
  const updateField = async (field, value) => {
    if (demoMode || !user?.id || !supabase) {
      // In demo mode, just update local state so the UI reacts
      setTodayLog((prev) => ({ ...(prev || { log_date: dateISO, user_id: user?.id }), [field]: value }));
      return;
    }
    const payload = { user_id: user.id, log_date: dateISO, [field]: value };
    const { data, error } = await supabase
      .from("daily_log")
      .upsert(payload, { onConflict: "user_id,log_date" })
      .select()
      .single();
    if (error) {
      console.error("daily_log upsert failed:", error);
      alert(`Could not save: ${error.message}`);
      return;
    }
    if (data) {
      setTodayLog(data);
      setRecentLogs((prev) => {
        const without = prev.filter((d) => d.log_date !== dateISO);
        return [data, ...without].sort((a, b) => b.log_date.localeCompare(a.log_date));
      });
    }
  };

  // Today's relevant milestones: overdue or due today, not done
  const todaysMilestones = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return milestones
      .filter((m) => m.due_date && m.status !== "done")
      .filter((m) => {
        const due = new Date(m.due_date);
        return due < startOfToday || isSameDate(due, startOfToday);
      })
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  }, [milestones]);

  // Prayer count for today
  const prayersDoneToday = PRAYERS_CAIRO.filter((p) => todayLog && todayLog[p.key]).length;

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-slate-400 text-sm font-medium">
        Loading today…
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="px-4 pt-4">
        <h2 className="text-2xl font-black text-slate-900 leading-tight">
          Today — {today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </h2>
        <p className="text-xs text-slate-500 font-semibold mt-1">
          {profile?.city ? `${profile.city}${profile.country ? `, ${profile.country}` : ""}` : "Set your city in your profile for accurate prayer times"}
        </p>
      </div>

      {/* Prayers */}
      <div className="mx-4 bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-slate-900 text-lg">🕌 Prayers</h3>
          <span className="text-xs font-black text-emerald-600">{prayersDoneToday}/5</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {PRAYERS_CAIRO.map((p) => {
            const done = !!(todayLog && todayLog[p.key]);
            return (
              <button
                key={p.key}
                onClick={() => updateField(p.key, !done)}
                className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${
                  done
                    ? "bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-md"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                <span className="text-xs font-black">{p.label}</span>
                <span className="text-[10px] opacity-80 font-semibold">{p.time}</span>
                {done && <Check className="w-4 h-4" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Essentials */}
      <div className="mx-4 bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
        <h3 className="font-black text-slate-900 text-lg mb-3">📖 Essentials</h3>
        <div className="space-y-2">
          <button
            onClick={() => updateField("quran_done", !todayLog?.quran_done)}
            className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
              todayLog?.quran_done
                ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md"
                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="font-bold flex-1 text-left">Quran</span>
            {todayLog?.quran_done && <Check className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <Dumbbell className="w-5 h-5 text-orange-500 flex-shrink-0" />
            <span className="font-bold flex-1 text-slate-700">Sports</span>
            <input
              type="number" min="0" max="300" step="5"
              value={todayLog?.sports_minutes ?? ""}
              onChange={(e) => updateField("sports_minutes", e.target.value === "" ? null : parseInt(e.target.value, 10))}
              placeholder="0"
              className="w-16 text-center font-bold bg-white border border-slate-200 rounded-lg py-1"
            />
            <span className="text-xs text-slate-500 font-bold">min</span>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <Moon className="w-5 h-5 text-indigo-500 flex-shrink-0" />
            <span className="font-bold flex-1 text-slate-700">Sleep</span>
            <input
              type="number" min="0" max="24" step="0.5"
              value={todayLog?.sleep_hours ?? ""}
              onChange={(e) => updateField("sleep_hours", e.target.value === "" ? null : parseFloat(e.target.value))}
              placeholder="0"
              className="w-16 text-center font-bold bg-white border border-slate-200 rounded-lg py-1"
            />
            <span className="text-xs text-slate-500 font-bold">hrs</span>
          </div>
        </div>
      </div>

      {/* Today's milestones */}
      <div className="mx-4 bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
        <h3 className="font-black text-slate-900 text-lg mb-3 flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-600" />
          Today from your pillars
        </h3>
        {todaysMilestones.length === 0 ? (
          <p className="text-sm text-slate-400 font-medium py-4 text-center">
            Nothing due or overdue. 🎉
          </p>
        ) : (
          <div className="space-y-2">
            {todaysMilestones.map((m) => {
              const pillar = pillars.find((p) => p.id === m.pillar_id);
              const overdue = new Date(m.due_date) < new Date(new Date().setHours(0, 0, 0, 0));
              return (
                <div
                  key={m.id}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                    overdue
                      ? "border-rose-200 bg-rose-50"
                      : "border-amber-200 bg-amber-50"
                  }`}
                >
                  <button
                    onClick={() => onCycleMilestoneStatus?.(m.id)}
                    className="w-7 h-7 rounded-lg border-2 border-slate-300 bg-white flex items-center justify-center flex-shrink-0 hover:border-emerald-500 transition-colors"
                    title="Click to cycle status"
                  >
                    {m.status === "done" && <Check className="w-4 h-4 text-emerald-600" />}
                    {m.status === "in_progress" && <span className="text-blue-600 text-sm font-black">◐</span>}
                    {m.status === "blocked" && <span className="text-rose-600 font-black">✗</span>}
                    {m.status === "not_started" && <span className="text-slate-400 text-xs">○</span>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-slate-800 truncate">{m.name}</div>
                    <div className="text-xs text-slate-500 font-medium truncate">
                      {pillar?.title || "Unknown pillar"} · {overdue ? "Overdue" : "Due today"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 7-day streak strip */}
      <div className="mx-4 bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
        <h3 className="font-black text-slate-900 text-lg mb-3">📊 Last 7 days</h3>
        <div className="grid grid-cols-7 gap-2">
          {last7DayKeys().map((dateKey) => {
            const log = recentLogs.find((l) => l.log_date === dateKey);
            const score = log ? PRAYERS_CAIRO.filter((p) => log[p.key]).length / 5 : 0;
            const d = new Date(dateKey);
            const isToday = dateKey === dateISO;
            return (
              <div key={dateKey} className="flex flex-col items-center gap-1">
                <div className="text-[10px] font-black text-slate-400 uppercase">
                  {d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2)}
                </div>
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-all ${
                    isToday ? "ring-2 ring-offset-2 ring-purple-500" : ""
                  }`}
                  style={{
                    background: score > 0
                      ? `linear-gradient(135deg, rgba(16,185,129,${0.3 + score * 0.7}) 0%, rgba(20,184,166,${0.3 + score * 0.7}) 100%)`
                      : "#f1f5f9",
                    color: score > 0.5 ? "white" : "#64748b",
                  }}
                  title={`${dateKey} · ${log ? PRAYERS_CAIRO.filter((p) => log[p.key]).length : 0}/5 prayers`}
                >
                  {d.getDate()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
