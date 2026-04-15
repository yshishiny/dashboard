import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, BarChart3, Calendar, CheckCircle2, ChevronDown, ChevronRight,
  ChevronUp, Clock, Edit3, Filter, Flag, ListTodo, Loader2, LogOut, Mail,
  Menu, MoreVertical, Phone, Plus, Search, Settings, Share2, ShieldCheck,
  Trash2, UserPlus, Users, X
} from "lucide-react";
import { supabase, hasSupabaseEnv } from "./supabase";

// ─── Mobile-Optimized Constants ──────────────────────────────────────────────
const STATUS_CONFIG = {
  "On Track": { 
    color: "emerald", 
    bg: "bg-emerald-500", 
    text: "text-emerald-700", 
    badge: "bg-emerald-100",
    ring: "ring-emerald-200",
    glow: "shadow-emerald-100"
  },
  "At Risk": { 
    color: "amber", 
    bg: "bg-amber-500", 
    text: "text-amber-700", 
    badge: "bg-amber-100",
    ring: "ring-amber-200",
    glow: "shadow-amber-100"
  },
  "Critical": { 
    color: "rose", 
    bg: "bg-rose-500", 
    text: "text-rose-700", 
    badge: "bg-rose-100",
    ring: "ring-rose-200",
    glow: "shadow-rose-100"
  }
};

const MILESTONE_STATUS = {
  done: { label: "Done", dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700" },
  "in-progress": { label: "In Progress", dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700" },
  upcoming: { label: "Upcoming", dot: "bg-slate-300", badge: "bg-slate-100 text-slate-600" }
};

// ─── Demo Data (for offline mode) ─────────────────────────────────────────────
const DEMO_PROFILES = [
  { id: "demo-admin", email: "admin@demo.com", full_name: "Admin User", role: "admin" },
  { id: "demo-user", email: "user@demo.com", full_name: "Regular User", role: "contributor" }
];

const DEMO_PILLARS = [
  { 
    id: "p1", 
    title: "Research Paper", 
    objective: "Complete literature review and draft methodology section",
    target: "Submit first draft by end of month",
    due_date: "2026-04-30", 
    owner_id: "demo-admin",
    progress_override: null
  },
  { 
    id: "p2", 
    title: "Mobile App Project", 
    objective: "Develop and launch the new mobile application",
    target: "Beta release with core features",
    due_date: "2026-05-15", 
    owner_id: "demo-admin",
    progress_override: null
  }
];

const DEMO_MILESTONES = [
  { id: "m1", pillar_id: "p1", name: "Literature Review", status: "done", due_date: "2026-04-15", notes: "" },
  { id: "m2", pillar_id: "p1", name: "Methodology Draft", status: "in-progress", due_date: "2026-04-25", notes: "" },
  { id: "m3", pillar_id: "p1", name: "Results Section", status: "upcoming", due_date: "2026-04-30", notes: "" },
  { id: "m4", pillar_id: "p2", name: "UI Design", status: "done", due_date: "2026-04-20", notes: "" },
  { id: "m5", pillar_id: "p2", name: "Backend API", status: "in-progress", due_date: "2026-05-01", notes: "" },
  { id: "m6", pillar_id: "p2", name: "Testing", status: "upcoming", due_date: "2026-05-10", notes: "" }
];

// ─── Utility Functions ────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr + "T00:00:00");
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  return diff;
}

function calculateProgress(milestones) {
  if (!milestones || milestones.length === 0) return 0;
  const total = milestones.length;
  const done = milestones.filter(m => m.status === "done").length;
  const inProgress = milestones.filter(m => m.status === "in-progress").length;
  const weighted = done + (inProgress * 0.5);
  return Math.round((weighted / total) * 100);
}

function determineStatus(dueDate, progress) {
  const days = daysUntil(dueDate);
  if (days === null) return "On Track";
  if (days < 0 && progress < 100) return "Critical";
  if (days <= 7 && progress < 80) return "Critical";
  if (days <= 14 && progress < 60) return "At Risk";
  return "On Track";
}

// ─── Mobile Bottom Sheet Component ───────────────────────────────────────────
function BottomSheet({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:flex lg:items-center lg:justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      
      {/* Sheet */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-hidden lg:relative lg:rounded-3xl lg:max-w-lg lg:max-h-[85vh]"
      >
        {/* Handle (mobile only) */}
        <div className="lg:hidden flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-6 py-4" style={{ maxHeight: "calc(90vh - 120px)" }}>
          {children}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Action Menu Component ────────────────────────────────────────────────────
function ActionMenu({ isOpen, onClose, actions }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/20"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        className="absolute right-4 top-16 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden min-w-[200px]"
      >
        {actions.map((action, idx) => (
          <button
            key={idx}
            onClick={() => { action.onClick(); onClose(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition ${
              action.danger ? "text-rose-600" : "text-slate-700"
            } ${idx > 0 ? "border-t border-slate-100" : ""}`}
          >
            {action.icon}
            <span className="font-medium">{action.label}</span>
          </button>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Mobile Pillar Card (Accordion Style) ────────────────────────────────────
function MobilePillarCard({ pillar, milestones, isExpanded, onToggle, onEdit, onDelete, onShare, canEdit }) {
  const progress = pillar.progress_override ?? calculateProgress(milestones);
  const status = determineStatus(pillar.due_date, progress);
  const statusCfg = STATUS_CONFIG[status];
  const days = daysUntil(pillar.due_date);
  
  const [showActions, setShowActions] = useState(false);

  const actions = canEdit ? [
    { icon: <Edit3 className="w-4 h-4" />, label: "Edit", onClick: onEdit },
    { icon: <Share2 className="w-4 h-4" />, label: "Share", onClick: onShare },
    { icon: <Trash2 className="w-4 h-4" />, label: "Delete", onClick: onDelete, danger: true }
  ] : [];

  return (
    <>
      <motion.div
        layout
        className={`bg-white rounded-2xl border-2 border-l-4 ${statusCfg.ring} border-${statusCfg.color}-500 shadow-sm overflow-hidden`}
      >
        {/* Header - Always Visible */}
        <div
          onClick={onToggle}
          className="p-4 cursor-pointer active:bg-slate-50 transition"
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-slate-900 mb-1 leading-tight">
                {pillar.title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(pillar.due_date)}</span>
                {days !== null && (
                  <span className={`font-semibold ${
                    days < 0 ? "text-rose-600" : days <= 7 ? "text-amber-600" : "text-slate-600"
                  }`}>
                    {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusCfg.badge} ${statusCfg.text} ring-1 ${statusCfg.ring}`}>
                {status}
              </span>
              {canEdit && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowActions(true); }}
                  className="p-2 hover:bg-slate-100 rounded-full transition"
                >
                  <MoreVertical className="w-5 h-5 text-slate-600" />
                </button>
              )}
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-slate-400" />
              </motion.div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">{milestones.length} milestones</span>
              <span className="font-bold text-slate-900">{progress}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={`h-full ${statusCfg.bg}`}
              />
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-slate-100"
            >
              <div className="p-4 space-y-4">
                {/* Objective & Target */}
                {pillar.objective && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                      Objective
                    </p>
                    <p className="text-sm text-slate-700">{pillar.objective}</p>
                  </div>
                )}
                
                {pillar.target && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                      Target
                    </p>
                    <p className="text-sm text-slate-700">{pillar.target}</p>
                  </div>
                )}

                {/* Milestones */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Milestones ({milestones.length})
                  </p>
                  <div className="space-y-2">
                    {milestones.map(m => {
                      const mStatus = MILESTONE_STATUS[m.status];
                      return (
                        <div key={m.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                          <div className={`w-2 h-2 rounded-full ${mStatus.dot} mt-1.5 flex-shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-slate-900">{m.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${mStatus.badge}`}>
                                {mStatus.label}
                              </span>
                              {m.due_date && (
                                <span className="text-xs text-slate-500">
                                  {formatDate(m.due_date)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <ActionMenu isOpen={showActions} onClose={() => setShowActions(false)} actions={actions} />
    </>
  );
}

// ─── Auth Screen (Mobile-Optimized) ──────────────────────────────────────────
function AuthScreen({ onDemoMode, onAuthenticated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!supabase) return;
    
    setLoading(true);
    setMessage("");
    
    const result = password
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signInWithOtp({ email });
    
    setLoading(false);
    
    if (result.error) {
      setMessage(result.error.message);
    } else if (!password) {
      setMessage("✅ Magic link sent! Check your email.");
    }
  };

  useEffect(() => {
    if (!supabase) return;
    
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) onAuthenticated(data.session.user);
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) onAuthenticated(session.user);
    });
    
    return () => subscription.unsubscribe();
  }, [onAuthenticated]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-4">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Project Pillars</h1>
          <p className="text-slate-300">Track milestones, manage deadlines</p>
        </div>

        {/* Sign In Card */}
        <div className="bg-white rounded-3xl p-6 shadow-2xl mb-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-slate-100 rounded-2xl">
              <ShieldCheck className="w-6 h-6 text-slate-700" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Sign In</h2>
              <p className="text-sm text-slate-500">Password or magic link</p>
            </div>
          </div>

          {hasSupabaseEnv ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-400 text-base"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Password <span className="text-slate-400 font-normal">(optional for magic link)</span>
                </label>
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-400 text-base"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-semibold hover:bg-slate-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : password ? (
                  <ShieldCheck className="w-5 h-5" />
                ) : (
                  <Mail className="w-5 h-5" />
                )}
                {password ? "Sign In" : "Send Magic Link"}
              </button>

              {message && (
                <p className={`text-sm text-center ${message.startsWith("✅") ? "text-emerald-600" : "text-rose-600"}`}>
                  {message}
                </p>
              )}
            </form>
          ) : (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-800">
              Supabase not configured. Use demo mode below.
            </div>
          )}
        </div>

        {/* Demo Mode Button */}
        <button
          onClick={onDemoMode}
          className="w-full py-4 bg-white/10 backdrop-blur-sm text-white rounded-2xl font-semibold hover:bg-white/20 transition flex items-center justify-center gap-2 border border-white/20"
        >
          <Flag className="w-5 h-5" />
          Continue in Demo Mode
        </button>
      </div>
    </div>
  );
}

// ─── Create/Edit Pillar Form ─────────────────────────────────────────────────
function PillarForm({ isOpen, onClose, onSubmit, initialData }) {
  const [formData, setFormData] = useState({
    title: "",
    objective: "",
    target: "",
    due_date: "",
    progress_override: ""
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        objective: initialData.objective || "",
        target: initialData.target || "",
        due_date: initialData.due_date || "",
        progress_override: initialData.progress_override ?? ""
      });
    } else {
      setFormData({ title: "", objective: "", target: "", due_date: "", progress_override: "" });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Pillar" : "New Pillar"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Research Paper"
            required
            className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-400 text-base"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Objective</label>
          <textarea
            value={formData.objective}
            onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
            placeholder="What are you trying to achieve?"
            rows="3"
            className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-400 text-base resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Target</label>
          <textarea
            value={formData.target}
            onChange={(e) => setFormData({ ...formData, target: e.target.value })}
            placeholder="Concrete deliverable expected"
            rows="3"
            className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-400 text-base resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Due Date</label>
          <input
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-400 text-base"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Progress Override (%)
            <span className="text-slate-400 font-normal ml-2">Leave blank for auto-calc</span>
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={formData.progress_override}
            onChange={(e) => setFormData({ ...formData, progress_override: e.target.value })}
            placeholder="0-100"
            className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-400 text-base"
          />
        </div>

        <button
          type="submit"
          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-semibold hover:bg-slate-800 transition mt-6"
        >
          {initialData ? "Update Pillar" : "Create Pillar"}
        </button>
      </form>
    </BottomSheet>
  );
}

// ─── Create/Edit Milestone Form ──────────────────────────────────────────────
function MilestoneForm({ isOpen, onClose, onSubmit, pillars, initialData }) {
  const [formData, setFormData] = useState({
    pillar_id: "",
    name: "",
    status: "upcoming",
    due_date: "",
    notes: ""
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        pillar_id: initialData.pillar_id || "",
        name: initialData.name || "",
        status: initialData.status || "upcoming",
        due_date: initialData.due_date || "",
        notes: initialData.notes || ""
      });
    } else {
      setFormData({
        pillar_id: pillars[0]?.id || "",
        name: "",
        status: "upcoming",
        due_date: "",
        notes: ""
      });
    }
  }, [initialData, pillars, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Milestone" : "New Milestone"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Pillar *</label>
          <select
            value={formData.pillar_id}
            onChange={(e) => setFormData({ ...formData, pillar_id: e.target.value })}
            required
            className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-400 text-base"
          >
            {pillars.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Milestone Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Literature Review"
            required
            className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-400 text-base"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-400 text-base"
          >
            <option value="upcoming">Upcoming</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Due Date</label>
          <input
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-400 text-base"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional context..."
            rows="3"
            className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-400 text-base resize-none"
          />
        </div>

        <button
          type="submit"
          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-semibold hover:bg-slate-800 transition mt-6"
        >
          {initialData ? "Update Milestone" : "Create Milestone"}
        </button>
      </form>
    </BottomSheet>
  );
}

// ─── Main App Component ──────────────────────────────────────────────────────
export default function App() {
  // State
  const [demoMode, setDemoMode] = useState(!hasSupabaseEnv);
  const [user, setUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [pillars, setPillars] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPillar, setExpandedPillar] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Modal states
  const [showPillarForm, setShowPillarForm] = useState(false);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [editingPillar, setEditingPillar] = useState(null);
  const [editingMilestone, setEditingMilestone] = useState(null);

  const currentProfile = profiles.find(p => p.id === user?.id) || 
    (demoMode ? DEMO_PROFILES[0] : null);
  const isAdmin = currentProfile?.role === "admin";

  // ─── Demo Mode Setup ────────────────────────────────────────────────────────
  const handleDemoMode = () => {
    setDemoMode(true);
    setUser(DEMO_PROFILES[0]);
    setProfiles(DEMO_PROFILES);
    setPillars(DEMO_PILLARS);
    setMilestones(DEMO_MILESTONES);
    setLoading(false);
  };

  // ─── Authentication ─────────────────────────────────────────────────────────
  const handleAuthenticated = (authUser) => {
    setUser(authUser);
    setDemoMode(false);
  };

  const handleSignOut = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setDemoMode(false);
    setPillars([]);
    setMilestones([]);
    setProfiles([]);
  };

  // ─── Load Data (Supabase) ───────────────────────────────────────────────────
  useEffect(() => {
    if (demoMode || !user || !supabase) return;

    (async () => {
      setLoading(true);

      const [profilesRes, pillarsRes, milestonesRes] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("pillars").select("*"),
        supabase.from("milestones").select("*")
      ]);

      setProfiles(profilesRes.data || []);
      setPillars(pillarsRes.data || []);
      setMilestones(milestonesRes.data || []);
      setLoading(false);

      // Real-time subscriptions
      const pillarsSub = supabase
        .channel("pillars")
        .on("postgres_changes", { event: "*", schema: "public", table: "pillars" }, async () => {
          const { data } = await supabase.from("pillars").select("*");
          setPillars(data || []);
        })
        .subscribe();

      const milestonesSub = supabase
        .channel("milestones")
        .on("postgres_changes", { event: "*", schema: "public", table: "milestones" }, async () => {
          const { data } = await supabase.from("milestones").select("*");
          setMilestones(data || []);
        })
        .subscribe();

      return () => {
        pillarsSub.unsubscribe();
        milestonesSub.unsubscribe();
      };
    })();
  }, [user, demoMode]);

  // ─── CRUD Operations ────────────────────────────────────────────────────────
  const handleCreatePillar = async (data) => {
    const newPillar = {
      ...data,
      owner_id: user.id,
      progress_override: data.progress_override ? parseInt(data.progress_override) : null
    };

    if (demoMode) {
      setPillars([...pillars, { ...newPillar, id: `p${Date.now()}` }]);
    } else if (supabase) {
      await supabase.from("pillars").insert([newPillar]);
    }
  };

  const handleUpdatePillar = async (data) => {
    const updated = {
      ...data,
      progress_override: data.progress_override ? parseInt(data.progress_override) : null
    };

    if (demoMode) {
      setPillars(pillars.map(p => p.id === editingPillar.id ? { ...p, ...updated } : p));
    } else if (supabase) {
      await supabase.from("pillars").update(updated).eq("id", editingPillar.id);
    }
    setEditingPillar(null);
  };

  const handleDeletePillar = async (id) => {
    if (!confirm("Delete this pillar and all its milestones?")) return;

    if (demoMode) {
      setPillars(pillars.filter(p => p.id !== id));
      setMilestones(milestones.filter(m => m.pillar_id !== id));
    } else if (supabase) {
      await supabase.from("milestones").delete().eq("pillar_id", id);
      await supabase.from("pillars").delete().eq("id", id);
    }
  };

  const handleCreateMilestone = async (data) => {
    if (demoMode) {
      setMilestones([...milestones, { ...data, id: `m${Date.now()}` }]);
    } else if (supabase) {
      await supabase.from("milestones").insert([data]);
    }
  };

  const handleUpdateMilestone = async (data) => {
    if (demoMode) {
      setMilestones(milestones.map(m => m.id === editingMilestone.id ? { ...m, ...data } : m));
    } else if (supabase) {
      await supabase.from("milestones").update(data).eq("id", editingMilestone.id);
    }
    setEditingMilestone(null);
  };

  // ─── Filtered Pillars ───────────────────────────────────────────────────────
  const filteredPillars = pillars.filter(p => {
    const pMilestones = milestones.filter(m => m.pillar_id === p.id);
    const progress = p.progress_override ?? calculateProgress(pMilestones);
    const status = determineStatus(p.due_date, progress);

    const matchesSearch = !searchQuery || 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.objective?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || status === statusFilter;

    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    const aMilestones = milestones.filter(m => m.pillar_id === a.id);
    const bMilestones = milestones.filter(m => m.pillar_id === b.id);
    const aStatus = determineStatus(a.due_date, a.progress_override ?? calculateProgress(aMilestones));
    const bStatus = determineStatus(b.due_date, b.progress_override ?? calculateProgress(bMilestones));
    
    const priority = { "Critical": 0, "At Risk": 1, "On Track": 2 };
    return (priority[aStatus] || 3) - (priority[bStatus] || 3);
  });

  // ─── Render Guards ──────────────────────────────────────────────────────────
  if (!user && !demoMode) {
    return <AuthScreen onDemoMode={handleDemoMode} onAuthenticated={handleAuthenticated} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">Loading your pillars...</p>
        </div>
      </div>
    );
  }

  // ─── Main UI ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-900">Project Pillars</h1>
              <p className="text-xs text-slate-500">{currentProfile?.full_name || currentProfile?.email}</p>
            </div>
          </div>

          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-slate-100 rounded-xl transition"
          >
            <Menu className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        {/* Search & Filter */}
        <div className="px-4 pb-3 space-y-2">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pillars..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-300 text-base"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
            {["all", "Critical", "At Risk", "On Track"].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                  statusFilter === status
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 border border-slate-200"
                }`}
              >
                {status === "all" ? "All" : status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pillars List */}
      <div className="px-4 py-4 space-y-3 pb-24">
        <AnimatePresence>
          {filteredPillars.length === 0 ? (
            <div className="text-center py-16">
              <ListTodo className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No pillars found</p>
              <p className="text-sm text-slate-400 mt-1">Create your first pillar to get started</p>
            </div>
          ) : (
            filteredPillars.map(pillar => {
              const pillarMilestones = milestones.filter(m => m.pillar_id === pillar.id);
              const canEdit = pillar.owner_id === user.id || isAdmin;

              return (
                <MobilePillarCard
                  key={pillar.id}
                  pillar={pillar}
                  milestones={pillarMilestones}
                  isExpanded={expandedPillar === pillar.id}
                  onToggle={() => setExpandedPillar(expandedPillar === pillar.id ? null : pillar.id)}
                  onEdit={() => { setEditingPillar(pillar); setShowPillarForm(true); }}
                  onDelete={() => handleDeletePillar(pillar.id)}
                  onShare={() => {/* TODO: Share modal */}}
                  canEdit={canEdit}
                />
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => { setEditingPillar(null); setShowPillarForm(true); }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-slate-900 text-white rounded-full shadow-lg hover:shadow-xl active:scale-95 transition flex items-center justify-center z-30"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modals */}
      <PillarForm
        isOpen={showPillarForm}
        onClose={() => { setShowPillarForm(false); setEditingPillar(null); }}
        onSubmit={editingPillar ? handleUpdatePillar : handleCreatePillar}
        initialData={editingPillar}
      />

      <MilestoneForm
        isOpen={showMilestoneForm}
        onClose={() => { setShowMilestoneForm(false); setEditingMilestone(null); }}
        onSubmit={editingMilestone ? handleUpdateMilestone : handleCreateMilestone}
        pillars={pillars}
        initialData={editingMilestone}
      />

      {/* Menu */}
      <AnimatePresence>
        {showMenu && (
          <ActionMenu
            isOpen={showMenu}
            onClose={() => setShowMenu(false)}
            actions={[
              {
                icon: <Plus className="w-5 h-5" />,
                label: "New Milestone",
                onClick: () => { setEditingMilestone(null); setShowMilestoneForm(true); }
              },
              {
                icon: <Settings className="w-5 h-5" />,
                label: "Settings",
                onClick: () => {/* TODO */}
              },
              {
                icon: <LogOut className="w-5 h-5" />,
                label: "Sign Out",
                onClick: handleSignOut,
                danger: true
              }
            ]}
          />
        )}
      </AnimatePresence>

      {/* Demo Mode Badge */}
      {demoMode && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg z-50">
          <Flag className="w-4 h-4" />
          Demo Mode
        </div>
      )}
    </div>
  );
}
