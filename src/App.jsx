import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, BarChart3, Calendar, CheckCircle2, ChevronDown, ChevronRight,
  Clock, Edit3, Filter, Flag, ListTodo, Loader2, LogOut, Mail, Menu,
  MoreVertical, Phone, Plus, Search, Settings, Share2, ShieldCheck,
  Paperclip, Sparkles, Target, Trash2, TrendingUp, Upload, UserPlus, Users, X, Zap
} from "lucide-react";
import { supabase, hasSupabaseEnv } from "./supabase";

// ─── Vibrant Color Palette ────────────────────────────────────────────────────
const STATUS_CONFIG = {
  "On Track": { 
    gradient: "from-emerald-400 to-teal-500",
    bg: "bg-gradient-to-br from-emerald-400 to-teal-500",
    text: "text-emerald-700",
    badge: "bg-gradient-to-r from-emerald-50 to-teal-50",
    ring: "ring-emerald-300",
    glow: "shadow-lg shadow-emerald-200",
    icon: <CheckCircle2 className="w-5 h-5" />
  },
  "At Risk": { 
    gradient: "from-amber-400 to-orange-500",
    bg: "bg-gradient-to-br from-amber-400 to-orange-500",
    text: "text-amber-700",
    badge: "bg-gradient-to-r from-amber-50 to-orange-50",
    ring: "ring-amber-300",
    glow: "shadow-lg shadow-amber-200",
    icon: <AlertTriangle className="w-5 h-5" />
  },
  "Critical": { 
    gradient: "from-rose-500 to-pink-600",
    bg: "bg-gradient-to-br from-rose-500 to-pink-600",
    text: "text-rose-700",
    badge: "bg-gradient-to-r from-rose-50 to-pink-50",
    ring: "ring-rose-300",
    glow: "shadow-lg shadow-rose-200",
    icon: <Zap className="w-5 h-5" />
  }
};

const MILESTONE_STATUS = {
  done: {
    label: "Done",
    gradient: "from-emerald-500 to-teal-600",
    badge: "bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700",
    icon: <CheckCircle2 className="w-4 h-4" />
  },
  in_progress: {
    label: "In Progress",
    gradient: "from-blue-500 to-indigo-600",
    badge: "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700",
    icon: <TrendingUp className="w-4 h-4" />
  },
  not_started: {
    label: "Upcoming",
    gradient: "from-slate-400 to-slate-500",
    badge: "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-600",
    icon: <Clock className="w-4 h-4" />
  },
  blocked: {
    label: "Blocked",
    gradient: "from-rose-500 to-red-600",
    badge: "bg-gradient-to-r from-rose-100 to-red-100 text-rose-700",
    icon: <Clock className="w-4 h-4" />
  }
};
const MILESTONE_STATUS_FALLBACK = MILESTONE_STATUS.not_started;

// ─── Demo Data ────────────────────────────────────────────────────────────────
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
  { id: "m2", pillar_id: "p1", name: "Methodology Draft", status: "in_progress", due_date: "2026-04-25", notes: "" },
  { id: "m3", pillar_id: "p1", name: "Results Section", status: "not_started", due_date: "2026-04-30", notes: "" },
  { id: "m4", pillar_id: "p2", name: "UI Design", status: "done", due_date: "2026-04-20", notes: "" },
  { id: "m5", pillar_id: "p2", name: "Backend API", status: "in_progress", due_date: "2026-05-01", notes: "" },
  { id: "m6", pillar_id: "p2", name: "Testing", status: "not_started", due_date: "2026-05-10", notes: "" }
];

// ─── Utilities ────────────────────────────────────────────────────────────────
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
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

function calculateProgress(milestones) {
  if (!milestones || milestones.length === 0) return 0;
  const total = milestones.length;
  const done = milestones.filter(m => m.status === "done").length;
  const inProgress = milestones.filter(m => m.status === "in_progress").length;
  return Math.round(((done + inProgress * 0.5) / total) * 100);
}

function determineStatus(dueDate, progress) {
  const days = daysUntil(dueDate);
  if (days === null) return "On Track";
  if (days < 0 && progress < 100) return "Critical";
  if (days <= 7 && progress < 80) return "Critical";
  if (days <= 14 && progress < 60) return "At Risk";
  return "On Track";
}

// ─── Vibrant Bottom Sheet ─────────────────────────────────────────────────────
function BottomSheet({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 lg:flex lg:items-center lg:justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-gradient-to-br from-slate-900/60 via-purple-900/40 to-slate-900/60 backdrop-blur-md"
        />
        
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[2rem] shadow-2xl max-h-[90vh] overflow-hidden lg:relative lg:rounded-[2rem] lg:max-w-lg"
        >
          <div className="lg:hidden flex justify-center pt-4 pb-2">
            <motion.div 
              className="w-16 h-1.5 bg-gradient-to-r from-purple-300 to-pink-300 rounded-full"
              whileHover={{ scale: 1.1 }}
            />
          </div>

          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-purple-50">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-purple-900 bg-clip-text text-transparent">
              {title}
            </h3>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2.5 hover:bg-white rounded-xl transition-all"
            >
              <X className="w-5 h-5 text-slate-500" />
            </motion.button>
          </div>

          <div className="overflow-y-auto px-6 py-6" style={{ maxHeight: "calc(90vh - 120px)" }}>
            {children}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ─── Vibrant Action Menu ──────────────────────────────────────────────────────
function ActionMenu({ isOpen, onClose, actions }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ type: "spring", damping: 20 }}
          className="absolute right-4 top-20 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden min-w-[220px]"
        >
          {actions.map((action, idx) => (
            <motion.button
              key={idx}
              whileHover={{ backgroundColor: "rgba(249, 250, 251, 1)", x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { action.onClick(); onClose(); }}
              className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-all ${
                action.danger ? "text-rose-600" : "text-slate-700"
              } ${idx > 0 ? "border-t border-slate-100" : ""}`}
            >
              <div className={action.danger ? "text-rose-500" : "text-slate-400"}>
                {action.icon}
              </div>
              <span className="font-semibold">{action.label}</span>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ─── Vibrant Pillar Card ──────────────────────────────────────────────────────
function MilestoneRow({ m, idx, mCfg, subs, atts = [], canEdit, onCreateSubtask, onToggleSubtask, onDeleteSubtask, onEditMilestone, onDeleteMilestone, onCycleMilestoneStatus, onUploadAttachment, onOpenAttachment, onDeleteAttachment }) {
  const [showSubs, setShowSubs] = useState(false);
  const [newSub, setNewSub] = useState("");
  const doneCount = subs.filter(s => s.done).length;
  const fileInputRef = useRef(null);

  const onPickFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) onUploadAttachment && onUploadAttachment(m.id, f);
    e.target.value = "";
  };

  const submitSub = (e) => {
    e.preventDefault();
    if (!newSub.trim()) return;
    onCreateSubtask(m.id, newSub);
    setNewSub("");
  };

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.4 + idx * 0.05 }}
      className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all border border-slate-100 overflow-hidden"
    >
      <div className="flex items-start gap-3 p-4">
        <button
          onClick={(e) => { e.stopPropagation(); canEdit && onCycleMilestoneStatus && onCycleMilestoneStatus(m.id); }}
          disabled={!canEdit}
          className={`p-2 rounded-xl bg-gradient-to-br ${mCfg.gradient} shadow-md ${canEdit ? "hover:scale-110 cursor-pointer transition-transform" : ""}`}
          title={canEdit ? "Click to cycle status" : mCfg.label}
        >
          <div className="text-white">{mCfg.icon}</div>
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-slate-900 mb-1">{m.name}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={(e) => { e.stopPropagation(); canEdit && onCycleMilestoneStatus && onCycleMilestoneStatus(m.id); }}
              disabled={!canEdit}
              className={`text-xs px-3 py-1 rounded-full font-semibold ${mCfg.badge} ${canEdit ? "hover:ring-2 hover:ring-purple-300 cursor-pointer" : "cursor-default"}`}
              title={canEdit ? "Click to cycle status" : ""}
            >
              {mCfg.label}
            </button>
            {m.due_date && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(m.due_date)}
              </span>
            )}
            {subs.length > 0 && (
              <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                {doneCount}/{subs.length} subtasks
              </span>
            )}
            {atts.length > 0 && (
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <Paperclip className="w-3 h-3" /> {atts.length}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setShowSubs(!showSubs); }}
          className="p-2 hover:bg-slate-100 rounded-xl text-slate-500"
          title={showSubs ? "Hide subtasks" : "Show subtasks"}
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${showSubs ? "rotate-180" : ""}`} />
        </button>
        {canEdit && (
          <>
            <button onClick={(e) => { e.stopPropagation(); onEditMilestone && onEditMilestone(m); }} className="p-2 hover:bg-blue-50 rounded-xl text-blue-600" title="Edit">
              <Edit3 className="w-4 h-4" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDeleteMilestone && onDeleteMilestone(m.id); }} className="p-2 hover:bg-rose-50 rounded-xl text-rose-500" title="Delete">
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      <AnimatePresence>
        {showSubs && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-100 bg-slate-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 space-y-2">
              {subs.map(s => (
                <div key={s.id} className="flex items-center gap-2 px-2">
                  <input
                    type="checkbox"
                    checked={s.done}
                    onChange={() => onToggleSubtask(s.id)}
                    className="w-4 h-4 rounded accent-purple-600 cursor-pointer"
                  />
                  <span className={`flex-1 text-sm ${s.done ? "line-through text-slate-400" : "text-slate-700"}`}>{s.name}</span>
                  {canEdit && (
                    <button onClick={() => onDeleteSubtask(s.id)} className="text-slate-400 hover:text-rose-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              {canEdit && (
                <form onSubmit={submitSub} className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newSub}
                    onChange={(e) => setNewSub(e.target.value)}
                    placeholder="+ Add subtask..."
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-purple-500 bg-white"
                  />
                  <button type="submit" className="px-3 py-2 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:opacity-90">
                    Add
                  </button>
                </form>
              )}
              {subs.length === 0 && !canEdit && (
                <p className="text-xs text-slate-400 text-center py-2">No subtasks yet</p>
              )}

              {/* Attachments */}
              <div className="pt-3 mt-1 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2 px-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 uppercase tracking-wider">
                    <Paperclip className="w-3.5 h-3.5" /> Attachments
                  </div>
                  {canEdit && (
                    <>
                      <input ref={fileInputRef} type="file" className="hidden" onChange={onPickFile} />
                      <button
                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                      >
                        <Upload className="w-3.5 h-3.5" /> Upload
                      </button>
                    </>
                  )}
                </div>
                {atts.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-1">No files</p>
                ) : (
                  <div className="space-y-1">
                    {atts.map(a => (
                      <div key={a.id} className="flex items-center gap-2 px-2 py-1.5 bg-white rounded-lg border border-slate-100">
                        <Paperclip className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                        <button
                          onClick={() => onOpenAttachment && onOpenAttachment(a)}
                          className="flex-1 text-sm text-left text-slate-700 hover:text-indigo-600 truncate"
                          title={a.filename}
                        >
                          {a.filename}
                        </button>
                        {a.size_bytes && (
                          <span className="text-[10px] text-slate-400 flex-shrink-0">
                            {a.size_bytes < 1024 ? `${a.size_bytes}B` : a.size_bytes < 1048576 ? `${Math.round(a.size_bytes / 1024)}KB` : `${(a.size_bytes / 1048576).toFixed(1)}MB`}
                          </span>
                        )}
                        {canEdit && (
                          <button onClick={() => onDeleteAttachment && onDeleteAttachment(a)} className="text-slate-400 hover:text-rose-500 flex-shrink-0">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function VibrantPillarCard({ pillar, milestones, subtasks = [], attachments = [], onUploadAttachment, onOpenAttachment, onDeleteAttachment, onCreateSubtask, onToggleSubtask, onDeleteSubtask, onEditMilestone, onDeleteMilestone, onCycleMilestoneStatus, isExpanded, onToggle, onEdit, onDelete, onShare, canEdit }) {
  const progress = pillar.progress_override ?? calculateProgress(milestones);
  const status = determineStatus(pillar.due_date, progress);
  const cfg = STATUS_CONFIG[status];
  const days = daysUntil(pillar.due_date);
  const [showActions, setShowActions] = useState(false);

  const actions = canEdit ? [
    { icon: <Edit3 className="w-5 h-5" />, label: "Edit Pillar", onClick: onEdit },
    { icon: <Share2 className="w-5 h-5" />, label: "Share", onClick: onShare },
    { icon: <Trash2 className="w-5 h-5" />, label: "Delete", onClick: onDelete, danger: true }
  ] : [];

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className="relative"
      >
        {/* Glow Effect */}
        <div className={`absolute -inset-1 bg-gradient-to-r ${cfg.gradient} rounded-3xl opacity-20 blur-xl`} />
        
        {/* Card */}
        <div
          onClick={onToggle}
          className="relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all overflow-hidden cursor-pointer border-2 border-white"
        >
          {/* Colorful Top Bar */}
          <div className={`h-2 bg-gradient-to-r ${cfg.gradient}`} />

          {/* Header */}
          <div className="p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    className={`p-2 rounded-xl bg-gradient-to-br ${cfg.gradient} shadow-lg`}
                  >
                    <Target className="w-5 h-5 text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-slate-900 leading-tight">
                    {pillar.title}
                  </h3>
                </div>
                
                {pillar.due_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">{formatDate(pillar.due_date)}</span>
                    {days !== null && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          days < 0 ? "bg-rose-100 text-rose-700" : 
                          days <= 7 ? "bg-amber-100 text-amber-700" : 
                          "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
                      </motion.span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className={`px-4 py-2 rounded-2xl ${cfg.badge} ${cfg.ring} ring-2 shadow-lg`}
                >
                  <div className="flex items-center gap-2">
                    {cfg.icon}
                    <span className={`font-bold text-sm ${cfg.text}`}>{status}</span>
                  </div>
                </motion.div>
                
                {canEdit && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => { e.stopPropagation(); setShowActions(true); }}
                    className="p-3 hover:bg-slate-100 rounded-2xl transition-all"
                  >
                    <MoreVertical className="w-5 h-5 text-slate-600" />
                  </motion.button>
                )}
              </div>
            </div>

            {/* Progress Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <ListTodo className="w-4 h-4" />
                  <span className="font-medium">{milestones.length} milestones</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-3xl font-black bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                    {progress}%
                  </span>
                </div>
              </div>

              {/* Animated Progress Bar */}
              <div className="h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full bg-gradient-to-r ${cfg.gradient} shadow-lg relative overflow-hidden`}
                >
                  <motion.div
                    animate={{ x: ["0%", "100%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  />
                </motion.div>
              </div>

              {/* Expand Indicator */}
              <motion.div 
                className="flex items-center justify-center pt-2"
                animate={{ y: isExpanded ? 0 : [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: isExpanded ? 0 : Infinity }}
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <span>{isExpanded ? "Tap to collapse" : "Tap to expand"}</span>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                </div>
              </motion.div>
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
                className="border-t-2 border-slate-100"
              >
                <div className="p-6 space-y-5 bg-gradient-to-br from-slate-50 to-purple-50">
                  {pillar.objective && (
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-purple-600" />
                        <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">
                          Objective
                        </p>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">{pillar.objective}</p>
                    </motion.div>
                  )}
                  
                  {pillar.target && (
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Flag className="w-4 h-4 text-indigo-600" />
                        <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                          Target
                        </p>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">{pillar.target}</p>
                    </motion.div>
                  )}

                  {/* Milestones */}
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <ListTodo className="w-4 h-4 text-blue-600" />
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                        Milestones ({milestones.length})
                      </p>
                    </div>
                    <div className="space-y-2">
                      {milestones.map((m, idx) => {
                        const mCfg = MILESTONE_STATUS[m.status] || MILESTONE_STATUS_FALLBACK;
                        const mSubs = subtasks.filter(s => s.milestone_id === m.id);
                        const mAtts = attachments.filter(a => a.milestone_id === m.id);
                        return (
                          <MilestoneRow
                            key={m.id}
                            m={m}
                            idx={idx}
                            mCfg={mCfg}
                            subs={mSubs}
                            atts={mAtts}
                            onUploadAttachment={onUploadAttachment}
                            onOpenAttachment={onOpenAttachment}
                            onDeleteAttachment={onDeleteAttachment}
                            canEdit={canEdit}
                            onCreateSubtask={onCreateSubtask}
                            onToggleSubtask={onToggleSubtask}
                            onDeleteSubtask={onDeleteSubtask}
                            onEditMilestone={onEditMilestone}
                            onDeleteMilestone={onDeleteMilestone}
                            onCycleMilestoneStatus={onCycleMilestoneStatus}
                          />
                        );
                      })}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <ActionMenu isOpen={showActions} onClose={() => setShowActions(false)} actions={actions} />
    </>
  );
}

// ─── Vibrant Auth Screen ──────────────────────────────────────────────────────
function VibrantAuthScreen({ onDemoMode, onAuthenticated }) {
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
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl"
        />
        <motion.div
          animate={{ 
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl"
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Header */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <motion.div
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-xl rounded-3xl mb-4 shadow-2xl"
          >
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
            Project Pillars
          </h1>
          <p className="text-white/90 text-lg font-medium">Track milestones with style ✨</p>
        </motion.div>

        {/* Sign In Card */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl mb-4"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">Sign In</h2>
              <p className="text-sm text-slate-500 font-medium">Password or magic link</p>
            </div>
          </div>

          {hasSupabaseEnv ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all text-base font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Password <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all text-base font-medium"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : password ? (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>Sign In</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    <span>Send Magic Link</span>
                  </>
                )}
              </motion.button>

              {message && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-sm text-center font-semibold ${
                    message.startsWith("✅") ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {message}
                </motion.p>
              )}
            </form>
          ) : (
            <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl text-sm text-amber-800 font-medium">
              Supabase not configured. Use demo mode below!
            </div>
          )}
        </motion.div>

        {/* Demo Mode Button */}
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={onDemoMode}
          className="w-full py-4 bg-white/20 backdrop-blur-xl text-white rounded-2xl font-bold hover:bg-white/30 transition-all flex items-center justify-center gap-2 border-2 border-white/30 shadow-xl text-lg"
        >
          <Flag className="w-5 h-5" />
          Continue in Demo Mode
        </motion.button>
      </div>
    </div>
  );
}

// ─── Simple Forms (using existing BottomSheet) ───────────────────────────────
function PillarForm({ isOpen, onClose, onSubmit, initialData }) {
  const [formData, setFormData] = useState({ title: "", objective: "", target: "", due_date: "", progress_override: "" });

  useEffect(() => {
    if (initialData) {
      setFormData({ title: initialData.title || "", objective: initialData.objective || "", target: initialData.target || "", due_date: initialData.due_date || "", progress_override: initialData.progress_override ?? "" });
    } else {
      setFormData({ title: "", objective: "", target: "", due_date: "", progress_override: "" });
    }
  }, [initialData, isOpen]);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Pillar" : "✨ New Pillar"}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); onClose(); }} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Title *</label>
          <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Research Paper" required className="w-full px-4 py-4 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 text-base font-medium transition-all" />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Objective</label>
          <textarea value={formData.objective} onChange={(e) => setFormData({ ...formData, objective: e.target.value })} placeholder="What are you trying to achieve?" rows="3" className="w-full px-4 py-4 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 text-base resize-none font-medium transition-all" />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Target</label>
          <textarea value={formData.target} onChange={(e) => setFormData({ ...formData, target: e.target.value })} placeholder="Concrete deliverable" rows="3" className="w-full px-4 py-4 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 text-base resize-none font-medium transition-all" />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Due Date</label>
          <input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} className="w-full px-4 py-4 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 text-base font-medium transition-all" />
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all mt-6">
          {initialData ? "Update Pillar" : "Create Pillar"}
        </motion.button>
      </form>
    </BottomSheet>
  );
}

function MilestoneForm({ isOpen, onClose, onSubmit, pillars, initialData }) {
  const [formData, setFormData] = useState({ pillar_id: "", name: "", status: "not_started", due_date: "", notes: "" });
  useEffect(() => {
    if (initialData) {
      setFormData({ pillar_id: initialData.pillar_id || "", name: initialData.name || "", status: initialData.status || "not_started", due_date: initialData.due_date || "", notes: initialData.notes || "" });
    } else {
      setFormData({ pillar_id: pillars[0]?.id || "", name: "", status: "not_started", due_date: "", notes: "" });
    }
  }, [initialData, pillars, isOpen]);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Milestone" : "✨ New Milestone"}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); onClose(); }} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Pillar *</label>
          <select value={formData.pillar_id} onChange={(e) => setFormData({ ...formData, pillar_id: e.target.value })} required className="w-full px-4 py-4 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 text-base font-medium">
            {pillars.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Name *</label>
          <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Literature Review" required className="w-full px-4 py-4 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 text-base font-medium" />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Status</label>
          <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-4 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 text-base font-medium">
            <option value="not_started">Upcoming</option>
            <option value="in_progress">In Progress</option>
            <option value="blocked">Blocked</option>
            <option value="done">Done</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Due Date</label>
          <input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} className="w-full px-4 py-4 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 text-base font-medium" />
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all mt-6">
          {initialData ? "Update Milestone" : "Create Milestone"}
        </motion.button>
      </form>
    </BottomSheet>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [demoMode, setDemoMode] = useState(!hasSupabaseEnv);
  const [user, setUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [pillars, setPillars] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPillar, setExpandedPillar] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showPillarForm, setShowPillarForm] = useState(false);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [editingPillar, setEditingPillar] = useState(null);
  const [editingMilestone, setEditingMilestone] = useState(null);

  const currentProfile = profiles.find(p => p.id === user?.id) || (demoMode ? DEMO_PROFILES[0] : null);
  const isAdmin = currentProfile?.role === "admin";

  const handleDemoMode = () => {
    setDemoMode(true);
    setUser(DEMO_PROFILES[0]);
    setProfiles(DEMO_PROFILES);
    setPillars(DEMO_PILLARS);
    setMilestones(DEMO_MILESTONES);
    setLoading(false);
  };

  const handleAuthenticated = (authUser) => { setUser(authUser); setDemoMode(false); };
  const handleSignOut = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null); setDemoMode(false); setPillars([]); setMilestones([]); setProfiles([]);
  };

  useEffect(() => {
    if (demoMode || !user || !supabase) return;
    (async () => {
      setLoading(true);
      const [profilesRes, pillarsRes, milestonesRes, subtasksRes, attachmentsRes] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("pillars").select("*"),
        supabase.from("milestones").select("*"),
        supabase.from("subtasks").select("*").order("sort_order", { ascending: true }),
        supabase.from("milestone_attachments").select("*").order("created_at", { ascending: false })
      ]);
      setProfiles(profilesRes.data || []); setPillars(pillarsRes.data || []); setMilestones(milestonesRes.data || []);
      setSubtasks(subtasksRes.error ? [] : (subtasksRes.data || []));
      setAttachments(attachmentsRes.error ? [] : (attachmentsRes.data || []));
      setLoading(false);
    })();
  }, [user, demoMode]);

  const handleCreatePillar = async (data) => {
    const newPillar = { ...data, owner_id: user.id, progress_override: data.progress_override ? parseInt(data.progress_override) : null };
    if (demoMode) { setPillars([...pillars, { ...newPillar, id: `p${Date.now()}` }]); }
    else if (supabase) { await supabase.from("pillars").insert([newPillar]); }
  };

  const handleUpdatePillar = async (data) => {
    const updated = { ...data, progress_override: data.progress_override ? parseInt(data.progress_override) : null };
    if (demoMode) { setPillars(pillars.map(p => p.id === editingPillar.id ? { ...p, ...updated } : p)); }
    else if (supabase) { await supabase.from("pillars").update(updated).eq("id", editingPillar.id); }
    setEditingPillar(null);
  };

  const handleDeletePillar = async (id) => {
    if (!confirm("Delete this pillar?")) return;
    if (demoMode) { setPillars(pillars.filter(p => p.id !== id)); setMilestones(milestones.filter(m => m.pillar_id !== id)); }
    else if (supabase) { await supabase.from("milestones").delete().eq("pillar_id", id); await supabase.from("pillars").delete().eq("id", id); }
  };

  const sanitizeMilestone = (data) => ({
    pillar_id: data.pillar_id,
    name: (data.name || "").trim(),
    status: data.status || "not_started",
    due_date: data.due_date ? data.due_date : null,
    notes: data.notes || null,
  });

  const handleCreateMilestone = async (data) => {
    const payload = sanitizeMilestone(data);
    if (!payload.pillar_id || !payload.name) return;
    if (demoMode) {
      setMilestones([...milestones, { ...payload, id: `m${Date.now()}` }]);
    } else if (supabase) {
      const { data: inserted, error } = await supabase.from("milestones").insert([payload]).select().single();
      if (error) { console.error("Milestone insert failed:", error); alert(`Could not create milestone: ${error.message}`); return; }
      if (inserted) setMilestones([...milestones, inserted]);
    }
  };

  const handleUpdateMilestone = async (data) => {
    const payload = sanitizeMilestone(data);
    if (demoMode) {
      setMilestones(milestones.map(m => m.id === editingMilestone.id ? { ...m, ...payload } : m));
    } else if (supabase) {
      const { data: updated, error } = await supabase.from("milestones").update(payload).eq("id", editingMilestone.id).select().single();
      if (error) { console.error("Milestone update failed:", error); alert(`Could not update milestone: ${error.message}`); return; }
      if (updated) setMilestones(milestones.map(m => m.id === updated.id ? updated : m));
    }
    setEditingMilestone(null);
  };

  const handleCycleMilestoneStatus = async (id) => {
    const order = ["not_started", "in_progress", "done", "blocked"];
    const m = milestones.find(x => x.id === id);
    if (!m) return;
    const current = order.indexOf(m.status);
    const next = order[(current === -1 ? 0 : current + 1) % order.length];
    setMilestones(milestones.map(x => x.id === id ? { ...x, status: next } : x));
    if (!demoMode && supabase) {
      const { error } = await supabase.from("milestones").update({ status: next }).eq("id", id);
      if (error) { console.error("Status cycle failed:", error); alert(`Could not update status: ${error.message}`); }
    }
  };

  const handleDeleteMilestone = async (id) => {
    if (!confirm("Delete this milestone?")) return;
    if (demoMode) { setMilestones(milestones.filter(m => m.id !== id)); }
    else if (supabase) {
      const { error } = await supabase.from("milestones").delete().eq("id", id);
      if (error) { console.error("Milestone delete failed:", error); alert(`Could not delete: ${error.message}`); return; }
      setMilestones(milestones.filter(m => m.id !== id));
    }
  };

  // ─── Subtask handlers ──────────────────────────────────────────────────────
  const handleCreateSubtask = async (milestoneId, name) => {
    const trimmed = (name || "").trim();
    if (!milestoneId || !trimmed) return;
    const payload = { milestone_id: milestoneId, name: trimmed, done: false, sort_order: subtasks.filter(s => s.milestone_id === milestoneId).length };
    if (demoMode) {
      setSubtasks([...subtasks, { ...payload, id: `s${Date.now()}` }]);
    } else if (supabase) {
      const { data: inserted, error } = await supabase.from("subtasks").insert([payload]).select().single();
      if (error) { console.error("Subtask insert failed:", error); alert(`Could not add subtask: ${error.message}`); return; }
      if (inserted) setSubtasks([...subtasks, inserted]);
    }
  };

  const handleToggleSubtask = async (id) => {
    const s = subtasks.find(x => x.id === id);
    if (!s) return;
    const nextDone = !s.done;
    setSubtasks(subtasks.map(x => x.id === id ? { ...x, done: nextDone } : x));
    if (!demoMode && supabase) {
      const { error } = await supabase.from("subtasks").update({ done: nextDone }).eq("id", id);
      if (error) { console.error("Subtask toggle failed:", error); }
    }
  };

  const handleDeleteSubtask = async (id) => {
    setSubtasks(subtasks.filter(s => s.id !== id));
    if (!demoMode && supabase) {
      const { error } = await supabase.from("subtasks").delete().eq("id", id);
      if (error) { console.error("Subtask delete failed:", error); }
    }
  };

  // ─── Attachment handlers ───────────────────────────────────────────────────
  const handleUploadAttachment = async (milestoneId, file) => {
    if (!file || !milestoneId) return;
    if (demoMode) {
      alert("Attachments require Supabase — sign in with your email to use this.");
      return;
    }
    if (!supabase) return;
    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const storagePath = `${milestoneId}/${Date.now()}_${safeName}`;
    const { error: upErr } = await supabase.storage.from("attachments").upload(storagePath, file, { upsert: false });
    if (upErr) { console.error("Upload failed:", upErr); alert(`Upload failed: ${upErr.message}`); return; }
    const payload = {
      milestone_id: milestoneId,
      storage_path: storagePath,
      filename: file.name,
      mime: file.type || null,
      size_bytes: file.size || null,
      uploaded_by: user?.id || null,
    };
    const { data: inserted, error } = await supabase.from("milestone_attachments").insert([payload]).select().single();
    if (error) {
      console.error("Attachment record failed:", error);
      await supabase.storage.from("attachments").remove([storagePath]);
      alert(`Could not save attachment: ${error.message}`);
      return;
    }
    if (inserted) setAttachments([inserted, ...attachments]);
  };

  const handleOpenAttachment = async (att) => {
    if (!supabase) return;
    const { data, error } = await supabase.storage.from("attachments").createSignedUrl(att.storage_path, 60 * 10);
    if (error) { alert(`Could not open: ${error.message}`); return; }
    window.open(data.signedUrl, "_blank");
  };

  const handleDeleteAttachment = async (att) => {
    if (!confirm(`Delete ${att.filename}?`)) return;
    if (!supabase) return;
    await supabase.storage.from("attachments").remove([att.storage_path]);
    const { error } = await supabase.from("milestone_attachments").delete().eq("id", att.id);
    if (error) { alert(`Delete failed: ${error.message}`); return; }
    setAttachments(attachments.filter(a => a.id !== att.id));
  };

  const filteredPillars = pillars.filter(p => {
    const pMilestones = milestones.filter(m => m.pillar_id === p.id);
    const progress = p.progress_override ?? calculateProgress(pMilestones);
    const status = determineStatus(p.due_date, progress);
    const matchesSearch =
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pMilestones.some(m => (m.name || "").toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // ─── Stats for the overview strip ──────────────────────────────────────────
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfWeek = new Date(startOfToday); endOfWeek.setDate(endOfWeek.getDate() + 7);
  const totalMilestones = milestones.length;
  const doneMilestones = milestones.filter(m => m.status === "done").length;
  const overdueCount = milestones.filter(m => m.due_date && m.status !== "done" && new Date(m.due_date) < startOfToday).length;
  const dueThisWeekCount = milestones.filter(m => {
    if (!m.due_date || m.status === "done") return false;
    const d = new Date(m.due_date);
    return d >= startOfToday && d < endOfWeek;
  }).length;
  const completionPct = totalMilestones ? Math.round((doneMilestones / totalMilestones) * 100) : 0;

  // ─── Keyboard shortcut: press "N" to open new milestone ────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.target && ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setEditingMilestone(null);
        setShowMilestoneForm(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!user && !demoMode) return <VibrantAuthScreen onDemoMode={handleDemoMode} onAuthenticated={handleAuthenticated} />;
  if (loading) return <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-purple-600" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Vibrant Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b-2 border-purple-100 shadow-lg">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }} className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-7 h-7 text-white" />
            </motion.div>
            <div>
              <h1 className="font-black text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Project Pillars</h1>
              <p className="text-xs text-slate-500 font-semibold">{currentProfile?.full_name || currentProfile?.email}</p>
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setShowMenu(!showMenu)} className="p-3 hover:bg-purple-100 rounded-2xl transition-all">
            <Menu className="w-6 h-6 text-purple-600" />
          </motion.button>
        </div>

        <div className="px-4 pb-4 space-y-3">
          {/* Stats overview strip */}
          <div className="grid grid-cols-5 gap-2">
            <div className="bg-white rounded-xl p-2 text-center border-2 border-purple-100 shadow-sm">
              <div className="text-lg font-black text-purple-600">{totalMilestones}</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Total</div>
            </div>
            <div className="bg-white rounded-xl p-2 text-center border-2 border-emerald-100 shadow-sm">
              <div className="text-lg font-black text-emerald-600">{doneMilestones}</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Done</div>
            </div>
            <div className="bg-white rounded-xl p-2 text-center border-2 border-blue-100 shadow-sm">
              <div className="text-lg font-black text-blue-600">{dueThisWeekCount}</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Week</div>
            </div>
            <div className="bg-white rounded-xl p-2 text-center border-2 border-rose-100 shadow-sm">
              <div className="text-lg font-black text-rose-600">{overdueCount}</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Overdue</div>
            </div>
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-2 text-center shadow-sm">
              <div className="text-lg font-black text-white">{completionPct}%</div>
              <div className="text-[10px] font-bold text-white/80 uppercase tracking-wide">Progress</div>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search pillars & milestones... (press N for new)" className="w-full pl-12 pr-4 py-4 bg-white border-2 border-purple-200 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 text-base font-medium transition-all shadow-sm" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {["all", "Critical", "At Risk", "On Track"].map(status => (
              <motion.button key={status} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setStatusFilter(status)} className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all shadow-md ${statusFilter === status ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" : "bg-white text-slate-600 border-2 border-purple-200"}`}>
                {status === "all" ? "All" : status}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Pillars */}
      <div className="px-4 py-6 space-y-4 pb-24">
        {filteredPillars.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
            <Sparkles className="w-20 h-20 text-purple-300 mx-auto mb-4" />
            <p className="text-slate-600 font-bold text-lg">No pillars found</p>
          </motion.div>
        ) : (
          filteredPillars.map(pillar => {
            const pillarMilestones = milestones.filter(m => m.pillar_id === pillar.id);
            const canEdit = pillar.owner_id === user.id || isAdmin;
            return (
              <VibrantPillarCard key={pillar.id} pillar={pillar} milestones={pillarMilestones} subtasks={subtasks} onCreateSubtask={handleCreateSubtask} onToggleSubtask={handleToggleSubtask} onDeleteSubtask={handleDeleteSubtask} onEditMilestone={(m) => { setEditingMilestone(m); setShowMilestoneForm(true); }} onDeleteMilestone={handleDeleteMilestone} onCycleMilestoneStatus={handleCycleMilestoneStatus} attachments={attachments} onUploadAttachment={handleUploadAttachment} onOpenAttachment={handleOpenAttachment} onDeleteAttachment={handleDeleteAttachment} isExpanded={expandedPillar === pillar.id} onToggle={() => setExpandedPillar(expandedPillar === pillar.id ? null : pillar.id)} onEdit={() => { setEditingPillar(pillar); setShowPillarForm(true); }} onDelete={() => handleDeletePillar(pillar.id)} onShare={() => {}} canEdit={canEdit} />
            );
          })
        )}
      </div>

      {/* FAB */}
      <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => { setEditingPillar(null); setShowPillarForm(true); }} className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-2xl flex items-center justify-center z-30">
        <Plus className="w-8 h-8" />
      </motion.button>

      <PillarForm isOpen={showPillarForm} onClose={() => { setShowPillarForm(false); setEditingPillar(null); }} onSubmit={editingPillar ? handleUpdatePillar : handleCreatePillar} initialData={editingPillar} />
      <MilestoneForm isOpen={showMilestoneForm} onClose={() => { setShowMilestoneForm(false); setEditingMilestone(null); }} onSubmit={editingMilestone ? handleUpdateMilestone : handleCreateMilestone} pillars={pillars} initialData={editingMilestone} />

      <AnimatePresence>
        {showMenu && (
          <ActionMenu isOpen={showMenu} onClose={() => setShowMenu(false)} actions={[
            { icon: <Plus className="w-5 h-5" />, label: "New Milestone", onClick: () => { setEditingMilestone(null); setShowMilestoneForm(true); } },
            { icon: <Settings className="w-5 h-5" />, label: "Settings", onClick: () => {} },
            { icon: <LogOut className="w-5 h-5" />, label: "Sign Out", onClick: handleSignOut, danger: true }
          ]} />
        )}
      </AnimatePresence>

      {demoMode && (
        <motion.div initial={{ y: -50 }} animate={{ y: 0 }} className="fixed top-24 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-6 py-3 rounded-full text-sm font-bold flex items-center gap-2 shadow-2xl z-50">
          <Flag className="w-4 h-4" />
          Demo Mode
        </motion.div>
      )}
    </div>
  );
}
