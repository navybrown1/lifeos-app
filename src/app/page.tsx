// @ts-nocheck
"use client";

import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence, useSpring } from "framer-motion";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";

import {
  CheckCircle2,
  Circle,
  Shield,
  Sparkles,
  HeartPulse,
  CalendarDays,
  Target,
  Brain,
  ListTodo,
  Timer,
  Flame,
  Wand2,
  BookOpen,
  RefreshCw,
  Download,
  Upload,
  Trophy,
  PartyPopper,
  Sun,
  Moon,
  Zap,
  Rocket,
  Gem,
  Crown,
  Stars,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  Area,
  AreaChart,
} from "recharts";

// ─── Sound Engine ──────────────────────────────────────────────
// Pure Web Audio API — no deps, no network
let _audioCtx: AudioContext | null = null;
function getAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!_audioCtx) {
    try {
      _audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch { return null; }
  }
  return _audioCtx;
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.12,
  fadeIn = 0.01,
  fadeOut = 0.1,
) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + fadeIn);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration - fadeOut);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch { /* swallow */ }
}

const SFX = {
  click() { playTone(440, 0.06, "sine", 0.08); },
  toggle() {
    playTone(520, 0.05, "sine", 0.09);
    setTimeout(() => playTone(660, 0.05, "sine", 0.07), 60);
  },
  success() {
    playTone(523, 0.12, "sine", 0.12);
    setTimeout(() => playTone(659, 0.12, "sine", 0.10), 120);
    setTimeout(() => playTone(784, 0.20, "sine", 0.13), 240);
  },
  celebrate() {
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => playTone(f, 0.15, "triangle", 0.12), i * 100);
    });
  },
  loot() {
    [440, 550, 660, 880].forEach((f, i) => {
      setTimeout(() => playTone(f, 0.10, "sine", 0.10), i * 60);
    });
  },
  tab() { playTone(380, 0.05, "sine", 0.06); },
  slider() { playTone(320, 0.04, "sine", 0.04); },
  error() { playTone(220, 0.15, "square", 0.08); },
  achievement() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => {
      setTimeout(() => playTone(f, 0.12, "sine", 0.11), i * 80);
    });
  },
};

// ─── Constants ─────────────────────────────────────────────────
const LS_KEY = "lifeos_v01";
const LS_DECISIONS = "lifeos_decisions";
const THEMES = ["sunrise", "ocean", "sunset"] as const;
const DAILY_MISSIONS = [
  "Ship one uncomfortable task before noon.",
  "Protect a 25-minute focus sprint with zero distractions.",
  "Do one values-first action for your family.",
  "Close one loop you have been mentally carrying.",
  "Turn one vague task into a 2-minute first step.",
  "Say no to one thing that does not align.",
];
const LOOT_REWARDS = [
  { label: "Momentum Burst", xp: 30, coins: 12, note: "You found extra focus points.", color: "from-violet-500/30 to-blue-500/20" },
  { label: "Clarity Cache", xp: 20, coins: 18, note: "Decision-making bonus unlocked.", color: "from-cyan-500/30 to-teal-500/20" },
  { label: "Execution Boost", xp: 40, coins: 8, note: "Deep work power-up applied.", color: "from-orange-500/30 to-red-500/20" },
  { label: "Recovery Pack", xp: 15, coins: 20, note: "Energy and consistency restored.", color: "from-emerald-500/30 to-green-500/20" },
];

function uid() { return Math.random().toString(16).slice(2) + Date.now().toString(16); }
function todayISO() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}
function startOfWeekISO(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}
function seedFromISO(iso) { return iso.split("-").join("").split("").reduce((acc, n) => acc + Number(n || 0), 0); }

const DEFAULTS = {
  meta: { name: "Edwin", version: "1.0", createdAt: new Date().toISOString(), bonusXP: 0, coins: 0 },
  values: [
    { id: uid(), label: "Fatherhood first", why: "My kids get the best of me.", proof: "15 minutes of phone-free presence with my kids daily." },
    { id: uid(), label: "Truth over comfort", why: "No self deception.", proof: "Name the real reason when I avoid something." },
    { id: uid(), label: "Competence", why: "Skills compound.", proof: "20 minutes of deliberate practice on weekdays." },
    { id: uid(), label: "Integrity", why: "My word matters.", proof: "If I commit, I calendar it and do it." },
    { id: uid(), label: "Health as infrastructure", why: "The machine needs power.", proof: "Protect sleep window and move daily." },
  ],
  principles: [
    { id: uid(), label: "Small wins are not small", note: "Daily proof beats speeches." },
    { id: uid(), label: "Default to simplicity", note: "Simple systems survive bad days." },
    { id: uid(), label: "Plan for low motivation days", note: "Architecture beats mood." },
    { id: uid(), label: "One battle at a time", note: "Steady pressure wins." },
    { id: uid(), label: "No zero days", note: "Do the minimum standard." },
  ],
  filters: [
    { id: uid(), key: "Future Dad", prompt: "Will Future Me thank me or curse me?" },
    { id: uid(), key: "3 Costs", prompt: "What does this cost in time, energy, money?" },
    { id: uid(), key: "48 Hour Regret", prompt: "What do I regret in 48 hours if I do or do not do this?" },
    { id: uid(), key: "Alignment", prompt: "Is this aligned with values or a dopamine snack?" },
    { id: uid(), key: "Hell Yes", prompt: "Is this a strong yes? If not, it is no or not now." },
  ],
  routines: {
    dailyAnchors: [
      { id: uid(), label: "Morning start", durationMin: 10, steps: ["2 minutes: What matters today?", "3 minutes: pick the One Thing", "5 minutes: start the One Thing"] },
      { id: uid(), label: "Midday reset", durationMin: 5, steps: ["Water", "Body scan", "Next concrete step"] },
      { id: uid(), label: "Evening shutdown", durationMin: 10, steps: ["Write tomorrow One Thing", "Set up first step physically", "2 minute tidy"] },
    ],
    weekly: { planning: { day: "Sunday", minutes: 30 }, review: { day: "Friday", minutes: 15 } },
  },
  habits: [
    { id: uid(), name: "Sleep protection", trigger: "Night alarm", tinyAction: "Devices down, lights low", reward: "Tea or audiobook", type: "yesno" },
    { id: uid(), name: "Movement", trigger: "After bathroom", tinyAction: "5 minutes of movement", reward: "Music or shower", type: "minutes", targetMinutes: 5 },
    { id: uid(), name: "Deep work", trigger: "Open laptop", tinyAction: "10 minutes on One Thing", reward: "Short break", type: "minutes", targetMinutes: 10 },
    { id: uid(), name: "Emotional regulation", trigger: "Notice agitation", tinyAction: "60 seconds slow breathing + label emotion", reward: "Relief", type: "yesno" },
    { id: uid(), name: "Admin sprint", trigger: "After lunch", tinyAction: "10 minutes paperwork", reward: "Stop when timer ends", type: "minutes", targetMinutes: 10 },
  ],
  productivity: { oneThing: "", listA: [""], listB: [""], inbox: [""], calendarRule: "Schedule actions, not intentions." },
  emotions: {
    tools: [
      { id: uid(), name: "90 second rule", how: "Breathe, wait, do not feed the story." },
      { id: uid(), name: "HALT", how: "Hungry Angry Lonely Tired. Fix input first." },
      { id: uid(), name: "Name it to tame it", how: "Label emotion. Ask what it wants you to do." },
    ],
    checkin: { hunger: 5, anger: 2, lonely: 3, tired: 6, note: "" },
  },
  goals: {
    identity: "I am a consistent man who finishes what he starts.",
    outcomes: [{ id: uid(), text: "Stable career track" }, { id: uid(), text: "Strong health baseline" }, { id: uid(), text: "Present father" }],
    processes: [{ id: uid(), text: "5 deep work sessions per week" }, { id: uid(), text: "3 workouts per week" }, { id: uid(), text: "1 weekly review" }],
  },
  tracking: { days: {}, weekStartISO: startOfWeekISO() },
};

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch { return DEFAULTS; }
}
function saveState(state) { localStorage.setItem(LS_KEY, JSON.stringify(state)); }
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function prettyDow(d) { return ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d]; }
function formatISOToLabel(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function computeWeekDates(weekStartISO) {
  const start = new Date(weekStartISO + "T00:00:00");
  const out = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const tz = d.getTimezoneOffset() * 60000;
    out.push(new Date(d.getTime() - tz).toISOString().slice(0, 10));
  }
  return out;
}
function scoreColor(score) {
  if (score >= 8) return "bg-emerald-500/15 text-emerald-700 border-emerald-200/60";
  if (score >= 5) return "bg-amber-500/15 text-amber-700 border-amber-200/60";
  return "bg-rose-500/15 text-rose-700 border-rose-200/60";
}
function computeStreak(days, fromISO = todayISO()) {
  let streak = 0;
  const current = new Date(fromISO + "T00:00:00");
  while (true) {
    const tz = current.getTimezoneOffset() * 60000;
    const iso = new Date(current.getTime() - tz).toISOString().slice(0, 10);
    const rec = days?.[iso];
    const done = !!rec?.oneThingDone || Number(rec?.consistency || 0) >= 6;
    if (!done) break;
    streak += 1;
    current.setDate(current.getDate() - 1);
  }
  return streak;
}
function computeXP(days) {
  return Object.values(days || {}).reduce((acc, rec: any) => {
    return acc + (rec?.oneThingDone ? 40 : 0) + Number(rec?.consistency || 0) * 2 + Number(rec?.output || 0) * 2;
  }, 0);
}

// ─── Sub-components ────────────────────────────────────────────

function IconToggle({ checked }) {
  return checked
    ? <motion.span initial={{ scale: 0.7 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400 }}><CheckCircle2 className="h-5 w-5 text-emerald-500" /></motion.span>
    : <Circle className="h-5 w-5 text-muted-foreground/50" />;
}

function Pill({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border/60 px-2.5 py-0.5 text-xs bg-background/70 backdrop-blur-sm font-medium">
      {children}
    </span>
  );
}

function SectionTitle({ icon: Icon, title, subtitle, right }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-xl border border-border/60 bg-gradient-to-br from-background to-muted/40 p-2 shadow-sm">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <div className="text-base font-semibold leading-tight tracking-tight">{title}</div>
          {subtitle ? <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{subtitle}</div> : null}
        </div>
      </div>
      {right}
    </div>
  );
}

function EditableList({ items, onChange, placeholder = "Add item", minItems = 0 }) {
  return (
    <div className="space-y-2">
      {items.map((v, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 8 }}
          className="flex gap-2"
        >
          <Input
            value={v}
            placeholder={placeholder}
            onChange={(e) => {
              const next = [...items];
              next[idx] = e.target.value;
              onChange(next);
            }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const next = items.filter((_, i) => i !== idx);
              onChange(next.length >= minItems ? next : items);
            }}
          >
            ✕
          </Button>
        </motion.div>
      ))}
      <Button variant="secondary" size="sm" onClick={() => onChange([...items, ""])}>
        + Add
      </Button>
    </div>
  );
}

function KPI({ icon: Icon, label, value, hint, progress = 50, soundEnabled }) {
  const toneMap = {
    Streak: "from-orange-500/30 via-rose-500/10 to-transparent border-orange-200/30",
    Level: "from-violet-500/25 via-indigo-500/10 to-transparent border-violet-200/30",
    Habits: "from-emerald-500/25 via-teal-500/10 to-transparent border-emerald-200/30",
    "One Thing": "from-fuchsia-500/25 via-violet-500/10 to-transparent border-fuchsia-200/30",
  };
  const tone = toneMap[label] || "from-slate-500/15 via-slate-500/5 to-transparent border-border/40";
  const [displayed, setDisplayed] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDisplayed(value), 50);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`kpi-card rounded-2xl border bg-gradient-to-br ${tone} bg-background/90 p-3.5`}
    >
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-widest text-muted-foreground/70 font-medium">{label}</div>
        <motion.div whileHover={{ rotate: 15 }} transition={{ type: "spring" }}>
          <Icon className="h-4 w-4 text-muted-foreground/60" />
        </motion.div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={String(displayed)}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="mt-1.5 text-2xl font-bold tracking-tight"
        >
          {displayed}
        </motion.div>
      </AnimatePresence>
      <div className="text-xs text-muted-foreground/70 truncate mt-0.5">{hint}</div>
      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted/80">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
          className="h-full rounded-full progress-gradient shadow-[0_0_6px_hsl(var(--primary)/0.5)]"
        />
      </div>
    </motion.div>
  );
}

function ConfettiParticle({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <motion.div
      className="pointer-events-none fixed rounded-sm z-[60]"
      style={{ width: 8, height: 8, background: color, left: x, top: y }}
      initial={{ scale: 0, rotate: 0, opacity: 1 }}
      animate={{
        scale: [0, 1, 0.8],
        rotate: [0, Math.random() * 360 + 180],
        x: (Math.random() - 0.5) * 180,
        y: [0, -80, 60],
        opacity: [1, 1, 0],
      }}
      transition={{ duration: 1, ease: "easeOut" }}
    />
  );
}

function LootSpinner({ onReward, soundEnabled }) {
  const [spinning, setSpinning] = useState(false);
  const [lastReward, setLastReward] = useState(null);
  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    if (soundEnabled) SFX.loot();
    setTimeout(() => {
      const reward = LOOT_REWARDS[Math.floor(Math.random() * LOOT_REWARDS.length)];
      setLastReward(reward);
      onReward(reward);
      setSpinning(false);
    }, 900);
  };
  return (
    <div className="rounded-2xl border border-border/60 bg-background/80 p-3.5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Loot Spin</div>
          <div className="text-xs text-muted-foreground">Tap for XP and coin rewards.</div>
        </div>
        <motion.button
          type="button"
          onClick={spin}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          animate={spinning ? { rotate: [0, 180, 360, 540, 720], scale: [1, 1.1, 0.95, 1.08, 1] } : {}}
          transition={{ duration: 0.9, ease: "easeInOut" }}
          className={`loot-pulse rounded-xl border bg-gradient-to-br from-amber-400/30 to-orange-500/20 px-3.5 py-2 text-sm font-semibold cursor-pointer ${spinning ? "opacity-80" : ""}`}
        >
          {spinning ? "..." : "Spin ✦"}
        </motion.button>
      </div>
      <AnimatePresence mode="wait">
        {lastReward && !spinning ? (
          <motion.div
            key={lastReward.label}
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className={`mt-3 rounded-xl border bg-gradient-to-br ${lastReward.color} p-2.5 text-xs`}
          >
            <div className="font-bold">{lastReward.label} ✦</div>
            <div className="text-muted-foreground mt-0.5">+{lastReward.xp} XP &middot; +{lastReward.coins} coins</div>
            <div className="text-muted-foreground/80">{lastReward.note}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function AchievementWall({ achievements, soundEnabled }) {
  const prev = useRef({});
  useEffect(() => {
    achievements.forEach((a) => {
      if (a.unlocked && !prev.current[a.id] && soundEnabled) {
        SFX.achievement();
      }
      prev.current[a.id] = a.unlocked;
    });
  }, [achievements, soundEnabled]);

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <SectionTitle icon={Crown} title="Achievement Wall" subtitle="Unlock streak and execution milestones." />
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-2">
        {achievements.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`rounded-xl border p-3 transition-all duration-500 ${
              a.unlocked
                ? "bg-gradient-to-r from-emerald-500/15 to-cyan-500/10 border-emerald-300/40 achievement-unlocked"
                : "bg-muted/20 border-border/50"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold">{a.unlocked ? "✦ " : ""}{a.title}</div>
              {a.unlocked
                ? <Badge variant="success" className="text-xs">Unlocked</Badge>
                : <Badge variant="outline" className="text-xs opacity-60">Locked</Badge>
              }
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">{a.note}</div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-muted/70">
              <motion.div
                className="h-full rounded-full progress-gradient"
                initial={{ width: 0 }}
                animate={{ width: `${a.progress}%` }}
                transition={{ duration: 0.8, delay: i * 0.05 }}
              />
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}

function HeroArena({ level, totalXP, levelProgress, streak, combo, coins }) {
  return (
    <Card className="overflow-hidden rounded-2xl border-primary/20 bg-gradient-to-br from-indigo-500/15 via-violet-500/8 to-emerald-500/15">
      <CardContent className="relative p-5">
        <motion.div
          aria-hidden
          className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-sky-400/25 blur-3xl"
          animate={{ x: [0, -12, 4, 0], y: [0, 14, -8, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="absolute -bottom-10 left-10 h-24 w-24 rounded-full bg-fuchsia-400/25 blur-3xl"
          animate={{ x: [0, 14, -6, 0], y: [0, -10, 6, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="absolute top-1/2 left-1/2 h-20 w-20 rounded-full bg-emerald-400/15 blur-3xl -translate-x-1/2 -translate-y-1/2"
          animate={{ scale: [1, 1.3, 0.9, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium backdrop-blur-sm">
            <Stars className="h-3.5 w-3.5 text-primary" />
            Hero Arena
          </div>
          <div className="mt-3.5 grid grid-cols-2 gap-3">
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="rounded-xl border border-border/60 bg-background/80 backdrop-blur-sm p-3.5"
            >
              <div className="text-xs uppercase tracking-widest text-muted-foreground/70 font-medium">Level</div>
              <div className="text-3xl font-bold mt-1 gradient-text">Lv {level}</div>
              <div className="text-xs text-muted-foreground">{totalXP} XP total</div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="rounded-xl border border-border/60 bg-background/80 backdrop-blur-sm p-3.5"
            >
              <div className="text-xs uppercase tracking-widest text-muted-foreground/70 font-medium">Combo</div>
              <div className="text-3xl font-bold mt-1">
                <span className="gradient-text-warm">x{combo}</span>
              </div>
              <div className="text-xs text-muted-foreground">Streak {streak} days</div>
            </motion.div>
          </div>
          <div className="mt-3 rounded-xl border border-border/60 bg-background/80 backdrop-blur-sm p-3.5">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">XP to next rank</span>
              <span className="font-bold text-primary">{levelProgress}%</span>
            </div>
            <Progress value={levelProgress} />
            <div className="mt-2.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Gem className="h-3.5 w-3.5 text-amber-500" />
              <span className="font-semibold text-foreground">{coins}</span> coins collected
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FocusSprint({ soundEnabled }) {
  const TOTAL = 25 * 60;
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds((s) => (s <= 0 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [running]);
  useEffect(() => {
    if (seconds === 0) {
      setRunning(false);
      if (soundEnabled) SFX.celebrate();
    }
  }, [seconds, soundEnabled]);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const progress = Math.round(((TOTAL - seconds) / TOTAL) * 100);
  return (
    <Card className="rounded-2xl bg-gradient-to-br from-violet-500/12 via-background to-sky-500/8">
      <CardHeader>
        <SectionTitle icon={Zap} title="Focus Sprint" subtitle="25-minute execution block." />
      </CardHeader>
      <CardContent className="space-y-3.5">
        <motion.div
          className="text-5xl font-bold tabular-nums tracking-tight gradient-text"
          animate={running ? { opacity: [1, 0.8, 1] } : {}}
          transition={{ duration: 1, repeat: Infinity }}
        >
          {mm}:{ss}
        </motion.div>
        <Progress value={progress} />
        <div className="text-xs text-muted-foreground">{progress}% complete</div>
        <div className="flex gap-2">
          <Button
            variant={running ? "secondary" : "default"}
            onClick={() => {
              if (soundEnabled) SFX.click();
              setRunning((v) => !v);
            }}
          >
            {running ? "⏸ Pause" : "▶ Start"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (soundEnabled) SFX.click();
              setRunning(false);
              setSeconds(25 * 60);
            }}
          >
            ↺ Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ExportImport({ state, setState }) {
  const [open, setOpen] = useState(false);
  const [blob, setBlob] = useState("");
  const [err, setErr] = useState("");
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Wand2 className="h-3.5 w-3.5" />
        Backup
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Backup and Restore</DialogTitle>
            <DialogDescription>Export your LifeOS data to JSON, or paste JSON to restore.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => { setErr(""); setBlob(JSON.stringify(state, null, 2)); }}>
                <Download className="h-4 w-4" /> Export to JSON
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setErr("");
                  try {
                    const parsed = JSON.parse(blob);
                    setState({ ...DEFAULTS, ...parsed });
                    setOpen(false);
                  } catch { setErr("Invalid JSON. Fix it and try again."); }
                }}
              >
                <Upload className="h-4 w-4" /> Restore from JSON
              </Button>
              <Button variant="outline" onClick={() => { setErr(""); setState(DEFAULTS); setOpen(false); }}>
                Reset to Defaults
              </Button>
            </div>
            {err ? <div className="text-sm text-rose-600 font-medium">{err}</div> : null}
            <Textarea className="min-h-[320px] font-mono text-xs" value={blob} placeholder="Export JSON appears here." onChange={(e) => setBlob(e.target.value)} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DecisionWizard({ filters, values, onResult, soundEnabled }) {
  const [open, setOpen] = useState(false);
  const [decision, setDecision] = useState("");
  const [scores, setScores] = useState(() => Object.fromEntries(filters.map((f) => [f.id, 5])));
  const [valuePick, setValuePick] = useState(values?.[0]?.id || "");
  const [notes, setNotes] = useState("");
  useEffect(() => {
    if (!values.find((v) => v.id === valuePick)) setValuePick(values?.[0]?.id || "");
  }, [values, valuePick]);
  const avg = useMemo(() => {
    const arr = filters.map((f) => scores[f.id] ?? 5);
    return Math.round((arr.reduce((a, b) => a + b, 0) / Math.max(1, arr.length)) * 10) / 10;
  }, [filters, scores]);
  const verdict = useMemo(() => {
    if (!decision.trim()) return { label: "Enter a decision to evaluate", tone: "muted" };
    if (avg >= 8) return { label: "Likely YES ✓", tone: "good" };
    if (avg >= 6) return { label: "Maybe — tighten the plan", tone: "mid" };
    if (avg >= 4) return { label: "Probably NOT NOW", tone: "mid" };
    return { label: "Likely NO ✗", tone: "bad" };
  }, [avg, decision]);
  const toneClass = verdict.tone === "good" ? "border-emerald-200/60 bg-emerald-500/10 text-emerald-700"
    : verdict.tone === "bad" ? "border-rose-200/60 bg-rose-500/10 text-rose-700"
    : verdict.tone === "mid" ? "border-amber-200/60 bg-amber-500/10 text-amber-700"
    : "border-border/60 bg-muted/40 text-muted-foreground";
  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => { if (soundEnabled) SFX.click(); setOpen(true); }}>
        <Shield className="h-3.5 w-3.5" /> Decision
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Decision Wizard</DialogTitle>
            <DialogDescription>Rate the decision through your filters to get a cleaner signal.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <div className="text-sm font-medium">Decision</div>
              <Input value={decision} onChange={(e) => setDecision(e.target.value)} placeholder="Example: Take on a new commitment" />
            </div>
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Filter scores</div>
                <div className={`rounded-xl border px-3 py-1 text-sm font-semibold ${toneClass}`}>
                  {verdict.label} (avg {avg})
                </div>
              </div>
              <Select value={valuePick} onValueChange={setValuePick}>
                <SelectTrigger><SelectValue placeholder="Pick a value" /></SelectTrigger>
                <SelectContent>
                  {values.map((v) => <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="grid gap-2">
                {filters.map((f) => (
                  <div key={f.id} className="rounded-2xl border border-border/60 p-3 bg-background/80">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-sm">{f.key}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{f.prompt}</div>
                      </div>
                      <Badge variant="secondary" className="shrink-0">{scores[f.id] ?? 5}/10</Badge>
                    </div>
                    <div className="mt-3">
                      <Slider
                        value={[scores[f.id] ?? 5]}
                        min={0} max={10} step={1}
                        onValueChange={(val) => {
                          if (soundEnabled) SFX.slider();
                          setScores((s) => ({ ...s, [f.id]: val[0] }));
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What is the hidden cost? What is the real fear?" />
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    onResult({ id: uid(), ts: new Date().toISOString(), decision, avg, verdict: verdict.label, primaryValueId: valuePick, scores, notes });
                    if (soundEnabled) SFX.success();
                    setDecision(""); setNotes("");
                    setScores(Object.fromEntries(filters.map((x) => [x.id, 5])));
                    setOpen(false);
                  }}
                  disabled={!decision.trim()}
                >
                  Save decision log
                </Button>
                <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Main App ──────────────────────────────────────────────────
export default function LifeOSApp() {
  const [state, setState] = useState(() => loadState());
  const [activeTab, setActiveTab] = useState("dashboard");
  const [theme, setTheme] = useState<(typeof THEMES)[number]>("sunrise");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [celebrate, setCelebrate] = useState(false);
  const [celebrateMsg, setCelebrateMsg] = useState("Nice move.");
  const [confetti, setConfetti] = useState<{ x: number; y: number; color: string; id: number }[]>([]);
  const [missionIndex, setMissionIndex] = useState(() => seedFromISO(todayISO()) % DAILY_MISSIONS.length);
  const [decisionLogs, setDecisionLogs] = useState(() => {
    try { const raw = localStorage.getItem(LS_DECISIONS); return raw ? JSON.parse(raw) : []; } catch { return []; }
  });

  useEffect(() => { saveState(state); }, [state]);
  useEffect(() => { localStorage.setItem(LS_DECISIONS, JSON.stringify(decisionLogs)); }, [decisionLogs]);

  const today = todayISO();
  const weekDates = useMemo(() => computeWeekDates(state.tracking.weekStartISO), [state.tracking.weekStartISO]);
  const day = state.tracking.days[today] || {
    oneThingDone: false, consistency: 5, output: 5, notes: "", habit: {}, oneThing: state.productivity.oneThing || "",
  };
  const weekChart = useMemo(() => weekDates.map((d) => {
    const rec = state.tracking.days[d];
    return { date: formatISOToLabel(d), consistency: rec?.consistency ?? 0, output: rec?.output ?? 0 };
  }), [weekDates, state.tracking.days]);

  const habitCompletionToday = useMemo(() => {
    const total = state.habits.length;
    if (total === 0) return 0;
    const done = state.habits.filter((h) => {
      const r = day.habit?.[h.id];
      if (!r) return false;
      if (h.type === "yesno") return !!r.done;
      return Number(r.minutes || 0) >= Number(h.targetMinutes || 0);
    }).length;
    return Math.round((done / total) * 100);
  }, [state.habits, day.habit]);

  const oneThingProgress = useMemo(() => (day.oneThingDone ? 100 : 35), [day.oneThingDone]);
  const streak = useMemo(() => computeStreak(state.tracking.days, today), [state.tracking.days, today]);
  const baseXP = useMemo(() => computeXP(state.tracking.days), [state.tracking.days]);
  const bonusXP = Number(state.meta?.bonusXP || 0);
  const coins = Number(state.meta?.coins || 0);
  const xp = baseXP + bonusXP;
  const level = useMemo(() => Math.max(1, Math.floor(xp / 250) + 1), [xp]);
  const levelFloorXP = (level - 1) * 250;
  const levelProgress = Math.round(((xp - levelFloorXP) / 250) * 100);
  const combo = Math.max(1, Math.min(12, Math.round(streak * 0.8 + habitCompletionToday / 20 + (day.oneThingDone ? 2 : 0))));

  const achievements = [
    { id: "starter", title: "Ignition", note: "Reach 100 XP total.", unlocked: xp >= 100, progress: Math.min(100, Math.round((xp / 100) * 100)) },
    { id: "streak3", title: "Rhythm Builder", note: "Hit a 3-day streak.", unlocked: streak >= 3, progress: Math.min(100, Math.round((streak / 3) * 100)) },
    { id: "habit50", title: "Habit Engine", note: "Reach 50% habits in a day.", unlocked: habitCompletionToday >= 50, progress: Math.min(100, habitCompletionToday * 2) },
    { id: "focus-lock", title: "Focus Lock", note: "Complete the One Thing.", unlocked: !!day.oneThingDone, progress: day.oneThingDone ? 100 : 35 },
  ];

  const triggerCelebrate = useCallback((msg: string, celebrate = true) => {
    setCelebrateMsg(msg);
    setCelebrate(true);
    if (soundEnabled && celebrate) SFX.celebrate();
    if (celebrate) {
      const colors = ["#8b5cf6","#06b6d4","#f59e0b","#10b981","#f97316","#ec4899"];
      const cx = window.innerWidth / 2, cy = window.innerHeight / 3;
      setConfetti(Array.from({ length: 18 }, (_, i) => ({
        id: Date.now() + i,
        x: cx + (Math.random() - 0.5) * 60,
        y: cy,
        color: colors[i % colors.length],
      })));
      setTimeout(() => setConfetti([]), 1200);
    }
    setTimeout(() => setCelebrate(false), 2200);
  }, [soundEnabled]);

  const setDayPatch = useCallback((patch) => {
    setState((s) => {
      const prev = s.tracking.days[today] || { oneThingDone: false, consistency: 5, output: 5, notes: "", habit: {}, oneThing: s.productivity.oneThing || "" };
      const next = { ...prev, ...patch };
      const becameDone = !prev.oneThingDone && !!next.oneThingDone;
      if (becameDone) triggerCelebrate("One Thing completed. Keep momentum.", true);
      return { ...s, tracking: { ...s.tracking, days: { ...s.tracking.days, [today]: next } } };
    });
  }, [today, triggerCelebrate]);

  const applyLootReward = useCallback((reward) => {
    setState((s) => ({
      ...s,
      meta: { ...s.meta, bonusXP: Number(s.meta?.bonusXP || 0) + Number(reward.xp || 0), coins: Number(s.meta?.coins || 0) + Number(reward.coins || 0) },
    }));
    if (soundEnabled) SFX.loot();
    setCelebrateMsg(`✦ ${reward.label}: +${reward.xp} XP · +${reward.coins} coins`);
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 2000);
  }, [soundEnabled]);

  const toggleHabit = useCallback((habitId, nextDone) => {
    if (soundEnabled) SFX.toggle();
    setState((s) => {
      const rec = s.tracking.days[today] || { oneThingDone: false, consistency: 5, output: 5, notes: "", habit: {}, oneThing: s.productivity.oneThing || "" };
      return {
        ...s,
        tracking: {
          ...s.tracking,
          days: {
            ...s.tracking.days,
            [today]: { ...rec, habit: { ...rec.habit, [habitId]: { ...(rec.habit?.[habitId] || {}), done: nextDone } } },
          },
        },
      };
    });
  }, [today, soundEnabled]);

  const setHabitMinutes = useCallback((habitId, minutes) => {
    setState((s) => {
      const rec = s.tracking.days[today] || { oneThingDone: false, consistency: 5, output: 5, notes: "", habit: {}, oneThing: s.productivity.oneThing || "" };
      return {
        ...s,
        tracking: {
          ...s.tracking,
          days: {
            ...s.tracking.days,
            [today]: { ...rec, habit: { ...rec.habit, [habitId]: { ...(rec.habit?.[habitId] || {}), minutes: clamp(Number(minutes || 0), 0, 1000) } } },
          },
        },
      };
    });
  }, [today]);

  const bumpWeek = useCallback((dir: number) => {
    const start = new Date(state.tracking.weekStartISO + "T00:00:00");
    start.setDate(start.getDate() + dir * 7);
    const tz = start.getTimezoneOffset() * 60000;
    const iso = new Date(start.getTime() - tz).toISOString().slice(0, 10);
    setState((s) => ({ ...s, tracking: { ...s.tracking, weekStartISO: iso } }));
  }, [state.tracking.weekStartISO]);

  const wrapperTone = theme === "sunrise"
    ? "bg-[radial-gradient(ellipse_90%_60%_at_80%_0%,_rgba(251,146,60,0.18),transparent_60%),radial-gradient(ellipse_60%_50%_at_0%_100%,_rgba(14,165,233,0.14),transparent_50%)]"
    : theme === "ocean"
    ? "bg-[radial-gradient(ellipse_90%_60%_at_80%_0%,_rgba(6,182,212,0.18),transparent_60%),radial-gradient(ellipse_60%_50%_at_0%_100%,_rgba(16,185,129,0.14),transparent_50%)]"
    : "bg-[radial-gradient(ellipse_90%_60%_at_80%_0%,_rgba(244,114,182,0.18),transparent_60%),radial-gradient(ellipse_60%_50%_at_0%_100%,_rgba(251,146,60,0.14),transparent_50%)]";

  const currentMission = DAILY_MISSIONS[missionIndex];

  const headerRight = (
    <div className="flex flex-wrap items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => { setSoundEnabled(v => !v); if (soundEnabled) SFX.click(); }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-background/80 px-2.5 py-1.5 text-xs font-medium hover:bg-muted/60 transition-colors"
          >
            {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5 text-muted-foreground/50" />}
            <span className="hidden sm:inline">{soundEnabled ? "Sound on" : "Sound off"}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent>Toggle sound effects</TooltipContent>
      </Tooltip>
      <Badge variant="outline" className="bg-background/70 text-xs">
        <Gem className="h-3 w-3 text-amber-500 mr-1" /> {coins}
      </Badge>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          if (soundEnabled) SFX.click();
          setTheme((t) => THEMES[(THEMES.indexOf(t) + 1) % THEMES.length]);
        }}
      >
        {theme === "sunrise" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
        <span className="hidden sm:inline capitalize">{theme}</span>
      </Button>
      <DecisionWizard
        filters={state.filters}
        values={state.values}
        onResult={(log) => setDecisionLogs((d) => [log, ...d].slice(0, 200))}
        soundEnabled={soundEnabled}
      />
      <ExportImport state={state} setState={setState} />
    </div>
  );

  return (
    <TooltipProvider delayDuration={300}>
      <div className={`relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-background via-background to-muted/10 ${wrapperTone}`}>
        {/* Background layer */}
        <div className="pointer-events-none absolute inset-0">
          <div className="lifeos-grid absolute inset-0 opacity-40" />
          <motion.div
            aria-hidden className="orb absolute -left-24 top-16 h-72 w-72 bg-orange-300/20"
            animate={{ x: [0, 28, -10, 0], y: [0, -22, 14, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            aria-hidden className="orb absolute right-0 top-1/3 h-80 w-80 bg-cyan-300/15"
            animate={{ x: [0, -18, 14, 0], y: [0, 20, -12, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            aria-hidden className="orb absolute bottom-0 left-1/3 h-64 w-64 bg-violet-300/12"
            animate={{ x: [0, 12, -8, 0], y: [0, -15, 8, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* Confetti */}
        <AnimatePresence>
          {confetti.map((p) => <ConfettiParticle key={p.id} x={p.x} y={p.y} color={p.color} />)}
        </AnimatePresence>

        <div className="relative mx-auto max-w-6xl px-4 py-6 pb-28">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="flex flex-col gap-6"
          >
            {/* Header */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                  <div className="inline-flex items-center gap-2.5">
                    <motion.div
                      animate={{ rotate: [0, 8, -4, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Sparkles className="h-6 w-6 text-primary" />
                    </motion.div>
                    <div className="text-3xl font-bold tracking-tight gradient-text">LifeOS</div>
                    <Badge variant="glow" className="text-xs">v{state.meta.version}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-0.5 max-w-md">
                    A practical operating system for values, decisions, routines, habits, emotions, and goals.
                  </div>
                </motion.div>
                {headerRight}
              </div>

              {/* KPI row */}
              <motion.div
                className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <KPI icon={Flame} label="Streak" value={`${streak}d`} hint="No zero days" progress={Math.min(100, streak * 20)} soundEnabled={soundEnabled} />
                <KPI icon={Trophy} label="Level" value={`Lv ${level}`} hint={`${xp} XP earned`} progress={levelProgress} soundEnabled={soundEnabled} />
                <KPI icon={Target} label="Habits" value={`${habitCompletionToday}%`} hint="Today completion" progress={habitCompletionToday} soundEnabled={soundEnabled} />
                <KPI icon={Timer} label="One Thing" value={day.oneThingDone ? "Done ✓" : "In progress"} hint={day.oneThing || "Set your One Thing"} progress={oneThingProgress} soundEnabled={soundEnabled} />
              </motion.div>

              {/* Quick tabs + mission */}
              <div className="mt-1 flex flex-wrap gap-2">
                {[
                  { id: "dashboard", label: "Daily" },
                  { id: "kernel", label: "Values" },
                  { id: "productivity", label: "Focus" },
                  { id: "logs", label: "Logs" },
                ].map((t) => (
                  <Button
                    key={t.id}
                    size="sm"
                    variant={activeTab === t.id ? "default" : "outline"}
                    onClick={() => { if (soundEnabled) SFX.tab(); setActiveTab(t.id); }}
                  >
                    {t.label}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => { if (soundEnabled) SFX.click(); setMissionIndex((m) => (m + 1) % DAILY_MISSIONS.length); }}
                >
                  <Rocket className="h-3.5 w-3.5" /> Mission
                </Button>
              </div>

              {/* Hero + Loot */}
              <div className="mt-2 grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <HeroArena level={level} totalXP={xp} levelProgress={levelProgress} streak={streak} combo={combo} coins={coins} />
                </div>
                <div className="space-y-3">
                  <LootSpinner onReward={applyLootReward} soundEnabled={soundEnabled} />
                  <div className="rounded-2xl border border-border/60 bg-background/75 p-3.5">
                    <div className="text-sm font-semibold">Mission Reward</div>
                    <div className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Finish your Daily Mission and mark One Thing done to stack your combo multiplier.
                    </div>
                  </div>
                </div>
              </div>

              {/* Full tab set */}
              <Tabs value={activeTab} onValueChange={(v) => { if (soundEnabled) SFX.tab(); setActiveTab(v); }} className="mt-1">
                <TabsList className="flex flex-wrap">
                  <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                  <TabsTrigger value="kernel">Values &amp; Principles</TabsTrigger>
                  <TabsTrigger value="filters">Decision Filters</TabsTrigger>
                  <TabsTrigger value="routines">Routines</TabsTrigger>
                  <TabsTrigger value="habits">Habits</TabsTrigger>
                  <TabsTrigger value="productivity">Productivity</TabsTrigger>
                  <TabsTrigger value="emotions">Emotions</TabsTrigger>
                  <TabsTrigger value="goals">Goals</TabsTrigger>
                  <TabsTrigger value="logs">Logs</TabsTrigger>
                </TabsList>

                {/* ── Dashboard ── */}
                <TabsContent value="dashboard" className="mt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <Card className="lg:col-span-2 rounded-2xl">
                      <CardHeader>
                        <SectionTitle
                          icon={Timer}
                          title={`Today · ${formatISOToLabel(today)}`}
                          subtitle="Track the minimum standard. Build reliability."
                          right={
                            <div className="flex items-center gap-2 flex-wrap">
                              <Pill>Habits {habitCompletionToday}%</Pill>
                              <Pill>OT {day.oneThingDone ? "✓" : "…"}</Pill>
                            </div>
                          }
                        />
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-2">
                          <div className="text-sm font-semibold">One Thing</div>
                          <div className="flex flex-col md:flex-row gap-2">
                            <Input
                              value={day.oneThing ?? ""}
                              placeholder="Define the one priority output for today"
                              onChange={(e) => setDayPatch({ oneThing: e.target.value })}
                            />
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={!!day.oneThingDone}
                                onCheckedChange={(v) => { if (soundEnabled) SFX.toggle(); setDayPatch({ oneThingDone: v }); }}
                              />
                              <span className="text-sm font-medium">Done</span>
                            </div>
                          </div>
                          <Progress value={oneThingProgress} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            { key: "consistency", label: "Consistency score", hint: "Did you show up? Did you hit minimum standards?" },
                            { key: "output", label: "Output score", hint: "Did the day move life forward in visible outputs?" },
                          ].map(({ key, label, hint }) => (
                            <div key={key} className="rounded-2xl border border-border/60 p-3.5 bg-background/80">
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-semibold">{label}</div>
                                <Badge variant="secondary">{day[key] ?? 5}/10</Badge>
                              </div>
                              <div className="mt-3">
                                <Slider
                                  value={[day[key] ?? 5]}
                                  min={0} max={10} step={1}
                                  onValueChange={(val) => {
                                    if (soundEnabled) SFX.slider();
                                    setDayPatch({ [key]: val[0] });
                                  }}
                                />
                              </div>
                              <div className="mt-2 text-xs text-muted-foreground">{hint}</div>
                            </div>
                          ))}
                        </div>
                        <div className="grid gap-2">
                          <div className="text-sm font-semibold">Notes</div>
                          <Textarea value={day.notes ?? ""} onChange={(e) => setDayPatch({ notes: e.target.value })} placeholder="Quick reflection: friction, wins, what to patch" />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <div className="text-sm font-semibold">This week</div>
                            <div className="text-xs text-muted-foreground">Consistency and output trend.</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => bumpWeek(-1)}>← Prev</Button>
                            <Button variant="outline" size="sm" onClick={() => bumpWeek(1)}>Next →</Button>
                            <Button variant="secondary" size="sm" onClick={() => setState((s) => ({ ...s, tracking: { ...s.tracking, weekStartISO: startOfWeekISO() } }))}>This week</Button>
                          </div>
                        </div>
                        <div className="h-[240px] w-full rounded-2xl border border-border/60 bg-background/80 p-3">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={weekChart}>
                              <defs>
                                <linearGradient id="grad-c" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25} />
                                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="grad-o" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                              <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                              <ReTooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--background))" }} />
                              <Area type="monotone" dataKey="consistency" stroke="#0ea5e9" fill="url(#grad-c)" strokeWidth={2.5} dot={false} />
                              <Area type="monotone" dataKey="output" stroke="#f97316" fill="url(#grad-o)" strokeWidth={2.5} dot={false} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Right column */}
                    <div className="space-y-4">
                      {/* Daily Mission */}
                      <Card className="rounded-2xl">
                        <CardHeader>
                          <SectionTitle icon={Sparkles} title="Daily Mission" subtitle="Small challenge to build momentum." />
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={currentMission}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              className="rounded-2xl border border-border/60 bg-gradient-to-br from-muted/30 to-background p-3.5 text-sm font-medium leading-relaxed"
                            >
                              {currentMission}
                            </motion.div>
                          </AnimatePresence>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={day.missionDone ? "secondary" : "default"}
                              onClick={() => {
                                if (!day.missionDone && !day.missionRewarded) {
                                  applyLootReward({ label: "Mission Clear", xp: 25, coins: 15, note: "Daily mission complete." });
                                  setDayPatch({ missionDone: true, missionRewarded: true });
                                  return;
                                }
                                if (soundEnabled) SFX.click();
                                setDayPatch({ missionDone: !day.missionDone });
                              }}
                            >
                              {day.missionDone ? "✓ Done" : "Mark Done"}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { if (soundEnabled) SFX.click(); setMissionIndex((m) => (m + 1) % DAILY_MISSIONS.length); }}>Swap</Button>
                          </div>
                        </CardContent>
                      </Card>

                      <AchievementWall achievements={achievements} soundEnabled={soundEnabled} />

                      {/* Habits today */}
                      <Card className="rounded-2xl">
                        <CardHeader>
                          <SectionTitle icon={Flame} title="Habits today" subtitle="Track it honestly." />
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <Progress value={habitCompletionToday} />
                          <div className="grid gap-2">
                            {state.habits.map((h) => {
                              const rec = day.habit?.[h.id] || {};
                              const doneYesNo = !!rec.done;
                              const mins = Number(rec.minutes || 0);
                              const isDone = h.type === "yesno" ? doneYesNo : mins >= Number(h.targetMinutes || 0);
                              return (
                                <motion.div
                                  key={h.id}
                                  className={`rounded-2xl border p-3 transition-all duration-300 ${isDone ? "bg-emerald-500/8 border-emerald-200/40" : "bg-background/80 border-border/60"}`}
                                  animate={isDone ? { scale: [1, 1.02, 1] } : {}}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <div className="font-semibold text-sm">{h.name}</div>
                                      <div className="text-xs text-muted-foreground">↳ {h.trigger}</div>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant={isDone ? "secondary" : "outline"}
                                      onClick={() => toggleHabit(h.id, !doneYesNo)}
                                    >
                                      <IconToggle checked={isDone} />
                                      {isDone ? "Done" : "Mark"}
                                    </Button>
                                  </div>
                                  {h.type === "minutes" ? (
                                    <div className="mt-2.5">
                                      <div className="flex items-center justify-between mb-1.5">
                                        <div className="text-xs text-muted-foreground">Minutes logged</div>
                                        <Badge variant={isDone ? "success" : "secondary"} className="text-xs">{mins}/{h.targetMinutes}</Badge>
                                      </div>
                                      <Input
                                        type="number"
                                        value={mins}
                                        onChange={(e) => setHabitMinutes(h.id, e.target.value)}
                                        min={0}
                                        className="h-8 text-sm"
                                      />
                                    </div>
                                  ) : null}
                                </motion.div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>

                      <FocusSprint soundEnabled={soundEnabled} />

                      {/* HALT check-in */}
                      <Card className="rounded-2xl">
                        <CardHeader>
                          <SectionTitle icon={HeartPulse} title="Quick HALT check" subtitle="Stability first, then action." />
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            {[["hunger","Hungry"],["anger","Angry"],["lonely","Lonely"],["tired","Tired"]].map(([k, label]) => (
                              <div key={k} className="rounded-2xl border border-border/60 p-3 bg-background/80">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm font-semibold">{label}</div>
                                  <Badge variant="secondary">{state.emotions.checkin[k]}/10</Badge>
                                </div>
                                <div className="mt-3">
                                  <Slider
                                    value={[state.emotions.checkin[k]]}
                                    min={0} max={10} step={1}
                                    onValueChange={(val) => {
                                      if (soundEnabled) SFX.slider();
                                      setState((s) => ({ ...s, emotions: { ...s.emotions, checkin: { ...s.emotions.checkin, [k]: val[0] } } }));
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                          <Textarea
                            value={state.emotions.checkin.note}
                            onChange={(e) => setState((s) => ({ ...s, emotions: { ...s.emotions, checkin: { ...s.emotions.checkin, note: e.target.value } } }))}
                            placeholder="One line: what do you need right now?"
                          />
                          <div className="rounded-2xl border border-border/60 bg-muted/20 p-3 text-sm">
                            <div className="font-semibold">Default move</div>
                            <div className="text-muted-foreground text-xs mt-0.5">Fix body inputs first. Then pick the smallest next action.</div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                {/* ── Values & Principles ── */}
                <TabsContent value="kernel" className="mt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card className="rounded-2xl">
                      <CardHeader>
                        <SectionTitle icon={Brain} title="Values (Kernel)" subtitle="What you refuse to betray. Define proof behaviors." />
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {state.values.map((v, idx) => (
                          <motion.div key={v.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }} className="rounded-2xl border border-border/60 p-3.5 bg-background/80">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <Badge variant="secondary">#{idx + 1}</Badge>
                              <Button variant="ghost" size="sm" onClick={() => setState((s) => ({ ...s, values: s.values.filter((x) => x.id !== v.id) }))}>✕</Button>
                            </div>
                            <div className="grid gap-2">
                              <Input value={v.label} onChange={(e) => setState((s) => ({ ...s, values: s.values.map((x) => x.id === v.id ? { ...x, label: e.target.value } : x) }))} placeholder="Value name" />
                              <Input value={v.why} onChange={(e) => setState((s) => ({ ...s, values: s.values.map((x) => x.id === v.id ? { ...x, why: e.target.value } : x) }))} placeholder="Why this matters" />
                              <Textarea value={v.proof} onChange={(e) => setState((s) => ({ ...s, values: s.values.map((x) => x.id === v.id ? { ...x, proof: e.target.value } : x) }))} placeholder="Proof behavior (observable)" className="min-h-[60px]" />
                            </div>
                          </motion.div>
                        ))}
                        <Button size="sm" onClick={() => setState((s) => ({ ...s, values: [...s.values, { id: uid(), label: "", why: "", proof: "" }] }))}>+ Add value</Button>
                      </CardContent>
                    </Card>
                    <Card className="rounded-2xl">
                      <CardHeader>
                        <SectionTitle icon={BookOpen} title="Principles" subtitle="Rules of the machine. Short, memorable, actionable." />
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {state.principles.map((p, idx) => (
                          <motion.div key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }} className="rounded-2xl border border-border/60 p-3.5 bg-background/80">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-xs text-muted-foreground font-medium">Principle</div>
                              <Button variant="ghost" size="sm" onClick={() => setState((s) => ({ ...s, principles: s.principles.filter((x) => x.id !== p.id) }))}>✕</Button>
                            </div>
                            <div className="grid gap-2">
                              <Input value={p.label} onChange={(e) => setState((s) => ({ ...s, principles: s.principles.map((x) => x.id === p.id ? { ...x, label: e.target.value } : x) }))} placeholder="Principle" />
                              <Input value={p.note} onChange={(e) => setState((s) => ({ ...s, principles: s.principles.map((x) => x.id === p.id ? { ...x, note: e.target.value } : x) }))} placeholder="What it means in practice" />
                            </div>
                          </motion.div>
                        ))}
                        <Button size="sm" onClick={() => setState((s) => ({ ...s, principles: [...s.principles, { id: uid(), label: "", note: "" }] }))}>+ Add principle</Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* ── Decision Filters ── */}
                <TabsContent value="filters" className="mt-4">
                  <Card className="rounded-2xl">
                    <CardHeader>
                      <SectionTitle icon={Shield} title="Decision Filters" subtitle="Your mental firewall. Make choices with less chaos." />
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {state.filters.map((f) => (
                          <div key={f.id} className="rounded-2xl border border-border/60 p-3.5 bg-background/80">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="secondary">{f.key || "Filter"}</Badge>
                              <Button variant="ghost" size="sm" onClick={() => setState((s) => ({ ...s, filters: s.filters.filter((x) => x.id !== f.id) }))}>✕</Button>
                            </div>
                            <div className="grid gap-2">
                              <Input value={f.key} onChange={(e) => setState((s) => ({ ...s, filters: s.filters.map((x) => x.id === f.id ? { ...x, key: e.target.value } : x) }))} placeholder="Filter name" />
                              <Textarea value={f.prompt} onChange={(e) => setState((s) => ({ ...s, filters: s.filters.map((x) => x.id === f.id ? { ...x, prompt: e.target.value } : x) }))} placeholder="Prompt question" className="min-h-[60px]" />
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button size="sm" onClick={() => setState((s) => ({ ...s, filters: [...s.filters, { id: uid(), key: "", prompt: "" }] }))}>+ Add filter</Button>
                      <Separator />
                      <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div>
                            <div className="font-semibold">Use the Decision Wizard</div>
                            <div className="text-sm text-muted-foreground">Rate a decision through your filters.</div>
                          </div>
                          <DecisionWizard filters={state.filters} values={state.values} onResult={(log) => setDecisionLogs((d) => [log, ...d].slice(0, 200))} soundEnabled={soundEnabled} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* ── Routines ── */}
                <TabsContent value="routines" className="mt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card className="rounded-2xl">
                      <CardHeader>
                        <SectionTitle icon={CalendarDays} title="Daily anchors" subtitle="Short rituals that stabilize your day." />
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {state.routines.dailyAnchors.map((a) => (
                          <div key={a.id} className="rounded-2xl border border-border/60 p-3.5 bg-background/80">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-semibold text-sm">{a.label}</div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">{a.durationMin}m</Badge>
                                <Button variant="ghost" size="sm" onClick={() => setState((s) => ({ ...s, routines: { ...s.routines, dailyAnchors: s.routines.dailyAnchors.filter((x) => x.id !== a.id) } }))}>✕</Button>
                              </div>
                            </div>
                            <div className="grid gap-2">
                              <Input value={a.label} onChange={(e) => setState((s) => ({ ...s, routines: { ...s.routines, dailyAnchors: s.routines.dailyAnchors.map((x) => x.id === a.id ? { ...x, label: e.target.value } : x) } }))} placeholder="Anchor name" />
                              <Input type="number" value={a.durationMin} onChange={(e) => setState((s) => ({ ...s, routines: { ...s.routines, dailyAnchors: s.routines.dailyAnchors.map((x) => x.id === a.id ? { ...x, durationMin: Number(e.target.value || 0) } : x) } }))} placeholder="Minutes" />
                              <div className="text-xs font-medium text-muted-foreground">Steps</div>
                              <EditableList items={a.steps} onChange={(next) => setState((s) => ({ ...s, routines: { ...s.routines, dailyAnchors: s.routines.dailyAnchors.map((x) => x.id === a.id ? { ...x, steps: next } : x) } }))} placeholder="Step" minItems={1} />
                            </div>
                          </div>
                        ))}
                        <Button size="sm" onClick={() => setState((s) => ({ ...s, routines: { ...s.routines, dailyAnchors: [...s.routines.dailyAnchors, { id: uid(), label: "New anchor", durationMin: 5, steps: ["Step"] }] } }))}>+ Add anchor</Button>
                      </CardContent>
                    </Card>
                    <Card className="rounded-2xl">
                      <CardHeader>
                        <SectionTitle icon={RefreshCw} title="Weekly rhythm" subtitle="Planning and review that patches the system." />
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {[
                          { key: "planning", label: "Weekly planning" },
                          { key: "review", label: "Weekly review" },
                        ].map(({ key, label }) => (
                          <div key={key} className="rounded-2xl border border-border/60 p-3.5 bg-background/80">
                            <div className="font-semibold text-sm mb-2">{label}</div>
                            <div className="grid grid-cols-2 gap-2">
                              <Select value={state.routines.weekly[key].day} onValueChange={(val) => setState((s) => ({ ...s, routines: { ...s.routines, weekly: { ...s.routines.weekly, [key]: { ...s.routines.weekly[key], day: val } } } }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 7 }).map((_, i) => <SelectItem key={i} value={prettyDow(i)}>{prettyDow(i)}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <Input type="number" value={state.routines.weekly[key].minutes} onChange={(e) => setState((s) => ({ ...s, routines: { ...s.routines, weekly: { ...s.routines.weekly, [key]: { ...s.routines.weekly[key], minutes: Number(e.target.value || 0) } } } }))} placeholder="Minutes" />
                            </div>
                          </div>
                        ))}
                        <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                          <div className="font-semibold text-sm">Weekly protocol</div>
                          <div className="mt-1 text-xs text-muted-foreground leading-relaxed">Review what worked, pick 3 must-do tasks, identify one friction point, patch the system.</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* ── Habits ── */}
                <TabsContent value="habits" className="mt-4">
                  <Card className="rounded-2xl">
                    <CardHeader>
                      <SectionTitle icon={Flame} title="Habit system" subtitle="Trigger → tiny action → reward. Track it." />
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {state.habits.map((h) => (
                          <div key={h.id} className="rounded-2xl border border-border/60 p-3.5 bg-background/80">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="secondary">{h.type === "minutes" ? "Minutes" : "Yes/No"}</Badge>
                              <Button variant="ghost" size="sm" onClick={() => setState((s) => ({ ...s, habits: s.habits.filter((x) => x.id !== h.id) }))}>✕</Button>
                            </div>
                            <div className="grid gap-2">
                              <Input value={h.name} onChange={(e) => setState((s) => ({ ...s, habits: s.habits.map((x) => x.id === h.id ? { ...x, name: e.target.value } : x) }))} placeholder="Habit name" />
                              <Input value={h.trigger} onChange={(e) => setState((s) => ({ ...s, habits: s.habits.map((x) => x.id === h.id ? { ...x, trigger: e.target.value } : x) }))} placeholder="Trigger" />
                              <Input value={h.tinyAction} onChange={(e) => setState((s) => ({ ...s, habits: s.habits.map((x) => x.id === h.id ? { ...x, tinyAction: e.target.value } : x) }))} placeholder="Tiny action" />
                              <Input value={h.reward} onChange={(e) => setState((s) => ({ ...s, habits: s.habits.map((x) => x.id === h.id ? { ...x, reward: e.target.value } : x) }))} placeholder="Reward" />
                              {h.type === "minutes" && <Input type="number" value={h.targetMinutes ?? 10} onChange={(e) => setState((s) => ({ ...s, habits: s.habits.map((x) => x.id === h.id ? { ...x, targetMinutes: Number(e.target.value || 0) } : x) }))} placeholder="Target minutes" />}
                              <div className="flex items-center justify-between rounded-xl border border-border/50 p-2 bg-muted/20">
                                <div className="text-xs text-muted-foreground">Track type</div>
                                <Select value={h.type} onValueChange={(val) => setState((s) => ({ ...s, habits: s.habits.map((x) => x.id === h.id ? { ...x, type: val, targetMinutes: val === "minutes" ? (x.targetMinutes ?? 10) : undefined } : x) }))}>
                                  <SelectTrigger className="w-[130px] h-7 text-xs"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="yesno">Yes/No</SelectItem>
                                    <SelectItem value="minutes">Minutes</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button size="sm" onClick={() => setState((s) => ({ ...s, habits: [...s.habits, { id: uid(), name: "New habit", trigger: "", tinyAction: "", reward: "", type: "yesno" }] }))}>+ Add habit</Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* ── Productivity ── */}
                <TabsContent value="productivity" className="mt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card className="rounded-2xl">
                      <CardHeader>
                        <SectionTitle icon={ListTodo} title="One Thing + 2 lists" subtitle="List A moves life forward. List B is everything else." />
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-2">
                          <div className="text-sm font-semibold">Default One Thing</div>
                          <Input value={state.productivity.oneThing} onChange={(e) => setState((s) => ({ ...s, productivity: { ...s.productivity, oneThing: e.target.value } }))} placeholder="Your default One Thing" />
                        </div>
                        <div className="grid gap-2">
                          <div className="text-sm font-semibold">List A <span className="text-xs text-muted-foreground font-normal">(max 3 recommended)</span></div>
                          <EditableList items={state.productivity.listA} onChange={(next) => setState((s) => ({ ...s, productivity: { ...s.productivity, listA: next } }))} placeholder="List A item" minItems={1} />
                        </div>
                        <div className="grid gap-2">
                          <div className="text-sm font-semibold">List B</div>
                          <EditableList items={state.productivity.listB} onChange={(next) => setState((s) => ({ ...s, productivity: { ...s.productivity, listB: next } }))} placeholder="List B item" minItems={1} />
                        </div>
                        <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                          <div className="font-semibold text-sm">Rule</div>
                          <div className="text-xs text-muted-foreground mt-0.5">Do List A before touching List B.</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="rounded-2xl">
                      <CardHeader>
                        <SectionTitle icon={Target} title="Capture, Clarify, Calendar" subtitle="Stop carrying tasks in your head." />
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-2">
                          <div className="text-sm font-semibold">Inbox</div>
                          <EditableList items={state.productivity.inbox} onChange={(next) => setState((s) => ({ ...s, productivity: { ...s.productivity, inbox: next } }))} placeholder="Dump tasks here" minItems={1} />
                        </div>
                        <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                          <div className="font-semibold text-sm">Calendar rule</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{state.productivity.calendarRule}</div>
                        </div>
                        <Textarea value={state.productivity.calendarRule} onChange={(e) => setState((s) => ({ ...s, productivity: { ...s.productivity, calendarRule: e.target.value } }))} placeholder="Edit the rule" className="min-h-[60px]" />
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* ── Emotions ── */}
                <TabsContent value="emotions" className="mt-4">
                  <Card className="rounded-2xl">
                    <CardHeader>
                      <SectionTitle icon={HeartPulse} title="Emotional regulation" subtitle="Stability and recovery protocols." />
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {state.emotions.tools.map((t) => (
                          <div key={t.id} className="rounded-2xl border border-border/60 p-3.5 bg-background/80">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-semibold text-sm">{t.name}</div>
                              <Button variant="ghost" size="sm" onClick={() => setState((s) => ({ ...s, emotions: { ...s.emotions, tools: s.emotions.tools.filter((x) => x.id !== t.id) } }))}>✕</Button>
                            </div>
                            <Textarea className="min-h-[60px]" value={t.how} onChange={(e) => setState((s) => ({ ...s, emotions: { ...s.emotions, tools: s.emotions.tools.map((x) => x.id === t.id ? { ...x, how: e.target.value } : x) } }))} />
                          </div>
                        ))}
                      </div>
                      <Button size="sm" onClick={() => setState((s) => ({ ...s, emotions: { ...s.emotions, tools: [...s.emotions.tools, { id: uid(), name: "New tool", how: "" }] } }))}>+ Add tool</Button>
                      <Separator />
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="debugger">
                          <AccordionTrigger>4-step mental debugger</AccordionTrigger>
                          <AccordionContent>
                            <div className="grid gap-2 text-sm">
                              {[
                                ["1) Name the state", "Label it: anxious, avoiding, overwhelmed."],
                                ["2) Identify the real problem", "Unclear, too big, boring, scary, no next step."],
                                ["3) Shrink the task", "Define a 2 to 5 minute next action."],
                                ["4) Ugly first draft", "Perfectionism is fear with good grammar."],
                              ].map(([title, desc]) => (
                                <div key={title} className="rounded-xl border border-border/50 p-3 bg-muted/20">
                                  <div className="font-semibold">{title}</div>
                                  <div className="text-muted-foreground text-xs mt-0.5">{desc}</div>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* ── Goals ── */}
                <TabsContent value="goals" className="mt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card className="rounded-2xl">
                      <CardHeader>
                        <SectionTitle icon={Target} title="Goal layers" subtitle="Identity, outcomes, processes. Execution beats fantasy." />
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-2">
                          <div className="text-sm font-semibold">Identity goal</div>
                          <Textarea value={state.goals.identity} onChange={(e) => setState((s) => ({ ...s, goals: { ...s.goals, identity: e.target.value } }))} className="min-h-[60px]" />
                        </div>
                        {[
                          { key: "outcomes", label: "Outcome goals", addLabel: "outcome" },
                          { key: "processes", label: "Process goals", addLabel: "process" },
                        ].map(({ key, label, addLabel }) => (
                          <div key={key} className="grid gap-2">
                            <div className="text-sm font-semibold">{label}</div>
                            {state.goals[key].map((g) => (
                              <div key={g.id} className="flex gap-2">
                                <Input value={g.text} onChange={(e) => setState((s) => ({ ...s, goals: { ...s.goals, [key]: s.goals[key].map((x) => x.id === g.id ? { ...x, text: e.target.value } : x) } }))} />
                                <Button variant="outline" size="sm" onClick={() => setState((s) => ({ ...s, goals: { ...s.goals, [key]: s.goals[key].filter((x) => x.id !== g.id) } }))}>✕</Button>
                              </div>
                            ))}
                            <Button size="sm" onClick={() => setState((s) => ({ ...s, goals: { ...s.goals, [key]: [...s.goals[key], { id: uid(), text: "" }] } }))}>+ Add {addLabel}</Button>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                    <Card className="rounded-2xl">
                      <CardHeader>
                        <SectionTitle
                          icon={CalendarDays}
                          title="Weekly scoreboard"
                          subtitle="Two numbers: consistency and output."
                          right={
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge className={scoreColor(day.consistency ?? 0)} variant="outline">
                                  {day.consistency ?? 0}/{day.output ?? 0}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>Today: Consistency / Output</TooltipContent>
                            </Tooltip>
                          }
                        />
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                          <div className="font-semibold text-sm">How to use this</div>
                          <div className="mt-1 text-xs text-muted-foreground">Early on, consistency matters more than results. Output follows.</div>
                        </div>
                        <div className="grid gap-2">
                          {weekDates.map((d) => {
                            const rec = state.tracking.days[d];
                            const c = rec?.consistency ?? 0;
                            const o = rec?.output ?? 0;
                            return (
                              <div key={d} className="flex items-center justify-between rounded-2xl border border-border/60 p-3 bg-background/80">
                                <div className="text-sm font-medium">{formatISOToLabel(d)}</div>
                                <div className="flex items-center gap-2">
                                  <Badge className={scoreColor(c)} variant="outline">C {c}</Badge>
                                  <Badge className={scoreColor(o)} variant="outline">O {o}</Badge>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* ── Logs ── */}
                <TabsContent value="logs" className="mt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card className="rounded-2xl">
                      <CardHeader>
                        <SectionTitle icon={Shield} title="Decision logs" subtitle="Choices you made, with filter scores." />
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {decisionLogs.length === 0 ? (
                          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                            No decision logs yet. Use the Decision Wizard.
                          </div>
                        ) : (
                          <div className="grid gap-3">
                            {decisionLogs.slice(0, 20).map((l) => {
                              const v = state.values.find((x) => x.id === l.primaryValueId);
                              return (
                                <div key={l.id} className="rounded-2xl border border-border/60 p-3.5 bg-background/80">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <div className="font-semibold text-sm">{l.decision}</div>
                                      <div className="text-xs text-muted-foreground mt-0.5">{new Date(l.ts).toLocaleString()} · Avg {l.avg} · {l.verdict}</div>
                                      {v && <div className="mt-1"><Pill>Value: {v.label}</Pill></div>}
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setDecisionLogs((d) => d.filter((x) => x.id !== l.id))}>✕</Button>
                                  </div>
                                  {l.notes && <div className="mt-2 text-xs text-muted-foreground border-t border-border/40 pt-2">{l.notes}</div>}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    <Card className="rounded-2xl">
                      <CardHeader>
                        <SectionTitle icon={BookOpen} title="Operating manual" subtitle="The short version for when life gets loud." />
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-muted/30 to-background p-4 text-sm">
                          <div className="font-semibold mb-2">Minimum standard</div>
                          <ul className="list-disc pl-4 text-muted-foreground space-y-1 text-xs">
                            <li>No zero days. Do something small.</li>
                            <li>One Thing before everything else.</li>
                            <li>Protect health. The machine needs power.</li>
                            <li>When spiraling, HALT then shrink the next action.</li>
                            <li>Patch the system weekly.</li>
                          </ul>
                        </div>
                        <div className="rounded-2xl border border-border/60 p-4 bg-background/80">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-sm">Quick reset button</div>
                              <div className="text-xs text-muted-foreground mt-0.5">When you feel stuck, do this.</div>
                            </div>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                if (soundEnabled) SFX.click();
                                setDayPatch({ notes: (day.notes ? day.notes + "\n\n" : "") + "Reset: name state → identify problem → 2 min next action → start ugly." });
                                setActiveTab("dashboard");
                              }}
                            >
                              Reset protocol
                            </Button>
                          </div>
                          <div className="mt-3 grid gap-1.5 text-xs text-muted-foreground">
                            {["Name the state.", "Identify the real problem.", "Shrink to 2–5 minutes.", "Start ugly."].map((s, i) => (
                              <div key={i}><span className="font-semibold text-foreground">{i + 1})</span> {s}</div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="text-xs text-muted-foreground pb-4">
              Local-only app. Your data stays in your browser via localStorage. Use Backup &amp; Restore for JSON exports.
            </div>
          </motion.div>
        </div>
      </div>

      {/* Celebration toast */}
      <AnimatePresence>
        {celebrate && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="toast-celebrate fixed right-5 top-5 z-[55] rounded-2xl px-4 py-3 shadow-2xl"
          >
            <div className="inline-flex items-center gap-2 text-sm font-semibold">
              <motion.span
                animate={{ rotate: [0, 15, -10, 5, 0] }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <PartyPopper className="h-4 w-4 text-primary" />
              </motion.span>
              {celebrateMsg}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating bottom bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-2xl bottom-bar px-3.5 py-2.5 shadow-xl">
        <Badge variant="outline" className="hidden sm:inline-flex gap-1 text-xs">
          <Gem className="h-3 w-3 text-amber-500" />{coins}
        </Badge>
        <div className="hidden sm:block w-px h-4 bg-border/60" />
        {[
          { id: "dashboard", label: "Daily" },
          { id: "productivity", label: "Focus" },
          { id: "habits", label: "Habits" },
        ].map((t) => (
          <Button
            key={t.id}
            size="sm"
            variant={activeTab === t.id ? "default" : "ghost"}
            onClick={() => { if (soundEnabled) SFX.tab(); setActiveTab(t.id); }}
          >
            {t.label}
          </Button>
        ))}
        <div className="hidden sm:block w-px h-4 bg-border/60" />
        <Button
          size="sm"
          variant="warm"
          onClick={() => {
            applyLootReward(LOOT_REWARDS[Math.floor(Math.random() * LOOT_REWARDS.length)]);
          }}
        >
          ✦ Loot
        </Button>
        <Button
          size="sm"
          onClick={() => {
            if (soundEnabled) SFX.toggle();
            setDayPatch({ oneThingDone: !day.oneThingDone });
          }}
        >
          {day.oneThingDone ? "✓ OT" : "OT Done"}
        </Button>
      </div>
    </TooltipProvider>
  );
}
