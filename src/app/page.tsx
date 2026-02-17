// @ts-nocheck
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
} from "recharts";

// LifeOS v1.0 interactive app
// LocalStorage persisted, dynamic, and fully editable.

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
  { label: "Momentum Burst", xp: 30, coins: 12, note: "You found extra focus points." },
  { label: "Clarity Cache", xp: 20, coins: 18, note: "Decision-making bonus unlocked." },
  { label: "Execution Boost", xp: 40, coins: 8, note: "Deep work power-up applied." },
  { label: "Recovery Pack", xp: 15, coins: 20, note: "Energy and consistency restored." },
];

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

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

function seedFromISO(iso) {
  return iso.split("-").join("").split("").reduce((acc, n) => acc + Number(n || 0), 0);
}

const DEFAULTS = {
  meta: {
    name: "Edwin",
    version: "1.0",
    createdAt: new Date().toISOString(),
    bonusXP: 0,
    coins: 0,
  },
  values: [
    {
      id: uid(),
      label: "Fatherhood first",
      why: "My kids get the best of me.",
      proof: "15 minutes of phone-free presence with my kids daily.",
    },
    {
      id: uid(),
      label: "Truth over comfort",
      why: "No self deception.",
      proof: "Name the real reason when I avoid something.",
    },
    {
      id: uid(),
      label: "Competence",
      why: "Skills compound.",
      proof: "20 minutes of deliberate practice on weekdays.",
    },
    {
      id: uid(),
      label: "Integrity",
      why: "My word matters.",
      proof: "If I commit, I calendar it and do it.",
    },
    {
      id: uid(),
      label: "Health as infrastructure",
      why: "The machine needs power.",
      proof: "Protect sleep window and move daily.",
    },
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
      {
        id: uid(),
        label: "Morning start",
        durationMin: 10,
        steps: [
          "2 minutes: What matters today?",
          "3 minutes: pick the One Thing",
          "5 minutes: start the One Thing",
        ],
      },
      {
        id: uid(),
        label: "Midday reset",
        durationMin: 5,
        steps: ["Water", "Body scan", "Next concrete step"],
      },
      {
        id: uid(),
        label: "Evening shutdown",
        durationMin: 10,
        steps: [
          "Write tomorrow One Thing",
          "Set up first step physically",
          "2 minute tidy",
        ],
      },
    ],
    weekly: {
      planning: { day: "Sunday", minutes: 30 },
      review: { day: "Friday", minutes: 15 },
    },
  },
  habits: [
    {
      id: uid(),
      name: "Sleep protection",
      trigger: "Night alarm",
      tinyAction: "Devices down, lights low",
      reward: "Tea or audiobook",
      type: "yesno",
    },
    {
      id: uid(),
      name: "Movement",
      trigger: "After bathroom",
      tinyAction: "5 minutes of movement",
      reward: "Music or shower",
      type: "minutes",
      targetMinutes: 5,
    },
    {
      id: uid(),
      name: "Deep work",
      trigger: "Open laptop",
      tinyAction: "10 minutes on One Thing",
      reward: "Short break",
      type: "minutes",
      targetMinutes: 10,
    },
    {
      id: uid(),
      name: "Emotional regulation",
      trigger: "Notice agitation",
      tinyAction: "60 seconds slow breathing + label emotion",
      reward: "Relief",
      type: "yesno",
    },
    {
      id: uid(),
      name: "Admin sprint",
      trigger: "After lunch",
      tinyAction: "10 minutes paperwork",
      reward: "Stop when timer ends",
      type: "minutes",
      targetMinutes: 10,
    },
  ],
  productivity: {
    oneThing: "",
    listA: [""],
    listB: [""],
    inbox: [""],
    calendarRule: "Schedule actions, not intentions.",
  },
  emotions: {
    tools: [
      {
        id: uid(),
        name: "90 second rule",
        how: "Breathe, wait, do not feed the story.",
      },
      { id: uid(), name: "HALT", how: "Hungry Angry Lonely Tired. Fix input first." },
      {
        id: uid(),
        name: "Name it to tame it",
        how: "Label emotion. Ask what it wants you to do.",
      },
    ],
    checkin: {
      hunger: 5,
      anger: 2,
      lonely: 3,
      tired: 6,
      note: "",
    },
  },
  goals: {
    identity: "I am a consistent man who finishes what he starts.",
    outcomes: [
      { id: uid(), text: "Stable career track" },
      { id: uid(), text: "Strong health baseline" },
      { id: uid(), text: "Present father" },
    ],
    processes: [
      { id: uid(), text: "5 deep work sessions per week" },
      { id: uid(), text: "3 workouts per week" },
      { id: uid(), text: "1 weekly review" },
    ],
  },
  tracking: {
    days: {},
    weekStartISO: startOfWeekISO(),
  },
};

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

function saveState(state) {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function prettyDow(d) {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d];
}

function formatISOToLabel(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
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
  if (score >= 8) return "bg-green-500/15 text-green-700 border-green-200";
  if (score >= 5) return "bg-amber-500/15 text-amber-700 border-amber-200";
  return "bg-rose-500/15 text-rose-700 border-rose-200";
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
  return Object.values(days || {}).reduce((acc, rec) => {
    return (
      acc +
      (rec?.oneThingDone ? 40 : 0) +
      Number(rec?.consistency || 0) * 2 +
      Number(rec?.output || 0) * 2
    );
  }, 0);
}

function IconToggle({ checked }) {
  return checked ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />;
}

function Pill({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs bg-muted/50">
      {children}
    </span>
  );
}

function SectionTitle({ icon: Icon, title, subtitle, right }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="mt-1 rounded-2xl border bg-background p-2 shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-lg font-semibold leading-tight">{title}</div>
          {subtitle ? <div className="text-sm text-muted-foreground">{subtitle}</div> : null}
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
        <div key={idx} className="flex gap-2">
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
            onClick={() => {
              const next = items.filter((_, i) => i !== idx);
              onChange(next.length >= minItems ? next : items);
            }}
          >
            Remove
          </Button>
        </div>
      ))}
      <Button variant="secondary" onClick={() => onChange([...items, ""])}>
        Add
      </Button>
    </div>
  );
}

function KPI({ icon: Icon, label, value, hint, progress = 50 }) {
  const toneMap = {
    Streak: "from-orange-500/35 via-rose-500/10 to-transparent",
    Level: "from-sky-500/30 via-indigo-500/10 to-transparent",
    Habits: "from-emerald-500/30 via-teal-500/10 to-transparent",
    "One Thing": "from-fuchsia-500/30 via-violet-500/10 to-transparent",
  };
  const tone = toneMap[label] || "from-slate-500/20 via-slate-500/5 to-transparent";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className={`rounded-2xl border bg-gradient-to-br ${tone} bg-background/90 p-3`}
    >
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground">{hint}</div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted/80">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          transition={{ duration: 0.6 }}
          className="h-full rounded-full bg-primary"
        />
      </div>
    </motion.div>
  );
}

function LootSpinner({ onReward }) {
  const [spinning, setSpinning] = useState(false);
  const [lastReward, setLastReward] = useState(null);

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    setTimeout(() => {
      const reward = LOOT_REWARDS[Math.floor(Math.random() * LOOT_REWARDS.length)];
      setLastReward(reward);
      onReward(reward);
      setSpinning(false);
    }, 800);
  };

  return (
    <div className="rounded-2xl border bg-background/80 p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold">Loot Spin</div>
          <div className="text-xs text-muted-foreground">Tap for XP and coin rewards.</div>
        </div>
        <motion.button
          type="button"
          onClick={spin}
          animate={spinning ? { rotate: [0, 360, 720] } : { rotate: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="rounded-xl border bg-gradient-to-br from-amber-400/30 to-orange-500/20 px-3 py-2 text-sm font-medium"
        >
          Spin
        </motion.button>
      </div>
      <AnimatePresence mode="wait">
        {lastReward ? (
          <motion.div
            key={lastReward.label + String(spinning)}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mt-3 rounded-xl border bg-muted/40 p-2 text-xs"
          >
            <div className="font-semibold">{lastReward.label}</div>
            <div className="text-muted-foreground">
              +{lastReward.xp} XP | +{lastReward.coins} coins
            </div>
            <div className="text-muted-foreground">{lastReward.note}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function AchievementWall({ achievements }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <SectionTitle icon={Crown} title="Achievement Wall" subtitle="Unlock streak and execution milestones." />
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-2">
        {achievements.map((a) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border p-3 ${
              a.unlocked
                ? "bg-gradient-to-r from-emerald-500/20 to-cyan-500/10 border-emerald-300/60"
                : "bg-muted/40 border-border"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold">{a.title}</div>
              {a.unlocked ? <Badge variant="secondary">Unlocked</Badge> : <Badge variant="outline">Locked</Badge>}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{a.note}</div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-muted/80">
              <div className="h-full rounded-full bg-primary" style={{ width: `${a.progress}%` }} />
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}

function HeroArena({ level, totalXP, levelProgress, streak, combo, coins }) {
  return (
    <Card className="overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-indigo-500/20 via-sky-500/10 to-emerald-500/20">
      <CardContent className="relative p-4">
        <motion.div
          aria-hidden
          className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-sky-300/30 blur-2xl"
          animate={{ x: [0, -10, 0], y: [0, 12, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="absolute -bottom-8 left-8 h-20 w-20 rounded-full bg-fuchsia-300/30 blur-2xl"
          animate={{ x: [0, 12, 0], y: [0, -8, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs">
            <Stars className="h-3.5 w-3.5" />
            Hero Arena
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl border bg-background/75 p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Level</div>
              <div className="text-2xl font-semibold">Lv {level}</div>
              <div className="text-xs text-muted-foreground">{totalXP} XP total</div>
            </div>
            <div className="rounded-xl border bg-background/75 p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Combo</div>
              <div className="text-2xl font-semibold">x{combo}</div>
              <div className="text-xs text-muted-foreground">Streak {streak} days</div>
            </div>
          </div>
          <div className="mt-3 rounded-xl border bg-background/75 p-3">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">XP to next rank</span>
              <span className="font-semibold">{levelProgress}%</span>
            </div>
            <Progress value={levelProgress} />
            <div className="mt-2 inline-flex items-center gap-2 text-xs">
              <Gem className="h-3.5 w-3.5" />
              {coins} coins collected
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FocusSprint() {
  const TOTAL = 25 * 60;
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setSeconds((s) => (s <= 0 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    if (seconds === 0) setRunning(false);
  }, [seconds]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const progress = Math.round(((TOTAL - seconds) / TOTAL) * 100);

  return (
    <Card className="rounded-2xl bg-gradient-to-br from-violet-500/15 via-background to-sky-500/10">
      <CardHeader>
        <SectionTitle icon={Zap} title="Focus Sprint" subtitle="25-minute execution block" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-4xl font-semibold tabular-nums">{mm}:{ss}</div>
        <Progress value={progress} />
        <div className="text-xs text-muted-foreground">{progress}% complete</div>
        <div className="flex gap-2">
          <Button onClick={() => setRunning((v) => !v)}>{running ? "Pause" : "Start"}</Button>
          <Button
            variant="outline"
            onClick={() => {
              setRunning(false);
              setSeconds(25 * 60);
            }}
          >
            Reset
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
      <Button variant="outline" onClick={() => setOpen(true)}>
        <span className="inline-flex items-center gap-2">
          <Wand2 className="h-4 w-4" />
          Backup and Restore
        </span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Backup and Restore</DialogTitle>
            <DialogDescription>
              Export your LifeOS data to JSON, or paste JSON to restore.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  setErr("");
                  setBlob(JSON.stringify(state, null, 2));
                }}
              >
                <span className="inline-flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export to JSON
                </span>
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setErr("");
                  try {
                    const parsed = JSON.parse(blob);
                    setState({ ...DEFAULTS, ...parsed });
                    setOpen(false);
                  } catch {
                    setErr("Invalid JSON. Fix it and try again.");
                  }
                }}
              >
                <span className="inline-flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Restore from JSON
                </span>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setErr("");
                  setState(DEFAULTS);
                  setOpen(false);
                }}
              >
                Reset to Defaults
              </Button>
            </div>
            {err ? <div className="text-sm text-rose-600">{err}</div> : null}
            <Textarea
              className="min-h-[320px] font-mono text-xs"
              value={blob}
              placeholder="Export JSON appears here. Or paste your JSON to restore."
              onChange={(e) => setBlob(e.target.value)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DecisionWizard({ filters, values, onResult }) {
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
    const sum = arr.reduce((a, b) => a + b, 0);
    return Math.round((sum / Math.max(1, arr.length)) * 10) / 10;
  }, [filters, scores]);

  const verdict = useMemo(() => {
    if (!decision.trim()) return { label: "Enter a decision to evaluate", tone: "muted" };
    if (avg >= 8) return { label: "Likely YES", tone: "good" };
    if (avg >= 6) return { label: "Maybe, tighten the plan", tone: "mid" };
    if (avg >= 4) return { label: "Probably NOT NOW", tone: "mid" };
    return { label: "Likely NO", tone: "bad" };
  }, [avg, decision]);

  const toneClass =
    verdict.tone === "good"
      ? "border-green-200 bg-green-500/10 text-green-700"
      : verdict.tone === "bad"
      ? "border-rose-200 bg-rose-500/10 text-rose-700"
      : verdict.tone === "mid"
      ? "border-amber-200 bg-amber-500/10 text-amber-700"
      : "border-border bg-muted/40 text-muted-foreground";

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <span className="inline-flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Decision Wizard
        </span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Decision Wizard</DialogTitle>
            <DialogDescription>
              Rate the decision through your filters. This turns messy feelings into a cleaner signal.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <div className="text-sm font-medium">Decision</div>
              <Input
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
                placeholder="Example: Take on a new commitment"
              />
            </div>

            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Primary value this touches</div>
                <div className={`rounded-xl border px-3 py-1 text-sm ${toneClass}`}>
                  {verdict.label} (avg {avg})
                </div>
              </div>

              <Select value={valuePick} onValueChange={setValuePick}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick a value" />
                </SelectTrigger>
                <SelectContent>
                  {values.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="grid gap-2">
                {filters.map((f) => (
                  <div key={f.id} className="rounded-2xl border p-3 bg-background">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{f.key}</div>
                        <div className="text-sm text-muted-foreground">{f.prompt}</div>
                      </div>
                      <Badge variant="secondary">{scores[f.id] ?? 5}/10</Badge>
                    </div>
                    <div className="mt-3">
                      <Slider
                        value={[scores[f.id] ?? 5]}
                        min={0}
                        max={10}
                        step={1}
                        onValueChange={(val) =>
                          setScores((s) => ({
                            ...s,
                            [f.id]: val[0],
                          }))
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-2">
                <div className="text-sm font-medium">Notes</div>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What is the hidden cost? What is the real fear?"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    onResult({
                      id: uid(),
                      ts: new Date().toISOString(),
                      decision,
                      avg,
                      verdict: verdict.label,
                      primaryValueId: valuePick,
                      scores,
                      notes,
                    });
                    setDecision("");
                    setNotes("");
                    setScores(Object.fromEntries(filters.map((x) => [x.id, 5])));
                    setOpen(false);
                  }}
                  disabled={!decision.trim()}
                >
                  Save decision log
                </Button>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function LifeOSApp() {
  const [state, setState] = useState(() => loadState());
  const [activeTab, setActiveTab] = useState("dashboard");
  const [theme, setTheme] = useState("sunrise");
  const [celebrate, setCelebrate] = useState(false);
  const [celebrateMsg, setCelebrateMsg] = useState("Nice move.");
  const [missionIndex, setMissionIndex] = useState(() => seedFromISO(todayISO()) % DAILY_MISSIONS.length);

  const [decisionLogs, setDecisionLogs] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_DECISIONS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    localStorage.setItem(LS_DECISIONS, JSON.stringify(decisionLogs));
  }, [decisionLogs]);

  const today = todayISO();
  const weekDates = useMemo(() => computeWeekDates(state.tracking.weekStartISO), [state.tracking.weekStartISO]);

  const day = state.tracking.days[today] || {
    oneThingDone: false,
    consistency: 5,
    output: 5,
    notes: "",
    habit: {},
    oneThing: state.productivity.oneThing || "",
  };

  const weekChart = useMemo(() => {
    return weekDates.map((d) => {
      const rec = state.tracking.days[d];
      return {
        date: formatISOToLabel(d),
        consistency: rec?.consistency ?? 0,
        output: rec?.output ?? 0,
      };
    });
  }, [weekDates, state.tracking.days]);

  const habitCompletionToday = useMemo(() => {
    const total = state.habits.length;
    if (total === 0) return 0;
    const done = state.habits.filter((h) => {
      const r = day.habit?.[h.id];
      if (!r) return false;
      if (h.type === "yesno") return !!r.done;
      const mins = Number(r.minutes || 0);
      return mins >= Number(h.targetMinutes || 0);
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
  const levelSpanXP = 250;
  const levelProgress = Math.round(((xp - levelFloorXP) / levelSpanXP) * 100);
  const combo = Math.max(
    1,
    Math.min(12, Math.round(streak * 0.8 + habitCompletionToday / 20 + (day.oneThingDone ? 2 : 0)))
  );
  const achievements = [
    {
      id: "starter",
      title: "Ignition",
      note: "Reach 100 XP total.",
      unlocked: xp >= 100,
      progress: Math.min(100, Math.round((xp / 100) * 100)),
    },
    {
      id: "streak3",
      title: "Rhythm Builder",
      note: "Hit a 3-day streak.",
      unlocked: streak >= 3,
      progress: Math.min(100, Math.round((streak / 3) * 100)),
    },
    {
      id: "habit50",
      title: "Habit Engine",
      note: "Reach 50% habits in a day.",
      unlocked: habitCompletionToday >= 50,
      progress: Math.min(100, habitCompletionToday * 2),
    },
    {
      id: "focus-lock",
      title: "Focus Lock",
      note: "Complete the One Thing.",
      unlocked: !!day.oneThingDone,
      progress: day.oneThingDone ? 100 : 35,
    },
  ];
  const currentMission = DAILY_MISSIONS[missionIndex];

  const setDayPatch = (patch) => {
    setState((s) => {
      const prev = s.tracking.days[today] || {
        oneThingDone: false,
        consistency: 5,
        output: 5,
        notes: "",
        habit: {},
        oneThing: s.productivity.oneThing || "",
      };
      const next = {
        ...prev,
        ...patch,
      };

      const becameDone = !prev.oneThingDone && !!next.oneThingDone;
      if (becameDone) {
        setCelebrateMsg("One Thing completed. Keep momentum.");
        setCelebrate(true);
        setTimeout(() => setCelebrate(false), 1600);
      }

      return {
        ...s,
        tracking: {
          ...s.tracking,
          days: {
            ...s.tracking.days,
            [today]: next,
          },
        },
      };
    });
  };

  const applyLootReward = (reward) => {
    setState((s) => ({
      ...s,
      meta: {
        ...s.meta,
        bonusXP: Number(s.meta?.bonusXP || 0) + Number(reward.xp || 0),
        coins: Number(s.meta?.coins || 0) + Number(reward.coins || 0),
      },
    }));
    setCelebrateMsg(`Reward: +${reward.xp} XP and +${reward.coins} coins`);
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 1200);
  };

  const toggleHabit = (habitId, nextDone) => {
    setState((s) => {
      const rec = s.tracking.days[today] || {
        oneThingDone: false,
        consistency: 5,
        output: 5,
        notes: "",
        habit: {},
        oneThing: s.productivity.oneThing || "",
      };
      const prevHabit = rec.habit?.[habitId] || {};
      const updated = {
        ...rec,
        habit: {
          ...rec.habit,
          [habitId]: {
            ...prevHabit,
            done: nextDone,
          },
        },
      };

      return {
        ...s,
        tracking: {
          ...s.tracking,
          days: {
            ...s.tracking.days,
            [today]: updated,
          },
        },
      };
    });
  };

  const setHabitMinutes = (habitId, minutes) => {
    setState((s) => {
      const rec = s.tracking.days[today] || {
        oneThingDone: false,
        consistency: 5,
        output: 5,
        notes: "",
        habit: {},
        oneThing: s.productivity.oneThing || "",
      };
      const prevHabit = rec.habit?.[habitId] || {};
      const updated = {
        ...rec,
        habit: {
          ...rec.habit,
          [habitId]: {
            ...prevHabit,
            minutes: clamp(Number(minutes || 0), 0, 1000),
          },
        },
      };

      return {
        ...s,
        tracking: {
          ...s.tracking,
          days: {
            ...s.tracking.days,
            [today]: updated,
          },
        },
      };
    });
  };

  const bumpWeek = (dir) => {
    const start = new Date(state.tracking.weekStartISO + "T00:00:00");
    start.setDate(start.getDate() + dir * 7);
    const tz = start.getTimezoneOffset() * 60000;
    const iso = new Date(start.getTime() - tz).toISOString().slice(0, 10);
    setState((s) => ({ ...s, tracking: { ...s.tracking, weekStartISO: iso } }));
  };

  const headerRight = (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="outline" className="bg-background/70">
        <span className="inline-flex items-center gap-1">
          <Gem className="h-3.5 w-3.5" />
          {coins} coins
        </span>
      </Badge>
      <Button
        variant="outline"
        onClick={() =>
          setTheme((t) => THEMES[(THEMES.indexOf(t as (typeof THEMES)[number]) + 1) % THEMES.length])
        }
      >
        <span className="inline-flex items-center gap-2">
          {theme === "sunrise" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          Theme: {theme}
        </span>
      </Button>
      <DecisionWizard
        filters={state.filters}
        values={state.values}
        onResult={(log) => setDecisionLogs((d) => [log, ...d].slice(0, 200))}
      />
      <ExportImport state={state} setState={setState} />
    </div>
  );

  const wrapperTone =
    theme === "sunrise"
      ? "bg-[radial-gradient(circle_at_top_right,_rgba(251,146,60,0.23),transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.16),transparent_40%)]"
      : theme === "ocean"
      ? "bg-[radial-gradient(circle_at_top_right,_rgba(6,182,212,0.22),transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.16),transparent_40%)]"
      : "bg-[radial-gradient(circle_at_top_right,_rgba(244,114,182,0.20),transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(251,146,60,0.16),transparent_40%)]";

  const quickTabs = [
    { id: "dashboard", label: "Daily" },
    { id: "kernel", label: "Values" },
    { id: "productivity", label: "Focus" },
    { id: "logs", label: "Logs" },
  ];

  return (
    <TooltipProvider>
      <div className={`relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-background to-muted/20 ${wrapperTone}`}>
        <div className="pointer-events-none absolute inset-0">
          <div className="lifeos-grid absolute inset-0 opacity-35" />
          <motion.div
            aria-hidden
            className="lifeos-blob-a absolute -left-20 top-20 h-64 w-64 rounded-full bg-orange-300/25 blur-3xl"
            animate={{ x: [0, 24, -8, 0], y: [0, -20, 10, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            aria-hidden
            className="lifeos-blob-b absolute right-0 top-1/3 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl"
            animate={{ x: [0, -16, 12, 0], y: [0, 18, -10, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col gap-6"
          >
            <div className="flex flex-col gap-2">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    <div className="text-2xl font-semibold">LifeOS</div>
                    <Badge variant="secondary">v{state.meta.version}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    A practical operating system for values, decisions, routines, habits, emotions, and goals.
                  </div>
                </div>
                {headerRight}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                <KPI
                  icon={Flame}
                  label="Streak"
                  value={`${streak} days`}
                  hint="No zero days"
                  progress={Math.min(100, streak * 20)}
                />
                <KPI
                  icon={Trophy}
                  label="Level"
                  value={`Lv ${level}`}
                  hint={`${xp} XP earned`}
                  progress={levelProgress}
                />
                <KPI
                  icon={Target}
                  label="Habits"
                  value={`${habitCompletionToday}%`}
                  hint="Today completion"
                  progress={habitCompletionToday}
                />
                <KPI
                  icon={Timer}
                  label="One Thing"
                  value={day.oneThingDone ? "Done" : "Live"}
                  hint={day.oneThing || "Set your One Thing"}
                  progress={oneThingProgress}
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {quickTabs.map((t) => (
                  <Button
                    key={t.id}
                    size="sm"
                    variant={activeTab === t.id ? "default" : "outline"}
                    onClick={() => setActiveTab(t.id)}
                  >
                    {t.label}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setMissionIndex((m) => (m + 1) % DAILY_MISSIONS.length)}
                >
                  <span className="inline-flex items-center gap-2">
                    <Rocket className="h-4 w-4" />
                    New Mission
                  </span>
                </Button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <HeroArena
                    level={level}
                    totalXP={xp}
                    levelProgress={levelProgress}
                    streak={streak}
                    combo={combo}
                    coins={coins}
                  />
                </div>
                <div className="space-y-4">
                  <LootSpinner onReward={applyLootReward} />
                  <div className="rounded-2xl border bg-background/80 p-3">
                    <div className="text-sm font-semibold">Mission Reward</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Finish your Daily Mission and mark One Thing done to stack your combo multiplier.
                    </div>
                  </div>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
                <TabsList className="flex flex-wrap">
                  <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                  <TabsTrigger value="kernel">Values and Principles</TabsTrigger>
                  <TabsTrigger value="filters">Decision Filters</TabsTrigger>
                  <TabsTrigger value="routines">Routines</TabsTrigger>
                  <TabsTrigger value="habits">Habits</TabsTrigger>
                  <TabsTrigger value="productivity">Productivity</TabsTrigger>
                  <TabsTrigger value="emotions">Emotions</TabsTrigger>
                  <TabsTrigger value="goals">Goals</TabsTrigger>
                  <TabsTrigger value="logs">Logs</TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="mt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <Card className="lg:col-span-2 rounded-2xl">
                      <CardHeader>
                        <SectionTitle
                          icon={Timer}
                          title={`Today: ${formatISOToLabel(today)}`}
                          subtitle="Track the minimum standard. Build reliability."
                          right={
                            <div className="flex items-center gap-2">
                              <Pill>Habits {habitCompletionToday}%</Pill>
                              <Pill>One Thing {day.oneThingDone ? "Done" : "In progress"}</Pill>
                            </div>
                          }
                        />
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-2">
                          <div className="text-sm font-medium">One Thing</div>
                          <div className="flex flex-col md:flex-row gap-2">
                            <Input
                              value={day.oneThing ?? ""}
                              placeholder="Define the one priority output for today"
                              onChange={(e) => setDayPatch({ oneThing: e.target.value })}
                            />
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={!!day.oneThingDone}
                                onCheckedChange={(v) => setDayPatch({ oneThingDone: v })}
                              />
                              <span className="text-sm">Done</span>
                            </div>
                          </div>
                          <Progress value={oneThingProgress} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="rounded-2xl border p-3 bg-background">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium">Consistency score</div>
                              <Badge variant="secondary">{day.consistency ?? 5}/10</Badge>
                            </div>
                            <div className="mt-3">
                              <Slider
                                value={[day.consistency ?? 5]}
                                min={0}
                                max={10}
                                step={1}
                                onValueChange={(val) => setDayPatch({ consistency: val[0] })}
                              />
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground">
                              Did you show up? Did you hit minimum standards?
                            </div>
                          </div>

                          <div className="rounded-2xl border p-3 bg-background">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium">Output score</div>
                              <Badge variant="secondary">{day.output ?? 5}/10</Badge>
                            </div>
                            <div className="mt-3">
                              <Slider
                                value={[day.output ?? 5]}
                                min={0}
                                max={10}
                                step={1}
                                onValueChange={(val) => setDayPatch({ output: val[0] })}
                              />
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground">
                              Did the day move life forward in visible outputs?
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-2">
                          <div className="text-sm font-medium">Notes</div>
                          <Textarea
                            value={day.notes ?? ""}
                            onChange={(e) => setDayPatch({ notes: e.target.value })}
                            placeholder="Quick reflection: friction, wins, what to patch"
                          />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium">This week</div>
                            <div className="text-xs text-muted-foreground">
                              Consistency and output trend for the selected week.
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => bumpWeek(-1)}>
                              Prev
                            </Button>
                            <Button variant="outline" onClick={() => bumpWeek(1)}>
                              Next
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={() =>
                                setState((s) => ({
                                  ...s,
                                  tracking: { ...s.tracking, weekStartISO: startOfWeekISO() },
                                }))
                              }
                            >
                              This week
                            </Button>
                          </div>
                        </div>

                        <div className="h-[260px] w-full rounded-2xl border bg-background p-3">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={weekChart}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.35)" />
                              <XAxis dataKey="date" />
                              <YAxis domain={[0, 10]} />
                              <ReTooltip />
                              <Line
                                type="monotone"
                                dataKey="consistency"
                                stroke="#0ea5e9"
                                strokeWidth={3}
                                dot={false}
                              />
                              <Line
                                type="monotone"
                                dataKey="output"
                                stroke="#f97316"
                                strokeWidth={3}
                                dot={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="space-y-4">
                      <Card className="rounded-2xl">
                        <CardHeader>
                          <SectionTitle
                            icon={Sparkles}
                            title="Daily Mission"
                            subtitle="Small fun challenge to build momentum."
                          />
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={currentMission}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              className="rounded-2xl border bg-muted/30 p-3 text-sm"
                            >
                              {currentMission}
                            </motion.div>
                          </AnimatePresence>
                          <div className="flex gap-2">
                            <Button
                              variant={day.missionDone ? "secondary" : "outline"}
                              onClick={() => {
                                if (!day.missionDone && !day.missionRewarded) {
                                  applyLootReward({
                                    label: "Mission Clear",
                                    xp: 25,
                                    coins: 15,
                                    note: "Daily mission completion reward.",
                                  });
                                  setDayPatch({ missionDone: true, missionRewarded: true });
                                  return;
                                }
                                setDayPatch({ missionDone: !day.missionDone });
                              }}
                            >
                              {day.missionDone ? "Mission Complete" : "Mark Mission Done"}
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => setMissionIndex((m) => (m + 1) % DAILY_MISSIONS.length)}
                            >
                              Swap
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      <AchievementWall achievements={achievements} />

                      <Card className="rounded-2xl">
                        <CardHeader>
                          <SectionTitle
                            icon={Flame}
                            title="Habits today"
                            subtitle="Keep it simple. Track it honestly."
                          />
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <Progress value={habitCompletionToday} />
                          <div className="grid gap-2">
                            {state.habits.map((h) => {
                              const rec = day.habit?.[h.id] || {};
                              const doneYesNo = !!rec.done;
                              const mins = Number(rec.minutes || 0);
                              const hitMinutes = h.type === "minutes" ? mins >= Number(h.targetMinutes || 0) : false;
                              const isDone = h.type === "yesno" ? doneYesNo : hitMinutes;

                              return (
                                <div key={h.id} className="rounded-2xl border p-3 bg-background">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <div className="font-medium">{h.name}</div>
                                      <div className="text-xs text-muted-foreground">Trigger: {h.trigger}</div>
                                      <div className="text-xs text-muted-foreground">Tiny: {h.tinyAction}</div>
                                    </div>
                                    <Button
                                      variant={isDone ? "secondary" : "outline"}
                                      onClick={() => toggleHabit(h.id, !doneYesNo)}
                                    >
                                      <span className="inline-flex items-center gap-2">
                                        <IconToggle checked={isDone} />
                                        {isDone ? "Done" : "Mark"}
                                      </span>
                                    </Button>
                                  </div>

                                  {h.type === "minutes" ? (
                                    <div className="mt-3">
                                      <div className="flex items-center justify-between">
                                        <div className="text-xs text-muted-foreground">Minutes</div>
                                        <Badge variant="secondary">
                                          {mins}/{h.targetMinutes}
                                        </Badge>
                                      </div>
                                      <Input
                                        className="mt-2"
                                        type="number"
                                        value={mins}
                                        onChange={(e) => setHabitMinutes(h.id, e.target.value)}
                                        min={0}
                                      />
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>

                      <FocusSprint />

                      <Card className="rounded-2xl">
                        <CardHeader>
                          <SectionTitle
                            icon={HeartPulse}
                            title="Quick emotional check"
                            subtitle="Stability engineering. No drama."
                          />
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              ["hunger", "Hungry"],
                              ["anger", "Angry"],
                              ["lonely", "Lonely"],
                              ["tired", "Tired"],
                            ].map(([k, label]) => (
                              <div key={k} className="rounded-2xl border p-3 bg-background">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm font-medium">{label}</div>
                                  <Badge variant="secondary">{state.emotions.checkin[k]}/10</Badge>
                                </div>
                                <div className="mt-3">
                                  <Slider
                                    value={[state.emotions.checkin[k]]}
                                    min={0}
                                    max={10}
                                    step={1}
                                    onValueChange={(val) =>
                                      setState((s) => ({
                                        ...s,
                                        emotions: {
                                          ...s.emotions,
                                          checkin: { ...s.emotions.checkin, [k]: val[0] },
                                        },
                                      }))
                                    }
                                  />
                                </div>
                              </div>
                            ))}
                          </div>

                          <Textarea
                            value={state.emotions.checkin.note}
                            onChange={(e) =>
                              setState((s) => ({
                                ...s,
                                emotions: {
                                  ...s.emotions,
                                  checkin: { ...s.emotions.checkin, note: e.target.value },
                                },
                              }))
                            }
                            placeholder="One line: what do you need right now?"
                          />

                          <div className="rounded-2xl border bg-muted/30 p-3 text-sm">
                            <div className="font-medium">Default move</div>
                            <div className="text-muted-foreground">
                              Fix body inputs first. Then pick the smallest next action.
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="kernel" className="mt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card className="rounded-2xl">
                      <CardHeader>
                        <SectionTitle
                          icon={Brain}
                          title="Values (Kernel)"
                          subtitle="Pick what you refuse to betray. Define proof behaviors."
                        />
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid gap-3">
                          {state.values.map((v, idx) => (
                            <div key={v.id} className="rounded-2xl border p-3 bg-background">
                              <div className="flex items-center justify-between gap-2">
                                <Badge variant="secondary">{idx + 1}</Badge>
                                <Button
                                  variant="outline"
                                  onClick={() =>
                                    setState((s) => ({
                                      ...s,
                                      values: s.values.filter((x) => x.id !== v.id),
                                    }))
                                  }
                                >
                                  Delete
                                </Button>
                              </div>
                              <div className="mt-2 grid gap-2">
                                <Input
                                  value={v.label}
                                  onChange={(e) =>
                                    setState((s) => ({
                                      ...s,
                                      values: s.values.map((x) =>
                                        x.id === v.id ? { ...x, label: e.target.value } : x
                                      ),
                                    }))
                                  }
                                  placeholder="Value name"
                                />
                                <Input
                                  value={v.why}
                                  onChange={(e) =>
                                    setState((s) => ({
                                      ...s,
                                      values: s.values.map((x) =>
                                        x.id === v.id ? { ...x, why: e.target.value } : x
                                      ),
                                    }))
                                  }
                                  placeholder="Why this matters"
                                />
                                <Textarea
                                  value={v.proof}
                                  onChange={(e) =>
                                    setState((s) => ({
                                      ...s,
                                      values: s.values.map((x) =>
                                        x.id === v.id ? { ...x, proof: e.target.value } : x
                                      ),
                                    }))
                                  }
                                  placeholder="Proof behavior (observable)"
                                />
                              </div>
                            </div>
                          ))}

                          <Button
                            onClick={() =>
                              setState((s) => ({
                                ...s,
                                values: [...s.values, { id: uid(), label: "", why: "", proof: "" }],
                              }))
                            }
                          >
                            Add value
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-2xl">
                      <CardHeader>
                        <SectionTitle
                          icon={BookOpen}
                          title="Principles"
                          subtitle="Rules of the machine. Short, memorable, actionable."
                        />
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid gap-3">
                          {state.principles.map((p) => (
                            <div key={p.id} className="rounded-2xl border p-3 bg-background">
                              <div className="flex items-center justify-between">
                                <div className="font-medium">Principle</div>
                                <Button
                                  variant="outline"
                                  onClick={() =>
                                    setState((s) => ({
                                      ...s,
                                      principles: s.principles.filter((x) => x.id !== p.id),
                                    }))
                                  }
                                >
                                  Delete
                                </Button>
                              </div>
                              <div className="mt-2 grid gap-2">
                                <Input
                                  value={p.label}
                                  onChange={(e) =>
                                    setState((s) => ({
                                      ...s,
                                      principles: s.principles.map((x) =>
                                        x.id === p.id ? { ...x, label: e.target.value } : x
                                      ),
                                    }))
                                  }
                                  placeholder="Principle"
                                />
                                <Input
                                  value={p.note}
                                  onChange={(e) =>
                                    setState((s) => ({
                                      ...s,
                                      principles: s.principles.map((x) =>
                                        x.id === p.id ? { ...x, note: e.target.value } : x
                                      ),
                                    }))
                                  }
                                  placeholder="What it means in practice"
                                />
                              </div>
                            </div>
                          ))}

                          <Button
                            onClick={() =>
                              setState((s) => ({
                                ...s,
                                principles: [...s.principles, { id: uid(), label: "", note: "" }],
                              }))
                            }
                          >
                            Add principle
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="filters" className="mt-4">
                  <Card className="rounded-2xl">
                    <CardHeader>
                      <SectionTitle
                        icon={Shield}
                        title="Decision Filters"
                        subtitle="Your mental firewall. Make choices with less chaos."
                      />
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {state.filters.map((f) => (
                          <div key={f.id} className="rounded-2xl border p-3 bg-background">
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary">{f.key}</Badge>
                              <Button
                                variant="outline"
                                onClick={() =>
                                  setState((s) => ({
                                    ...s,
                                    filters: s.filters.filter((x) => x.id !== f.id),
                                  }))
                                }
                              >
                                Delete
                              </Button>
                            </div>
                            <div className="mt-2 grid gap-2">
                              <Input
                                value={f.key}
                                onChange={(e) =>
                                  setState((s) => ({
                                    ...s,
                                    filters: s.filters.map((x) =>
                                      x.id === f.id ? { ...x, key: e.target.value } : x
                                    ),
                                  }))
                                }
                                placeholder="Filter name"
                              />
                              <Textarea
                                value={f.prompt}
                                onChange={(e) =>
                                  setState((s) => ({
                                    ...s,
                                    filters: s.filters.map((x) =>
                                      x.id === f.id ? { ...x, prompt: e.target.value } : x
                                    ),
                                  }))
                                }
                                placeholder="Prompt question"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <Button
                        onClick={() =>
                          setState((s) => ({
                            ...s,
                            filters: [...s.filters, { id: uid(), key: "", prompt: "" }],
                          }))
                        }
                      >
                        Add filter
                      </Button>

                      <Separator />

                      <div className="rounded-2xl border bg-muted/30 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-semibold">Use the Decision Wizard</div>
                            <div className="text-sm text-muted-foreground">
                              Rate a decision through your filters and save the log.
                            </div>
                          </div>
                          <DecisionWizard
                            filters={state.filters}
                            values={state.values}
                            onResult={(log) => setDecisionLogs((d) => [log, ...d].slice(0, 200))}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="routines" className="mt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card className="rounded-2xl">
                      <CardHeader>
                        <SectionTitle
                          icon={CalendarDays}
                          title="Daily anchors"
                          subtitle="Short rituals that stabilize your day."
                        />
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {state.routines.dailyAnchors.map((a) => (
                          <div key={a.id} className="rounded-2xl border p-3 bg-background">
                            <div className="flex items-center justify-between">
                              <div className="font-medium">{a.label}</div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">{a.durationMin} min</Badge>
                                <Button
                                  variant="outline"
                                  onClick={() =>
                                    setState((s) => ({
                                      ...s,
                                      routines: {
                                        ...s.routines,
                                        dailyAnchors: s.routines.dailyAnchors.filter((x) => x.id !== a.id),
                                      },
                                    }))
                                  }
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>

                            <div className="mt-2 grid gap-2">
                              <Input
                                value={a.label}
                                onChange={(e) =>
                                  setState((s) => ({
                                    ...s,
                                    routines: {
                                      ...s.routines,
                                      dailyAnchors: s.routines.dailyAnchors.map((x) =>
                                        x.id === a.id ? { ...x, label: e.target.value } : x
                                      ),
                                    },
                                  }))
                                }
                                placeholder="Anchor name"
                              />
                              <Input
                                type="number"
                                value={a.durationMin}
                                onChange={(e) =>
                                  setState((s) => ({
                                    ...s,
                                    routines: {
                                      ...s.routines,
                                      dailyAnchors: s.routines.dailyAnchors.map((x) =>
                                        x.id === a.id
                                          ? { ...x, durationMin: Number(e.target.value || 0) }
                                          : x
                                      ),
                                    },
                                  }))
                                }
                                placeholder="Minutes"
                              />
                              <div className="text-sm font-medium">Steps</div>
                              <EditableList
                                items={a.steps}
                                onChange={(next) =>
                                  setState((s) => ({
                                    ...s,
                                    routines: {
                                      ...s.routines,
                                      dailyAnchors: s.routines.dailyAnchors.map((x) =>
                                        x.id === a.id ? { ...x, steps: next } : x
                                      ),
                                    },
                                  }))
                                }
                                placeholder="Step"
                                minItems={1}
                              />
                            </div>
                          </div>
                        ))}

                        <Button
                          onClick={() =>
                            setState((s) => ({
                              ...s,
                              routines: {
                                ...s.routines,
                                dailyAnchors: [
                                  ...s.routines.dailyAnchors,
                                  { id: uid(), label: "New anchor", durationMin: 5, steps: ["Step"] },
                                ],
                              },
                            }))
                          }
                        >
                          Add daily anchor
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="rounded-2xl">
                      <CardHeader>
                        <SectionTitle
                          icon={RefreshCw}
                          title="Weekly rhythm"
                          subtitle="Planning and review sessions that patch the system."
                        />
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="rounded-2xl border p-3 bg-background">
                          <div className="font-medium">Weekly planning</div>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <Select
                              value={state.routines.weekly.planning.day}
                              onValueChange={(val) =>
                                setState((s) => ({
                                  ...s,
                                  routines: {
                                    ...s.routines,
                                    weekly: {
                                      ...s.routines.weekly,
                                      planning: { ...s.routines.weekly.planning, day: val },
                                    },
                                  },
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 7 }).map((_, i) => (
                                  <SelectItem key={i} value={prettyDow(i)}>
                                    {prettyDow(i)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              type="number"
                              value={state.routines.weekly.planning.minutes}
                              onChange={(e) =>
                                setState((s) => ({
                                  ...s,
                                  routines: {
                                    ...s.routines,
                                    weekly: {
                                      ...s.routines.weekly,
                                      planning: {
                                        ...s.routines.weekly.planning,
                                        minutes: Number(e.target.value || 0),
                                      },
                                    },
                                  },
                                }))
                              }
                              placeholder="Minutes"
                            />
                          </div>
                        </div>

                        <div className="rounded-2xl border p-3 bg-background">
                          <div className="font-medium">Weekly review</div>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <Select
                              value={state.routines.weekly.review.day}
                              onValueChange={(val) =>
                                setState((s) => ({
                                  ...s,
                                  routines: {
                                    ...s.routines,
                                    weekly: {
                                      ...s.routines.weekly,
                                      review: { ...s.routines.weekly.review, day: val },
                                    },
                                  },
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 7 }).map((_, i) => (
                                  <SelectItem key={i} value={prettyDow(i)}>
                                    {prettyDow(i)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              type="number"
                              value={state.routines.weekly.review.minutes}
                              onChange={(e) =>
                                setState((s) => ({
                                  ...s,
                                  routines: {
                                    ...s.routines,
                                    weekly: {
                                      ...s.routines.weekly,
                                      review: {
                                        ...s.routines.weekly.review,
                                        minutes: Number(e.target.value || 0),
                                      },
                                    },
                                  },
                                }))
                              }
                              placeholder="Minutes"
                            />
                          </div>
                        </div>

                        <div className="rounded-2xl border bg-muted/30 p-4">
                          <div className="font-semibold">Weekly protocol</div>
                          <div className="mt-2 text-sm text-muted-foreground">
                            Review what worked, pick 3 must-do tasks for the week, identify one friction point,
                            patch the system.
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="habits" className="mt-4">
                  <Card className="rounded-2xl">
                    <CardHeader>
                      <SectionTitle
                        icon={Flame}
                        title="Habit system"
                        subtitle="Trigger, tiny action, reward. Track it."
                      />
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {state.habits.map((h) => (
                          <div key={h.id} className="rounded-2xl border p-3 bg-background">
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary">
                                {h.type === "minutes" ? "Minutes" : "Yes/No"}
                              </Badge>
                              <Button
                                variant="outline"
                                onClick={() =>
                                  setState((s) => ({
                                    ...s,
                                    habits: s.habits.filter((x) => x.id !== h.id),
                                  }))
                                }
                              >
                                Delete
                              </Button>
                            </div>
                            <div className="mt-2 grid gap-2">
                              <Input
                                value={h.name}
                                onChange={(e) =>
                                  setState((s) => ({
                                    ...s,
                                    habits: s.habits.map((x) =>
                                      x.id === h.id ? { ...x, name: e.target.value } : x
                                    ),
                                  }))
                                }
                                placeholder="Habit name"
                              />
                              <Input
                                value={h.trigger}
                                onChange={(e) =>
                                  setState((s) => ({
                                    ...s,
                                    habits: s.habits.map((x) =>
                                      x.id === h.id ? { ...x, trigger: e.target.value } : x
                                    ),
                                  }))
                                }
                                placeholder="Trigger"
                              />
                              <Input
                                value={h.tinyAction}
                                onChange={(e) =>
                                  setState((s) => ({
                                    ...s,
                                    habits: s.habits.map((x) =>
                                      x.id === h.id ? { ...x, tinyAction: e.target.value } : x
                                    ),
                                  }))
                                }
                                placeholder="Tiny action"
                              />
                              <Input
                                value={h.reward}
                                onChange={(e) =>
                                  setState((s) => ({
                                    ...s,
                                    habits: s.habits.map((x) =>
                                      x.id === h.id ? { ...x, reward: e.target.value } : x
                                    ),
                                  }))
                                }
                                placeholder="Reward"
                              />

                              {h.type === "minutes" ? (
                                <Input
                                  type="number"
                                  value={h.targetMinutes ?? 10}
                                  onChange={(e) =>
                                    setState((s) => ({
                                      ...s,
                                      habits: s.habits.map((x) =>
                                        x.id === h.id
                                          ? { ...x, targetMinutes: Number(e.target.value || 0) }
                                          : x
                                      ),
                                    }))
                                  }
                                  placeholder="Target minutes"
                                />
                              ) : null}

                              <div className="flex items-center justify-between rounded-xl border p-2 bg-muted/20">
                                <div className="text-sm">Track type</div>
                                <Select
                                  value={h.type}
                                  onValueChange={(val) =>
                                    setState((s) => ({
                                      ...s,
                                      habits: s.habits.map((x) =>
                                        x.id === h.id
                                          ? {
                                              ...x,
                                              type: val,
                                              targetMinutes:
                                                val === "minutes"
                                                  ? x.targetMinutes ?? 10
                                                  : undefined,
                                            }
                                          : x
                                      ),
                                    }))
                                  }
                                >
                                  <SelectTrigger className="w-[170px]">
                                    <SelectValue />
                                  </SelectTrigger>
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

                      <Button
                        onClick={() =>
                          setState((s) => ({
                            ...s,
                            habits: [
                              ...s.habits,
                              {
                                id: uid(),
                                name: "New habit",
                                trigger: "",
                                tinyAction: "",
                                reward: "",
                                type: "yesno",
                              },
                            ],
                          }))
                        }
                      >
                        Add habit
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="productivity" className="mt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card className="rounded-2xl">
                      <CardHeader>
                        <SectionTitle
                          icon={ListTodo}
                          title="One Thing + 2 lists"
                          subtitle="List A moves life forward. List B is everything else."
                        />
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-2">
                          <div className="text-sm font-medium">Default One Thing</div>
                          <Input
                            value={state.productivity.oneThing}
                            onChange={(e) =>
                              setState((s) => ({
                                ...s,
                                productivity: { ...s.productivity, oneThing: e.target.value },
                              }))
                            }
                            placeholder="Your default One Thing"
                          />
                        </div>

                        <div className="grid gap-2">
                          <div className="text-sm font-medium">List A (max 3 recommended)</div>
                          <EditableList
                            items={state.productivity.listA}
                            onChange={(next) =>
                              setState((s) => ({
                                ...s,
                                productivity: { ...s.productivity, listA: next },
                              }))
                            }
                            placeholder="List A item"
                            minItems={1}
                          />
                        </div>

                        <div className="grid gap-2">
                          <div className="text-sm font-medium">List B</div>
                          <EditableList
                            items={state.productivity.listB}
                            onChange={(next) =>
                              setState((s) => ({
                                ...s,
                                productivity: { ...s.productivity, listB: next },
                              }))
                            }
                            placeholder="List B item"
                            minItems={1}
                          />
                        </div>

                        <div className="rounded-2xl border bg-muted/30 p-3">
                          <div className="font-semibold">Rule</div>
                          <div className="text-sm text-muted-foreground">Do List A before touching List B.</div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-2xl">
                      <CardHeader>
                        <SectionTitle
                          icon={Target}
                          title="Capture, Clarify, Calendar"
                          subtitle="Stop carrying tasks in your head."
                        />
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-2">
                          <div className="text-sm font-medium">Inbox</div>
                          <EditableList
                            items={state.productivity.inbox}
                            onChange={(next) =>
                              setState((s) => ({
                                ...s,
                                productivity: { ...s.productivity, inbox: next },
                              }))
                            }
                            placeholder="Dump tasks here"
                            minItems={1}
                          />
                        </div>

                        <div className="rounded-2xl border bg-muted/30 p-3">
                          <div className="font-semibold">Calendar rule</div>
                          <div className="text-sm text-muted-foreground">{state.productivity.calendarRule}</div>
                        </div>

                        <Textarea
                          value={state.productivity.calendarRule}
                          onChange={(e) =>
                            setState((s) => ({
                              ...s,
                              productivity: { ...s.productivity, calendarRule: e.target.value },
                            }))
                          }
                          placeholder="Edit the rule"
                        />
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="emotions" className="mt-4">
                  <Card className="rounded-2xl">
                    <CardHeader>
                      <SectionTitle
                        icon={HeartPulse}
                        title="Emotional regulation"
                        subtitle="Stability and recovery protocols you can actually use."
                      />
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {state.emotions.tools.map((t) => (
                          <div key={t.id} className="rounded-2xl border p-3 bg-background">
                            <div className="flex items-center justify-between">
                              <div className="font-medium">{t.name}</div>
                              <Button
                                variant="outline"
                                onClick={() =>
                                  setState((s) => ({
                                    ...s,
                                    emotions: {
                                      ...s.emotions,
                                      tools: s.emotions.tools.filter((x) => x.id !== t.id),
                                    },
                                  }))
                                }
                              >
                                Delete
                              </Button>
                            </div>
                            <Textarea
                              className="mt-2"
                              value={t.how}
                              onChange={(e) =>
                                setState((s) => ({
                                  ...s,
                                  emotions: {
                                    ...s.emotions,
                                    tools: s.emotions.tools.map((x) =>
                                      x.id === t.id ? { ...x, how: e.target.value } : x
                                    ),
                                  },
                                }))
                              }
                            />
                          </div>
                        ))}
                      </div>

                      <Button
                        onClick={() =>
                          setState((s) => ({
                            ...s,
                            emotions: {
                              ...s.emotions,
                              tools: [...s.emotions.tools, { id: uid(), name: "New tool", how: "" }],
                            },
                          }))
                        }
                      >
                        Add tool
                      </Button>

                      <Separator />

                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="debugger">
                          <AccordionTrigger>4-step mental debugger</AccordionTrigger>
                          <AccordionContent>
                            <div className="grid gap-2 text-sm">
                              <div className="rounded-xl border p-3 bg-muted/30">
                                <div className="font-medium">1) Name the state</div>
                                <div className="text-muted-foreground">Label it: anxious, avoiding, overwhelmed.</div>
                              </div>
                              <div className="rounded-xl border p-3 bg-muted/30">
                                <div className="font-medium">2) Identify the real problem</div>
                                <div className="text-muted-foreground">
                                  Unclear, too big, boring, scary, no next step.
                                </div>
                              </div>
                              <div className="rounded-xl border p-3 bg-muted/30">
                                <div className="font-medium">3) Shrink the task</div>
                                <div className="text-muted-foreground">Define a 2 to 5 minute next action.</div>
                              </div>
                              <div className="rounded-xl border p-3 bg-muted/30">
                                <div className="font-medium">4) Ugly first draft</div>
                                <div className="text-muted-foreground">
                                  Perfectionism is fear with good grammar.
                                </div>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="goals" className="mt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card className="rounded-2xl">
                      <CardHeader>
                        <SectionTitle
                          icon={Target}
                          title="Goal layers"
                          subtitle="Identity, outcomes, processes. Execution beats fantasy."
                        />
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-2">
                          <div className="text-sm font-medium">Identity goal</div>
                          <Textarea
                            value={state.goals.identity}
                            onChange={(e) =>
                              setState((s) => ({
                                ...s,
                                goals: { ...s.goals, identity: e.target.value },
                              }))
                            }
                          />
                        </div>

                        <div className="grid gap-2">
                          <div className="text-sm font-medium">Outcome goals</div>
                          <div className="grid gap-2">
                            {state.goals.outcomes.map((g) => (
                              <div key={g.id} className="flex gap-2">
                                <Input
                                  value={g.text}
                                  onChange={(e) =>
                                    setState((s) => ({
                                      ...s,
                                      goals: {
                                        ...s.goals,
                                        outcomes: s.goals.outcomes.map((x) =>
                                          x.id === g.id ? { ...x, text: e.target.value } : x
                                        ),
                                      },
                                    }))
                                  }
                                />
                                <Button
                                  variant="outline"
                                  onClick={() =>
                                    setState((s) => ({
                                      ...s,
                                      goals: {
                                        ...s.goals,
                                        outcomes: s.goals.outcomes.filter((x) => x.id !== g.id),
                                      },
                                    }))
                                  }
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                            <Button
                              onClick={() =>
                                setState((s) => ({
                                  ...s,
                                  goals: {
                                    ...s.goals,
                                    outcomes: [...s.goals.outcomes, { id: uid(), text: "" }],
                                  },
                                }))
                              }
                            >
                              Add outcome
                            </Button>
                          </div>
                        </div>

                        <div className="grid gap-2">
                          <div className="text-sm font-medium">Process goals</div>
                          <div className="grid gap-2">
                            {state.goals.processes.map((g) => (
                              <div key={g.id} className="flex gap-2">
                                <Input
                                  value={g.text}
                                  onChange={(e) =>
                                    setState((s) => ({
                                      ...s,
                                      goals: {
                                        ...s.goals,
                                        processes: s.goals.processes.map((x) =>
                                          x.id === g.id ? { ...x, text: e.target.value } : x
                                        ),
                                      },
                                    }))
                                  }
                                />
                                <Button
                                  variant="outline"
                                  onClick={() =>
                                    setState((s) => ({
                                      ...s,
                                      goals: {
                                        ...s.goals,
                                        processes: s.goals.processes.filter((x) => x.id !== g.id),
                                      },
                                    }))
                                  }
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                            <Button
                              onClick={() =>
                                setState((s) => ({
                                  ...s,
                                  goals: {
                                    ...s.goals,
                                    processes: [...s.goals.processes, { id: uid(), text: "" }],
                                  },
                                }))
                              }
                            >
                              Add process
                            </Button>
                          </div>
                        </div>
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
                                  Today: {day.consistency ?? 0}/{day.output ?? 0}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>Consistency / Output</TooltipContent>
                            </Tooltip>
                          }
                        />
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="rounded-2xl border bg-muted/30 p-4">
                          <div className="font-semibold">How to use this</div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            Early on, consistency matters more than results. Output follows.
                          </div>
                        </div>

                        <div className="grid gap-2">
                          {weekDates.map((d) => {
                            const rec = state.tracking.days[d];
                            const c = rec?.consistency ?? 0;
                            const o = rec?.output ?? 0;
                            return (
                              <div key={d} className="flex items-center justify-between rounded-2xl border p-3 bg-background">
                                <div className="text-sm font-medium">{formatISOToLabel(d)}</div>
                                <div className="flex items-center gap-2">
                                  <Badge className={scoreColor(c)} variant="outline">
                                    C {c}
                                  </Badge>
                                  <Badge className={scoreColor(o)} variant="outline">
                                    O {o}
                                  </Badge>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="logs" className="mt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card className="rounded-2xl">
                      <CardHeader>
                        <SectionTitle
                          icon={Shield}
                          title="Decision logs"
                          subtitle="Choices you made, with filter scores."
                        />
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {decisionLogs.length === 0 ? (
                          <div className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                            No decision logs yet. Use the Decision Wizard.
                          </div>
                        ) : (
                          <div className="grid gap-3">
                            {decisionLogs.slice(0, 20).map((l) => {
                              const v = state.values.find((x) => x.id === l.primaryValueId);
                              return (
                                <div key={l.id} className="rounded-2xl border p-3 bg-background">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <div className="font-medium">{l.decision}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {new Date(l.ts).toLocaleString()} | Avg {l.avg} | {l.verdict}
                                      </div>
                                      {v ? (
                                        <div className="mt-1">
                                          <Pill>Value: {v.label}</Pill>
                                        </div>
                                      ) : null}
                                    </div>
                                    <Button
                                      variant="outline"
                                      onClick={() => setDecisionLogs((d) => d.filter((x) => x.id !== l.id))}
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                  {l.notes ? <div className="mt-2 text-sm text-muted-foreground">{l.notes}</div> : null}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="rounded-2xl">
                      <CardHeader>
                        <SectionTitle
                          icon={BookOpen}
                          title="Operating manual"
                          subtitle="The short version you can re-read when life gets loud."
                        />
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="rounded-2xl border bg-muted/30 p-4 text-sm">
                          <div className="font-semibold">Minimum standard</div>
                          <ul className="mt-2 list-disc pl-5 text-muted-foreground space-y-1">
                            <li>No zero days. Do something small.</li>
                            <li>One Thing before everything else.</li>
                            <li>Protect health. The machine needs power.</li>
                            <li>When spiraling, HALT then shrink the next action.</li>
                            <li>Patch the system weekly.</li>
                          </ul>
                        </div>

                        <div className="rounded-2xl border p-4 bg-background">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold">Quick reset button</div>
                              <div className="text-sm text-muted-foreground">When you feel stuck, do this.</div>
                            </div>
                            <Button
                              variant="secondary"
                              onClick={() => {
                                setDayPatch({
                                  notes:
                                    (day.notes ? day.notes + "\n\n" : "") +
                                    "Reset: name state, identify problem, 2 minute next action, ugly draft.",
                                });
                                setActiveTab("dashboard");
                              }}
                            >
                              Reset protocol
                            </Button>
                          </div>

                          <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                            <div>
                              <b>1)</b> Name the state.
                            </div>
                            <div>
                              <b>2)</b> Identify the real problem.
                            </div>
                            <div>
                              <b>3)</b> Shrink to 2 to 5 minutes.
                            </div>
                            <div>
                              <b>4)</b> Start ugly.
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="text-xs text-muted-foreground pb-6">
              Local-only app. Your data stays in your browser via localStorage. Use Backup and Restore for JSON exports.
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {celebrate ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed right-5 top-5 z-50 rounded-xl border bg-background/95 px-4 py-3 shadow-lg"
          >
            <div className="inline-flex items-center gap-2 text-sm font-medium">
              <PartyPopper className="h-4 w-4" /> {celebrateMsg}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-2xl border bg-background/95 px-3 py-2 shadow-lg backdrop-blur">
        <Badge variant="outline" className="hidden sm:inline-flex">
          <span className="inline-flex items-center gap-1">
            <Gem className="h-3.5 w-3.5" />
            {coins}
          </span>
        </Badge>
        <Button size="sm" variant="outline" onClick={() => setActiveTab("dashboard")}>
          Daily
        </Button>
        <Button size="sm" variant="outline" onClick={() => setActiveTab("productivity")}>
          Focus
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => applyLootReward(LOOT_REWARDS[Math.floor(Math.random() * LOOT_REWARDS.length)])}
        >
          Loot
        </Button>
        <Button size="sm" onClick={() => setDayPatch({ oneThingDone: !day.oneThingDone })}>
          Toggle One Thing
        </Button>
      </div>
    </TooltipProvider>
  );
}
