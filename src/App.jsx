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
function ModernModal({ isOpen, onClose, title, subtitle, accent = "from-slate-800 to-slate-900", children }) {
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4"
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", damping: 24, stiffness: 260 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full md:max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        >
          <div className={`bg-gradient-to-r ${accent} px-6 py-5 flex items-start justify-between`}>
            <div>
              <h2 className="text-white text-xl font-black tracking-tight">{title}</h2>
              {subtitle && <p className="text-white/70 text-xs font-semibold mt-1">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl text-white/80 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const CATEGORY_OPTIONS = [
  { v: "other", label: "General" },
  { v: "paper", label: "Paper" },
  { v: "thesis", label: "Thesis" },
  { v: "project", label: "Project" },
  { v: "report", label: "Report" },
];

function PillarForm({ isOpen, onClose, onSubmit, initialData, members = [], profiles = [], currentUserId, onAddMember, onRemoveMember }) {
  const [formData, setFormData] = useState({ title: "", objective: "", target: "", category: "other", start_date: "", due_date: "", progress_override: "" });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        objective: initialData.objective || "",
        target: initialData.target || "",
        category: initialData.category || "other",
        start_date: initialData.start_date || "",
        due_date: initialData.due_date || "",
        progress_override: initialData.progress_override ?? "",
      });
    } else {
      setFormData({ title: "", objective: "", target: "", category: "other", start_date: "", due_date: "", progress_override: "" });
    }
  }, [initialData, isOpen]);

  const input = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 focus:bg-white focus:ring-2 focus:ring-slate-200 text-sm font-medium transition-all placeholder:text-slate-400";
  const label = "block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5";

  return (
    <ModernModal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Pillar" : "New Pillar"} subtitle={initialData ? "Update pillar details" : "A pillar is a major area of work (e.g. a paper, thesis, project)"} accent="from-violet-600 to-indigo-700">
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); onClose(); }} className="space-y-4">
        <div>
          <label className={label}>Title</label>
          <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Research Paper on Smart Hotels" required className={input} autoFocus />
        </div>

        <div>
          <label className={label}>Category</label>
          <div className="flex gap-2 flex-wrap">
            {CATEGORY_OPTIONS.map(c => (
              <button type="button" key={c.v} onClick={() => setFormData({ ...formData, category: c.v })}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${formData.category === c.v ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={label}>Objective</label>
          <textarea value={formData.objective} onChange={(e) => setFormData({ ...formData, objective: e.target.value })} placeholder="What are you trying to achieve?" rows="2" className={input + " resize-none"} />
        </div>

        <div>
          <label className={label}>Target / Deliverable</label>
          <textarea value={formData.target} onChange={(e) => setFormData({ ...formData, target: e.target.value })} placeholder="Concrete outcome" rows="2" className={input + " resize-none"} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Start</label>
            <input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className={input} />
          </div>
          <div>
            <label className={label}>Due</label>
            <input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} className={input} />
          </div>
        </div>

        {initialData && initialData.id && initialData.owner_id === currentUserId && (
          <PillarMembersPanel
            pillarId={initialData.id}
            members={members.filter(m => m.pillar_id === initialData.id)}
            profiles={profiles}
            ownerId={initialData.owner_id}
            onAdd={onAddMember}
            onRemove={onRemoveMember}
          />
        )}

        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition">
            Cancel
          </button>
          <button type="submit" className="flex-[2] py-3 rounded-xl font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-700 hover:shadow-lg transition-all">
            {initialData ? "Save Changes" : "Create Pillar"}
          </button>
        </div>
      </form>
    </ModernModal>
  );
}

function PillarMembersPanel({ pillarId, members, profiles, ownerId, onAdd, onRemove }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    const result = await onAdd(pillarId, email.trim());
    setBusy(false);
    if (result) setEmail("");
  };
  const ownerProfile = profiles.find(p => p.id === ownerId);
  return (
    <div className="border-t border-slate-200 pt-4 mt-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Team Members</span>
        <span className="text-[10px] text-slate-400 font-bold">{members.length + 1} total</span>
      </div>
      <div className="space-y-2">
        {ownerProfile && (
          <div className="flex items-center gap-3 p-2 rounded-lg bg-violet-50 border border-violet-100">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center text-xs font-black flex-shrink-0">
              {(ownerProfile.full_name || ownerProfile.email || "?").split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{ownerProfile.full_name || ownerProfile.email}</p>
              <p className="text-[10px] font-semibold text-violet-600">Owner</p>
            </div>
          </div>
        )}
        {members.map(m => {
          const prof = profiles.find(p => p.id === m.user_id);
          const displayName = prof?.full_name || prof?.email || m.user_id.slice(0, 8);
          return (
            <div key={m.user_id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 border border-slate-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 text-white flex items-center justify-center text-xs font-black flex-shrink-0">
                {(displayName || "?").split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{displayName}</p>
                <p className="text-[10px] font-semibold text-slate-500 capitalize">{m.role}</p>
              </div>
              <button type="button" onClick={() => onRemove(pillarId, m.user_id)} className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 mt-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Add member by email…"
          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-slate-800"
        />
        <button type="button" onClick={submit} disabled={busy || !email.trim()} className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-bold disabled:opacity-50">
          {busy ? "…" : "Add"}
        </button>
      </div>
      <p className="text-[10px] text-slate-400 mt-2">Member must have signed in at least once.</p>
    </div>
  );
}

function MilestoneForm({ isOpen, onClose, onSubmit, pillars, initialData, profiles = [], members = [] }) {
  const isEditing = initialData && !initialData.__isNew && initialData.id;
  const [formData, setFormData] = useState({ pillar_id: "", name: "", status: "not_started", due_date: "", notes: "", assigned_to: "" });
  useEffect(() => {
    if (initialData) {
      setFormData({
        pillar_id: initialData.pillar_id || pillars[0]?.id || "",
        name: initialData.name || "",
        status: initialData.status || "not_started",
        due_date: initialData.due_date || "",
        notes: initialData.notes || "",
        assigned_to: initialData.assigned_to || "",
      });
    } else {
      setFormData({ pillar_id: pillars[0]?.id || "", name: "", status: "not_started", due_date: "", notes: "", assigned_to: "" });
    }
  }, [initialData, pillars, isOpen]);

  // Candidates for assignee: pillar owner + pillar members
  const pillar = pillars.find(p => p.id === formData.pillar_id);
  const assigneeIds = new Set();
  if (pillar) assigneeIds.add(pillar.owner_id);
  members.filter(mm => mm.pillar_id === formData.pillar_id).forEach(mm => assigneeIds.add(mm.user_id));
  const assigneeProfiles = profiles.filter(p => assigneeIds.has(p.id));

  const input = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 focus:bg-white focus:ring-2 focus:ring-slate-200 text-sm font-medium transition-all placeholder:text-slate-400";
  const label = "block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5";

  const STATUS_OPTS = [
    { v: "not_started", label: "Upcoming", tone: "bg-slate-100 text-slate-700 border-slate-300" },
    { v: "in_progress", label: "In Progress", tone: "bg-blue-100 text-blue-700 border-blue-300" },
    { v: "blocked", label: "Blocked", tone: "bg-rose-100 text-rose-700 border-rose-300" },
    { v: "done", label: "Done", tone: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  ];

  return (
    <ModernModal isOpen={isOpen} onClose={onClose} title={isEditing ? "Edit Milestone" : "New Milestone"} subtitle="A concrete step toward completing a pillar" accent="from-slate-800 to-slate-900">
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); onClose(); }} className="space-y-4">
        <div>
          <label className={label}>Pillar</label>
          <select value={formData.pillar_id} onChange={(e) => setFormData({ ...formData, pillar_id: e.target.value })} required className={input}>
            {pillars.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>

        <div>
          <label className={label}>Name</label>
          <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Literature Review" required className={input} autoFocus />
        </div>

        <div>
          <label className={label}>Status</label>
          <div className="flex gap-2 flex-wrap">
            {STATUS_OPTS.map(s => (
              <button key={s.v} type="button" onClick={() => setFormData({ ...formData, status: s.v })}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${formData.status === s.v ? s.tone : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={label}>Assigned To</label>
          <select value={formData.assigned_to || ""} onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })} className={input}>
            <option value="">Unassigned</option>
            {assigneeProfiles.map(p => (
              <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={label}>Due Date</label>
          <input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} className={input} />
        </div>

        <div>
          <label className={label}>Notes</label>
          <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Anything worth remembering…" rows="2" className={input + " resize-none"} />
        </div>

        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition">
            Cancel
          </button>
          <button type="submit" className="flex-[2] py-3 rounded-xl font-bold text-white bg-gradient-to-r from-slate-800 to-slate-900 hover:shadow-lg transition-all">
            {isEditing ? "Save Changes" : "Create Milestone"}
          </button>
        </div>
      </form>
    </ModernModal>
  );
}

// ─── Hub View (Landing dashboard) ────────────────────────────────────────────
function HubView({ pillars, milestones, subtasks, attachments, profiles = [], members = [], currentProfile, onEditMilestone, onCycleMilestoneStatus, onGoToBoard, onGoToTimeline }) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const in14 = new Date(startOfToday); in14.setDate(in14.getDate() + 14);

  // Priority sort for featured milestone cards
  const priorityScore = (m) => {
    if (m.status === "done") return 10;
    if (m.status === "blocked") return 0;
    if (!m.due_date) return 5;
    const d = new Date(m.due_date);
    const days = (d - startOfToday) / 86400000;
    if (days < 0) return 0; // overdue = highest priority
    return Math.max(1, Math.min(9, days));
  };
  const featured = [...milestones]
    .filter(m => m.status !== "done")
    .sort((a, b) => priorityScore(a) - priorityScore(b))
    .slice(0, 6);

  // Upcoming deadlines (next 14 days)
  const upcoming = milestones
    .filter(m => m.due_date && m.status !== "done")
    .filter(m => {
      const d = new Date(m.due_date);
      return d >= startOfToday && d <= in14;
    })
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 6);

  // Recent activity — most recently created milestones as proxy
  const recent = [...milestones]
    .filter(m => m.created_at)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  // Pillar progress for the chart
  const pillarStats = pillars.map(p => {
    const pm = milestones.filter(m => m.pillar_id === p.id);
    const progress = p.progress_override ?? calculateProgress(pm);
    return { id: p.id, title: p.title, progress, count: pm.length };
  }).sort((a, b) => b.count - a.count);

  const totalM = milestones.length;
  const doneM = milestones.filter(m => m.status === "done").length;
  const overdueM = milestones.filter(m => m.due_date && m.status !== "done" && new Date(m.due_date) < startOfToday).length;
  const completionPct = totalM ? Math.round((doneM / totalM) * 100) : 0;

  const initials = (name) => (name || "?").split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase();

  // Priority/schedule derivations for card display
  const deriveCard = (m) => {
    const mCfg = MILESTONE_STATUS[m.status] || MILESTONE_STATUS_FALLBACK;
    const days = m.due_date ? Math.ceil((new Date(m.due_date) - startOfToday) / 86400000) : null;
    let schedule = "On Track", scheduleTone = "text-emerald-700";
    if (m.status === "blocked") { schedule = "Blocked"; scheduleTone = "text-rose-700"; }
    else if (days !== null) {
      if (days < 0) { schedule = "Behind Schedule"; scheduleTone = "text-rose-700"; }
      else if (days <= 3) { schedule = "Due Soon"; scheduleTone = "text-amber-700"; }
      else if (days > 30) { schedule = "Ahead of Schedule"; scheduleTone = "text-emerald-700"; }
    }
    let priority = "Medium", pTone = "bg-amber-400/90";
    if (m.status === "blocked" || (days !== null && days < 0)) { priority = "High"; pTone = "bg-rose-500/90"; }
    else if (days !== null && days > 30) { priority = "Low"; pTone = "bg-emerald-500/90"; }
    return { mCfg, days, schedule, scheduleTone, priority, pTone };
  };

  return (
    <div className="px-4 space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-5xl md:text-6xl font-black tracking-tight bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-transparent inline-block border-2 border-violet-400 px-4 py-2 rounded-lg">
          PROJECT HUB
        </h1>
        {currentProfile && (
          <p className="mt-3 text-sm font-semibold text-slate-500">
            Welcome back, <span className="text-slate-800">{currentProfile.full_name || currentProfile.email}</span>
          </p>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Pillars", value: pillars.length, tone: "from-violet-500 to-indigo-600" },
          { label: "Milestones", value: totalM, tone: "from-sky-500 to-blue-600" },
          { label: "Overdue", value: overdueM, tone: "from-rose-500 to-pink-600" },
          { label: "Completion", value: `${completionPct}%`, tone: "from-emerald-500 to-teal-600" },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl p-4 bg-gradient-to-br ${s.tone} text-white shadow-md`}>
            <div className="text-3xl font-black">{s.value}</div>
            <div className="text-xs font-bold uppercase tracking-wider opacity-90">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Milestone Cards — horizontal scroll */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-black text-slate-800">Milestone Cards</h2>
          <button onClick={onGoToBoard} className="text-xs font-bold text-violet-600 hover:text-violet-800">
            See all →
          </button>
        </div>
        {featured.length === 0 ? (
          <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center text-slate-500 font-semibold">
            All caught up — no active milestones.
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
            {featured.map(m => {
              const { mCfg, days, schedule, scheduleTone, priority, pTone } = deriveCard(m);
              const pillar = pillars.find(p => p.id === m.pillar_id);
              return (
                <button
                  key={m.id}
                  onClick={() => onEditMilestone(m)}
                  className="w-48 flex-shrink-0 rounded-2xl bg-gradient-to-b from-slate-600 to-slate-700 text-white p-4 shadow-lg hover:shadow-xl transition-all text-left"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); onCycleMilestoneStatus && onCycleMilestoneStatus(m.id); }}
                      className={`w-3 h-3 rounded-full bg-gradient-to-br ${mCfg.gradient}`}
                      title="Click to cycle status"
                    />
                    <span className="text-[10px] font-black uppercase tracking-wider text-white/90">{mCfg.label}</span>
                  </div>
                  <p className="font-black text-base leading-tight mb-3 line-clamp-2">{m.name}</p>
                  <div className={`inline-block px-3 py-1 rounded-full ${pTone} text-xs font-black text-white mb-2`}>
                    {priority} Priority
                  </div>
                  <div className={`text-[11px] font-bold mb-2 ${scheduleTone === "text-rose-700" ? "text-rose-200" : scheduleTone === "text-amber-700" ? "text-amber-200" : "text-emerald-200"}`}>
                    {schedule}
                  </div>
                  <div className="text-[10px] font-semibold text-white/80 leading-relaxed">
                    {pillar && <><span className="block truncate">{pillar.title}</span></>}
                    {m.due_date && <>Due: {formatDate(m.due_date)}</>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Two-col: Activity + Deadlines */}
      <section className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
          <h2 className="text-lg font-black text-slate-800 mb-3">Recent Activity</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-slate-400">No recent activity.</p>
          ) : (
            <ul className="space-y-3">
              {recent.map(m => {
                const pillar = pillars.find(p => p.id === m.pillar_id);
                const when = m.created_at ? timeAgo(m.created_at) : "";
                return (
                  <li key={m.id} className="flex items-start gap-3">
                    <div className="w-9 h-9 flex-shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center text-xs font-black">
                      {initials(currentProfile?.full_name || currentProfile?.email)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700">
                        <span className="font-black">{currentProfile?.full_name || "You"}</span>
                        <span className="text-slate-500"> added </span>
                        <span className="font-bold">"{m.name}"</span>
                        {pillar && <><span className="text-slate-500"> in </span><span className="font-bold">{pillar.title}</span></>}
                      </p>
                      <p className="text-[11px] text-slate-400 font-semibold">{when}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-black text-slate-800">Upcoming Deadlines</h2>
            <button onClick={onGoToTimeline} className="text-xs font-bold text-violet-600 hover:text-violet-800">
              Timeline →
            </button>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-slate-400">Nothing due in the next 14 days.</p>
          ) : (
            <ul className="space-y-2.5">
              {upcoming.map(m => {
                const pillar = pillars.find(p => p.id === m.pillar_id);
                const days = Math.ceil((new Date(m.due_date) - startOfToday) / 86400000);
                const mCfg = MILESTONE_STATUS[m.status] || MILESTONE_STATUS_FALLBACK;
                return (
                  <li key={m.id} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${mCfg.gradient}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {m.name}
                        {pillar && <span className="text-slate-400 font-semibold"> · {pillar.title}</span>}
                      </p>
                    </div>
                    <span className={`text-xs font-black flex-shrink-0 ${days <= 3 ? "text-rose-600" : days <= 7 ? "text-amber-600" : "text-emerald-600"}`}>
                      {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days}d`}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Resource Allocation — animated bars per teammate */}
      <ResourceAllocation pillars={pillars} milestones={milestones} profiles={profiles} members={members} currentProfile={currentProfile} />

      {/* Pillar Progress */}
      <section className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
        <h2 className="text-lg font-black text-slate-800 mb-4">Pillar Progress</h2>
        {pillarStats.length === 0 ? (
          <p className="text-sm text-slate-400">No pillars yet.</p>
        ) : (
          <div className="space-y-3">
            {pillarStats.map((s, i) => {
              const palette = COLUMN_PALETTE[i % COLUMN_PALETTE.length];
              return (
                <div key={s.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-slate-700 truncate">{s.title}</span>
                    <span className="text-xs font-black text-slate-500 flex-shrink-0 ml-2">{s.progress}% · {s.count} milestones</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${palette.band}`} style={{ width: `${s.progress}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const secs = Math.floor((Date.now() - d.getTime()) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

function ResourceAllocation({ pillars, milestones, profiles, members, currentProfile }) {
  // Build set of participants: all pillar owners + all members + currentProfile
  const participantIds = new Set();
  pillars.forEach(p => p.owner_id && participantIds.add(p.owner_id));
  members.forEach(m => participantIds.add(m.user_id));
  milestones.forEach(m => m.assigned_to && participantIds.add(m.assigned_to));
  if (currentProfile) participantIds.add(currentProfile.id);

  const participants = [...participantIds]
    .map(id => profiles.find(p => p.id === id) || { id, email: id.slice(0, 8), full_name: null })
    .filter(Boolean);

  // For each participant, count milestones by status (only those assigned to them OR owner of pillar if nobody else)
  const stats = participants.map(p => {
    const mine = milestones.filter(m => {
      if (m.assigned_to) return m.assigned_to === p.id;
      // unassigned — count toward pillar owner
      const pillar = pillars.find(pl => pl.id === m.pillar_id);
      return pillar && pillar.owner_id === p.id;
    });
    return {
      user: p,
      total: mine.length,
      done: mine.filter(m => m.status === "done").length,
      inProgress: mine.filter(m => m.status === "in_progress").length,
      blocked: mine.filter(m => m.status === "blocked").length,
      notStarted: mine.filter(m => m.status === "not_started").length,
    };
  });
  const nonEmpty = stats.filter(s => s.total > 0);
  const list = nonEmpty.length > 0 ? nonEmpty : stats;
  const maxVal = Math.max(1, ...list.map(s => s.total));

  if (list.length === 0) return null;

  const initials = (p) => (p?.full_name || p?.email || "?").split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase();

  return (
    <section className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
      <h2 className="text-lg font-black text-slate-800 mb-4">Resource Allocation</h2>
      <div className="flex items-end gap-3 md:gap-5 overflow-x-auto pb-2" style={{ minHeight: 220 }}>
        {list.map((s, idx) => {
          const h = (v) => Math.max(4, Math.round((v / maxVal) * 160));
          return (
            <div key={s.user.id} className="flex flex-col items-center gap-2 flex-shrink-0" style={{ minWidth: 80 }}>
              {/* Bars (grouped) */}
              <div className="flex items-end gap-1 h-[170px]">
                {[
                  { val: s.done, color: "from-emerald-400 to-teal-500", label: "Done" },
                  { val: s.inProgress, color: "from-blue-400 to-indigo-500", label: "In Progress" },
                  { val: s.notStarted, color: "from-slate-300 to-slate-400", label: "Upcoming" },
                  { val: s.blocked, color: "from-rose-400 to-pink-500", label: "Blocked" },
                ].map((b, bi) => (
                  <motion.div
                    key={bi}
                    initial={{ height: 0 }}
                    animate={{ height: h(b.val) }}
                    transition={{ duration: 0.7, delay: idx * 0.05 + bi * 0.05, ease: "easeOut" }}
                    title={`${b.label}: ${b.val}`}
                    className={`w-3.5 md:w-4 rounded-t-md bg-gradient-to-t ${b.color} shadow-sm`}
                  />
                ))}
              </div>

              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center text-[10px] font-black ring-2 ring-white shadow">
                {initials(s.user)}
              </div>
              <div className="text-[10px] font-bold text-slate-600 text-center max-w-[80px] truncate">
                {s.user.full_name ? s.user.full_name.split(" ")[0] : (s.user.email || "").split("@")[0]}
              </div>
              <div className="text-[10px] font-black text-slate-400">{s.total}</div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 text-[10px] font-bold text-slate-500">
        {[
          { color: "from-emerald-400 to-teal-500", label: "Done" },
          { color: "from-blue-400 to-indigo-500", label: "In Progress" },
          { color: "from-slate-300 to-slate-400", label: "Upcoming" },
          { color: "from-rose-400 to-pink-500", label: "Blocked" },
        ].map(l => (
          <span key={l.label} className="inline-flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded bg-gradient-to-t ${l.color}`} />
            {l.label}
          </span>
        ))}
      </div>
    </section>
  );
}

// ─── Board View (Kanban by pillar, grouped by category) ──────────────────────
const COLUMN_PALETTE = [
  { band: "from-sky-500 to-blue-600",       col: "border-sky-300 bg-sky-50/60",       head: "bg-sky-500",      text: "text-sky-50" },
  { band: "from-violet-500 to-purple-600",  col: "border-violet-300 bg-violet-50/60", head: "bg-violet-500",   text: "text-violet-50" },
  { band: "from-emerald-500 to-teal-600",   col: "border-emerald-300 bg-emerald-50/60", head: "bg-emerald-500", text: "text-emerald-50" },
  { band: "from-amber-500 to-orange-600",   col: "border-amber-300 bg-amber-50/60",   head: "bg-amber-500",    text: "text-amber-50" },
  { band: "from-rose-500 to-pink-600",      col: "border-rose-300 bg-rose-50/60",     head: "bg-rose-500",     text: "text-rose-50" },
  { band: "from-indigo-500 to-blue-700",    col: "border-indigo-300 bg-indigo-50/60", head: "bg-indigo-500",   text: "text-indigo-50" },
];
const categoryLabel = (c) => {
  if (!c || c === "other") return "Uncategorised";
  return c.replace(/_/g, " ").replace(/\b\w/g, s => s.toUpperCase());
};

function BoardView({ pillars, milestones, subtasks, attachments, profiles = [], userId, isAdmin, onEditPillar, onEditMilestone, onCycleMilestoneStatus, onAddMilestone }) {
  // Group pillars by category
  const groups = pillars.reduce((acc, p) => {
    const key = p.category || "other";
    (acc[key] = acc[key] || []).push(p);
    return acc;
  }, {});
  const orderedKeys = Object.keys(groups).sort();

  return (
    <div className="overflow-x-auto px-4">
      <div className="min-w-max space-y-6 pb-4">
        {orderedKeys.map((cat, catIdx) => {
          const palette = COLUMN_PALETTE[catIdx % COLUMN_PALETTE.length];
          const colsInGroup = groups[cat];
          return (
            <div key={cat} className="space-y-2">
              {/* Category band */}
              <div className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-xl bg-gradient-to-r ${palette.band} shadow-lg`}>
                <Sparkles className="w-4 h-4 text-white/80" />
                <span className="text-white font-black tracking-wide text-sm uppercase">{categoryLabel(cat)}</span>
                <span className="text-white/80 text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">{colsInGroup.length}</span>
              </div>

              {/* Columns */}
              <div className="flex gap-4">
                {colsInGroup.map((pillar, idx) => {
                  const p2 = COLUMN_PALETTE[(catIdx + idx) % COLUMN_PALETTE.length];
                  const pMilestones = milestones.filter(m => m.pillar_id === pillar.id);
                  const progress = pillar.progress_override ?? calculateProgress(pMilestones);
                  const canEdit = pillar.owner_id === userId || isAdmin;
                  return (
                    <div key={pillar.id} className={`w-72 flex-shrink-0 rounded-2xl border-2 ${p2.col} overflow-hidden shadow-md hover:shadow-xl transition-shadow`}>
                      {/* Column header */}
                      <div className={`${p2.head} px-4 py-3 flex items-center justify-between`}>
                        <button onClick={() => canEdit && onEditPillar(pillar)} className="flex-1 text-left">
                          <h3 className={`${p2.text} font-black text-base leading-tight truncate`}>{pillar.title}</h3>
                          <div className={`${p2.text} text-[10px] font-bold opacity-90 mt-0.5 flex items-center gap-2`}>
                            <span>{pMilestones.length} milestones</span>
                            <span>•</span>
                            <span>{progress}%</span>
                          </div>
                        </button>
                      </div>

                      {/* Progress strip */}
                      <div className="h-1.5 bg-white/40">
                        <div className="h-full bg-white/90" style={{ width: `${progress}%` }} />
                      </div>

                      {/* Cards */}
                      <div className="p-3 space-y-2 min-h-[200px] max-h-[65vh] overflow-y-auto">
                        {pMilestones.length === 0 && (
                          <div className="text-center py-8 text-slate-400 text-xs font-semibold">No milestones yet</div>
                        )}
                        {pMilestones.map(m => {
                          const mCfg = MILESTONE_STATUS[m.status] || MILESTONE_STATUS_FALLBACK;
                          const mSubs = subtasks.filter(s => s.milestone_id === m.id);
                          const mAtts = attachments.filter(a => a.milestone_id === m.id);
                          const isOverdue = m.due_date && m.status !== "done" && new Date(m.due_date) < new Date();
                          return (
                            <div key={m.id} className="bg-white rounded-xl p-3 shadow-sm hover:shadow-md border border-slate-100 transition-all group">
                              <div className="flex items-start gap-2 mb-2">
                                <button
                                  onClick={() => canEdit && onCycleMilestoneStatus(m.id)}
                                  className={`p-1.5 rounded-lg bg-gradient-to-br ${mCfg.gradient} flex-shrink-0 ${canEdit ? "hover:scale-110 transition-transform cursor-pointer" : ""}`}
                                  title={canEdit ? "Click to cycle status" : mCfg.label}
                                >
                                  <div className="text-white w-3 h-3">{mCfg.icon}</div>
                                </button>
                                <button onClick={() => canEdit && onEditMilestone(m)} className="flex-1 text-left min-w-0">
                                  <p className="font-bold text-sm text-slate-800 leading-snug line-clamp-2">{m.name}</p>
                                </button>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${mCfg.badge}`}>{mCfg.label}</span>
                                {m.due_date && (
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1 ${isOverdue ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"}`}>
                                    <Calendar className="w-2.5 h-2.5" />
                                    {formatDate(m.due_date)}
                                  </span>
                                )}
                                {mSubs.length > 0 && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-purple-50 text-purple-700 inline-flex items-center gap-1">
                                    <ListTodo className="w-2.5 h-2.5" /> {mSubs.filter(s=>s.done).length}/{mSubs.length}
                                  </span>
                                )}
                                {mAtts.length > 0 && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-700 inline-flex items-center gap-1">
                                    <Paperclip className="w-2.5 h-2.5" /> {mAtts.length}
                                  </span>
                                )}
                                {m.assigned_to && (() => {
                                  const prof = profiles.find(pp => pp.id === m.assigned_to);
                                  const label = prof?.full_name || prof?.email || "?";
                                  const init = label.split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase();
                                  return (
                                    <span title={`Assigned: ${label}`} className="ml-auto w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-[8px] font-black flex items-center justify-center ring-2 ring-white">
                                      {init}
                                    </span>
                                  );
                                })()}
                              </div>
                            </div>
                          );
                        })}

                        {canEdit && (
                          <button
                            onClick={() => onAddMilestone(pillar.id)}
                            className="w-full mt-1 py-2 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-slate-500 hover:text-slate-700 hover:bg-white transition-all text-xs font-bold inline-flex items-center justify-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add milestone
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Gantt / Timeline View ───────────────────────────────────────────────────
function GanttView({ pillars, milestones }) {
  // Collect all dated items
  const items = [];
  pillars.forEach((p, pi) => {
    const palette = COLUMN_PALETTE[pi % COLUMN_PALETTE.length];
    const pMilestones = milestones.filter(m => m.pillar_id === p.id);
    const dates = [p.start_date, p.due_date, ...pMilestones.flatMap(m => [m.due_date])].filter(Boolean);
    items.push({ type: "pillar", pillar: p, palette, start: p.start_date, end: p.due_date, milestones: pMilestones });
  });

  // Compute min/max range
  const allDates = [];
  pillars.forEach(p => { if (p.start_date) allDates.push(new Date(p.start_date)); if (p.due_date) allDates.push(new Date(p.due_date)); });
  milestones.forEach(m => { if (m.due_date) allDates.push(new Date(m.due_date)); });
  if (allDates.length === 0) {
    return (
      <div className="px-4 text-center py-20">
        <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500 font-bold">Add due dates to pillars or milestones to see the timeline.</p>
      </div>
    );
  }
  const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
  // Pad ±7 days
  minDate.setDate(minDate.getDate() - 7);
  maxDate.setDate(maxDate.getDate() + 7);
  const totalDays = Math.max(1, Math.ceil((maxDate - minDate) / 86400000));
  const dayWidth = 18; // px per day
  const chartWidth = totalDays * dayWidth;

  const posFor = (d) => {
    if (!d) return null;
    const dd = new Date(d);
    return Math.max(0, Math.round((dd - minDate) / 86400000)) * dayWidth;
  };

  // Month ticks
  const months = [];
  let cur = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  while (cur <= maxDate) {
    months.push(new Date(cur));
    cur.setMonth(cur.getMonth() + 1);
  }
  const todayX = posFor(new Date());

  const labelColWidth = 220;

  return (
    <div className="px-4">
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {/* Scrollable timeline */}
        <div className="overflow-x-auto">
          <div style={{ width: labelColWidth + chartWidth }}>
            {/* Month header */}
            <div className="flex sticky top-0 z-10 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
              <div style={{ width: labelColWidth }} className="p-3 border-r border-slate-200">
                <p className="text-xs font-black uppercase tracking-wider text-slate-500">Pillar / Milestone</p>
              </div>
              <div className="relative" style={{ width: chartWidth, height: 44 }}>
                {months.map((m, i) => {
                  const x = posFor(m);
                  const nextX = i + 1 < months.length ? posFor(months[i + 1]) : chartWidth;
                  return (
                    <div key={i} className="absolute top-0 bottom-0 border-l border-slate-200 px-2 flex items-center" style={{ left: x, width: nextX - x }}>
                      <span className="text-xs font-black text-slate-600">{m.toLocaleString("default", { month: "short" })} {m.getFullYear()}</span>
                    </div>
                  );
                })}
                {todayX !== null && (
                  <div className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-20" style={{ left: todayX }} />
                )}
              </div>
            </div>

            {/* Rows */}
            <div>
              {items.map((it, idx) => {
                const p = it.pillar;
                const pStart = posFor(p.start_date);
                const pEnd = posFor(p.due_date);
                const hasPillarBar = pStart !== null && pEnd !== null && pEnd >= pStart;
                return (
                  <div key={p.id}>
                    {/* Pillar row */}
                    <div className="flex border-b border-slate-100 hover:bg-slate-50/50">
                      <div style={{ width: labelColWidth }} className="p-3 border-r border-slate-200 flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${it.palette.band}`} />
                        <span className="text-sm font-black text-slate-800 truncate">{p.title}</span>
                      </div>
                      <div className="relative" style={{ width: chartWidth, height: 44 }}>
                        {/* Grid lines */}
                        {months.map((m, i) => (
                          <div key={i} className="absolute top-0 bottom-0 border-l border-slate-100" style={{ left: posFor(m) }} />
                        ))}
                        {todayX !== null && (
                          <div className="absolute top-0 bottom-0 w-0.5 bg-rose-500/60 z-10" style={{ left: todayX }} />
                        )}
                        {hasPillarBar && (
                          <div
                            title={`${p.title}: ${formatDate(p.start_date)} → ${formatDate(p.due_date)}`}
                            className={`absolute top-3 h-5 rounded-md bg-gradient-to-r ${it.palette.band} shadow-md flex items-center px-2`}
                            style={{ left: pStart, width: Math.max(dayWidth, pEnd - pStart) }}
                          >
                            <span className="text-[10px] font-black text-white truncate">{p.title}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Milestone sub-rows */}
                    {it.milestones.map(m => {
                      const mCfg = MILESTONE_STATUS[m.status] || MILESTONE_STATUS_FALLBACK;
                      const mx = posFor(m.due_date);
                      return (
                        <div key={m.id} className="flex border-b border-slate-50 hover:bg-slate-50/30">
                          <div style={{ width: labelColWidth }} className="pl-8 pr-3 py-2 border-r border-slate-200 flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${mCfg.gradient}`} />
                            <span className="text-xs font-semibold text-slate-600 truncate">{m.name}</span>
                          </div>
                          <div className="relative" style={{ width: chartWidth, height: 32 }}>
                            {months.map((mo, i) => (
                              <div key={i} className="absolute top-0 bottom-0 border-l border-slate-50" style={{ left: posFor(mo) }} />
                            ))}
                            {todayX !== null && (
                              <div className="absolute top-0 bottom-0 w-0.5 bg-rose-500/40" style={{ left: todayX }} />
                            )}
                            {mx !== null && (
                              <div
                                title={`${m.name}: ${formatDate(m.due_date)}`}
                                className={`absolute top-2 h-4 w-4 rounded-full bg-gradient-to-br ${mCfg.gradient} shadow ring-2 ring-white`}
                                style={{ left: mx - 8 }}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <p className="text-xs text-slate-500 text-center mt-3 font-semibold">
        <span className="inline-block w-3 h-0.5 bg-rose-500 align-middle mr-1" /> Today
        <span className="mx-3">•</span>
        Bars = pillars (start → due) · Dots = milestone due dates
      </p>
    </div>
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
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPillar, setExpandedPillar] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState(() => {
    try { return localStorage.getItem("viewMode") || "hub"; } catch { return "hub"; }
  });
  useEffect(() => { try { localStorage.setItem("viewMode", viewMode); } catch {} }, [viewMode]);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  useEffect(() => {
    let last = 0, ticking = false;
    const onScroll = () => {
      const y = window.scrollY;
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setHeaderCollapsed(y > 40);
          last = y;
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
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
      const [profilesRes, pillarsRes, milestonesRes, subtasksRes, attachmentsRes, membersRes] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("pillars").select("*"),
        supabase.from("milestones").select("*"),
        supabase.from("subtasks").select("*").order("sort_order", { ascending: true }),
        supabase.from("milestone_attachments").select("*").order("created_at", { ascending: false }),
        supabase.from("pillar_members").select("*")
      ]);
      setProfiles(profilesRes.data || []); setPillars(pillarsRes.data || []); setMilestones(milestonesRes.data || []);
      setSubtasks(subtasksRes.error ? [] : (subtasksRes.data || []));
      setAttachments(attachmentsRes.error ? [] : (attachmentsRes.data || []));
      setMembers(membersRes.error ? [] : (membersRes.data || []));
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
    assigned_to: data.assigned_to || null,
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

  // ─── Team / member handlers ────────────────────────────────────────────────
  const handleAddMemberByEmail = async (pillarId, email, role = "member") => {
    if (!pillarId || !email) return;
    if (demoMode) { alert("Team editing requires Supabase login."); return; }
    if (!supabase) return;
    const { data, error } = await supabase.rpc("add_pillar_member_by_email", { p_pillar_id: pillarId, p_email: email, p_role: role });
    if (error) { alert(`Could not add member: ${error.message}`); return; }
    // Refresh members + profiles
    const [membersRes, profilesRes] = await Promise.all([
      supabase.from("pillar_members").select("*"),
      supabase.from("profiles").select("*"),
    ]);
    setMembers(membersRes.data || []);
    setProfiles(profilesRes.data || []);
    return data;
  };

  const handleRemoveMember = async (pillarId, userId) => {
    if (!confirm("Remove this member?")) return;
    if (!supabase) return;
    const { error } = await supabase.from("pillar_members").delete().eq("pillar_id", pillarId).eq("user_id", userId);
    if (error) { alert(`Could not remove: ${error.message}`); return; }
    setMembers(members.filter(m => !(m.pillar_id === pillarId && m.user_id === userId)));
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
      {/* Dynamic Header — collapses on scroll */}
      <motion.div
        animate={{
          paddingTop: headerCollapsed ? 6 : 16,
          paddingBottom: headerCollapsed ? 6 : 16,
        }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-slate-200/70 shadow-sm"
      >
        {/* Top row — always visible */}
        <div className="px-4 flex items-center gap-3">
          <motion.div
            animate={{ width: headerCollapsed ? 36 : 48, height: headerCollapsed ? 36 : 48 }}
            transition={{ duration: 0.25 }}
            className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shrink-0"
          >
            <Sparkles className={headerCollapsed ? "w-5 h-5 text-white" : "w-6 h-6 text-white"} />
          </motion.div>

          {!headerCollapsed && (
            <div className="min-w-0 flex-shrink">
              <h1 className="font-black text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">Project Pillars</h1>
              <p className="text-xs text-slate-500 font-semibold truncate">{currentProfile?.full_name || currentProfile?.email}</p>
            </div>
          )}

          {/* Search — grows when collapsed to fill the row */}
          <div className={`relative ${headerCollapsed ? "flex-1" : "hidden md:block flex-1 max-w-md ml-auto"}`}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={headerCollapsed ? "Search…" : "Search pillars & milestones…"}
              className={`w-full pl-9 pr-3 bg-white border border-purple-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 text-sm font-medium transition-all ${headerCollapsed ? "py-1.5" : "py-2"}`}
            />
          </div>

          {/* View toggle — compact inline when collapsed */}
          {headerCollapsed && (
            <div className="inline-flex items-center bg-slate-100 rounded-full p-0.5 shrink-0">
              {[
                { id: "hub", label: "Hub" },
                { id: "cards", label: "Cards" },
                { id: "board", label: "Board" },
                { id: "gantt", label: "Time" },
              ].map(v => (
                <button
                  key={v.id}
                  onClick={() => setViewMode(v.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${viewMode === v.id ? "bg-white text-slate-900 shadow" : "text-slate-500"}`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          )}

          {/* Mini progress chip when collapsed */}
          {headerCollapsed && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow shrink-0">
              <span className="text-[11px] font-black text-white">{completionPct}%</span>
              <span className="text-[9px] font-bold text-white/80 uppercase tracking-wide">done</span>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowMenu(!showMenu)}
            className={`hover:bg-purple-100 rounded-xl transition-all shrink-0 ${headerCollapsed ? "p-2" : "p-2.5"}`}
          >
            <Menu className={headerCollapsed ? "w-5 h-5 text-purple-600" : "w-6 h-6 text-purple-600"} />
          </motion.button>
        </div>

        {/* Expanded-only section: stats strip + full search + chips */}
        <motion.div
          animate={{
            height: headerCollapsed ? 0 : "auto",
            opacity: headerCollapsed ? 0 : 1,
            marginTop: headerCollapsed ? 0 : 12,
          }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="overflow-hidden"
        >
          <div className="px-4 space-y-3">
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

            <div className="relative md:hidden">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pillars & milestones… (press N for new)"
                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-purple-200 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 text-base font-medium transition-all shadow-sm"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 items-center">
              <div className="inline-flex items-center bg-white rounded-full p-1 shadow-sm border border-slate-200 flex-shrink-0">
                {[
                  { id: "hub", label: "Hub" },
                  { id: "cards", label: "Cards" },
                  { id: "board", label: "Board" },
                  { id: "gantt", label: "Timeline" },
                ].map(v => (
                  <button
                    key={v.id}
                    onClick={() => setViewMode(v.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${viewMode === v.id ? "bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
              <div className="w-px h-6 bg-slate-200 flex-shrink-0" />
              {["all", "Critical", "At Risk", "On Track"].map(status => (
                <motion.button key={status} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setStatusFilter(status)} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-md ${statusFilter === status ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" : "bg-white text-slate-600 border-2 border-purple-200"}`}>
                  {status === "all" ? "All" : status}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Pillars */}
      <div className={viewMode === "cards" ? "px-4 py-6 space-y-4 pb-24" : "py-6 pb-24"}>
        {filteredPillars.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
            <Sparkles className="w-20 h-20 text-purple-300 mx-auto mb-4" />
            <p className="text-slate-600 font-bold text-lg">No pillars found</p>
          </motion.div>
        ) : viewMode === "hub" ? (
          <HubView
            pillars={filteredPillars}
            milestones={milestones}
            subtasks={subtasks}
            attachments={attachments}
            profiles={profiles}
            members={members}
            currentProfile={currentProfile}
            onEditMilestone={(m) => { setEditingMilestone(m); setShowMilestoneForm(true); }}
            onCycleMilestoneStatus={handleCycleMilestoneStatus}
            onGoToBoard={() => setViewMode("board")}
            onGoToTimeline={() => setViewMode("gantt")}
          />
        ) : viewMode === "board" ? (
          <BoardView
            pillars={filteredPillars}
            milestones={milestones}
            subtasks={subtasks}
            attachments={attachments}
            profiles={profiles}
            userId={user?.id}
            isAdmin={isAdmin}
            onEditPillar={(p) => { setEditingPillar(p); setShowPillarForm(true); }}
            onEditMilestone={(m) => { setEditingMilestone(m); setShowMilestoneForm(true); }}
            onCycleMilestoneStatus={handleCycleMilestoneStatus}
            onAddMilestone={(pillarId) => { setEditingMilestone({ pillar_id: pillarId, __isNew: true }); setShowMilestoneForm(true); }}
          />
        ) : viewMode === "gantt" ? (
          <GanttView pillars={filteredPillars} milestones={milestones} />
        ) : (
          <div className="px-4 space-y-4">
            {filteredPillars.map(pillar => {
              const pillarMilestones = milestones.filter(m => m.pillar_id === pillar.id);
              const canEdit = pillar.owner_id === user.id || isAdmin;
              return (
                <VibrantPillarCard key={pillar.id} pillar={pillar} milestones={pillarMilestones} subtasks={subtasks} onCreateSubtask={handleCreateSubtask} onToggleSubtask={handleToggleSubtask} onDeleteSubtask={handleDeleteSubtask} onEditMilestone={(m) => { setEditingMilestone(m); setShowMilestoneForm(true); }} onDeleteMilestone={handleDeleteMilestone} onCycleMilestoneStatus={handleCycleMilestoneStatus} attachments={attachments} onUploadAttachment={handleUploadAttachment} onOpenAttachment={handleOpenAttachment} onDeleteAttachment={handleDeleteAttachment} isExpanded={expandedPillar === pillar.id} onToggle={() => setExpandedPillar(expandedPillar === pillar.id ? null : pillar.id)} onEdit={() => { setEditingPillar(pillar); setShowPillarForm(true); }} onDelete={() => handleDeletePillar(pillar.id)} onShare={() => {}} canEdit={canEdit} />
              );
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => { setEditingPillar(null); setShowPillarForm(true); }} className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-2xl flex items-center justify-center z-30">
        <Plus className="w-8 h-8" />
      </motion.button>

      <PillarForm isOpen={showPillarForm} onClose={() => { setShowPillarForm(false); setEditingPillar(null); }} onSubmit={editingPillar ? handleUpdatePillar : handleCreatePillar} initialData={editingPillar} members={members} profiles={profiles} currentUserId={user?.id} onAddMember={handleAddMemberByEmail} onRemoveMember={handleRemoveMember} />
      <MilestoneForm isOpen={showMilestoneForm} onClose={() => { setShowMilestoneForm(false); setEditingMilestone(null); }} onSubmit={editingMilestone && editingMilestone.id && !editingMilestone.__isNew ? handleUpdateMilestone : handleCreateMilestone} pillars={pillars} initialData={editingMilestone} profiles={profiles} members={members} />

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
