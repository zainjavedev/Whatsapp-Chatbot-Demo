"use client";

import { startTransition, useEffect, useState } from "react";

type Niche = "dental" | "aesthetic" | "clinic" | "spa" | "salon";

type DemoConfig = {
  niche: Niche;
  businessName: string;
  avatar: string;
  customerQuestion: string;
  botReply: string;
  provider: string;
  service: string;
  slotOne: string;
  slotTwo: string;
};

const presets: Record<Niche, Omit<DemoConfig, "niche"> & { label: string }> = {
  dental: {
    label: "Dental clinic",
    businessName: "Pearl Dental Clinic",
    avatar: "D",
    customerQuestion: "Assalam o Alaikum, is a dentist available tomorrow? I have severe tooth pain.",
    botReply: "Wa Alaikum Assalam. Yes, Dr. Hamza is available tomorrow. Please choose a time:",
    provider: "Dr. Hamza",
    service: "Dental consultation",
    slotOne: "11:30 AM",
    slotTwo: "4:00 PM",
  },
  aesthetic: {
    label: "Aesthetic clinic",
    businessName: "Aura Aesthetic Clinic",
    avatar: "A",
    customerQuestion: "Hi, what is the price for laser hair removal? Do you have a slot tomorrow?",
    botReply: "Hi. Packages start from PKR 6,500. These consultation slots are available tomorrow:",
    provider: "Dr. Sara",
    service: "Laser consultation",
    slotOne: "2:30 PM",
    slotTwo: "5:00 PM",
  },
  clinic: {
    label: "General clinic",
    businessName: "City Care Clinic",
    avatar: "C",
    customerQuestion: "Assalam o Alaikum, is the doctor available tomorrow evening?",
    botReply: "Wa Alaikum Assalam. Yes, the doctor is available. Please choose a time:",
    provider: "Dr. Ahmed",
    service: "Doctor consultation",
    slotOne: "5:30 PM",
    slotTwo: "7:00 PM",
  },
  spa: {
    label: "Spa",
    businessName: "Sens Spa",
    avatar: "S",
    customerQuestion: "Hi, what is the price for a full body massage? Is 4 PM available tomorrow?",
    botReply: "Hi. A full body massage is PKR 6,000. These times are available tomorrow:",
    provider: "Ayesha",
    service: "Full body massage",
    slotOne: "2:00 PM",
    slotTwo: "4:00 PM",
  },
  salon: {
    label: "Salon",
    businessName: "Canvas Salon",
    avatar: "S",
    customerQuestion: "Hi, can I book a haircut tomorrow afternoon?",
    botReply: "Hi. Yes, these haircut appointments are available tomorrow:",
    provider: "Maha",
    service: "Haircut appointment",
    slotOne: "3:00 PM",
    slotTwo: "4:30 PM",
  },
};

const nicheKeys = Object.keys(presets) as Niche[];

function configFor(niche: Niche): DemoConfig {
  const { label: _label, ...preset } = presets[niche];
  return { niche, ...preset };
}

function isNiche(value: string | null): value is Niche {
  return value !== null && nicheKeys.includes(value as Niche);
}

function DemoPhone({
  config,
  animated = false,
  replayKey = 0,
}: {
  config: DemoConfig;
  animated?: boolean;
  replayKey?: number;
}) {
  const [step, setStep] = useState(animated ? 0 : 6);
  const businessName = config.businessName.trim() || "Your Business";

  useEffect(() => {
    if (!animated) {
      setStep(6);
      return;
    }

    setStep(0);
    const timers = [
      window.setTimeout(() => setStep(1), 550),
      window.setTimeout(() => setStep(2), 1650),
      window.setTimeout(() => setStep(3), 2950),
      window.setTimeout(() => setStep(4), 3850),
      window.setTimeout(() => setStep(5), 4750),
      window.setTimeout(() => setStep(6), 5850),
    ];

    return () => timers.forEach(window.clearTimeout);
  }, [animated, replayKey]);

  return (
    <div className="phone-frame">
      <div className="phone-status">
        <span>11:18</span>
        <span>4G&nbsp;&nbsp;◢&nbsp;&nbsp;81%</span>
      </div>
      <div className="wa-header">
        <span className="back">←</span>
        <span className="wa-avatar">{config.avatar}</span>
        <span className="wa-business">
          <strong>{businessName}</strong>
          <small>Business Account</small>
        </span>
        <span className="wa-action">▣</span>
        <span className="wa-action">☎</span>
        <span className="wa-menu">⋮</span>
      </div>

      <div className="wa-chat">
        <span className="today">Today</span>
        <div className="chat-stack">
          <div className={`bubble outgoing demo-message ${step >= 1 ? "shown" : ""}`}>
            {config.customerQuestion}
            <span className="bubble-meta">11:18 am <b>✓✓</b></span>
          </div>
          <div className={`bubble incoming slot-card demo-message ${step >= 2 ? "shown" : ""}`}>
            {config.botReply}
            <span className="slot">{config.slotOne}</span>
            <span className="slot">{config.slotTwo}</span>
            <span className="bubble-meta">11:18 am</span>
          </div>
          <div className={`bubble outgoing short demo-message ${step >= 3 ? "shown" : ""}`}>
            {config.slotTwo}
            <span className="bubble-meta">11:19 am <b>✓✓</b></span>
          </div>
          <div className={`bubble incoming demo-message ${step >= 4 ? "shown" : ""}`}>
            Sure. What name should I book it under?
            <span className="bubble-meta">11:19 am</span>
          </div>
          <div className={`bubble outgoing short demo-message ${step >= 5 ? "shown" : ""}`}>
            Zain Javed
            <span className="bubble-meta">11:19 am <b>✓✓</b></span>
          </div>
          <div className={`bubble incoming confirmation demo-message ${step >= 6 ? "shown" : ""}`}>
            <strong>Appointment confirmed</strong>
            <span>{config.service}</span>
            <span>{config.provider} · Tomorrow at {config.slotTwo}</span>
            <span>{businessName}</span>
            <span className="bubble-meta">11:19 am</span>
          </div>
        </div>
      </div>

      <div className="wa-composer">
        <div className="message-input">☺&nbsp;&nbsp; Message <span>⌕&nbsp;&nbsp;▣</span></div>
        <div className="microphone">●</div>
      </div>
      <div className="android-nav"><span>■</span><span>○</span><span>◀</span></div>
    </div>
  );
}

export default function Home() {
  const [config, setConfig] = useState<DemoConfig>(() => configFor("dental"));
  const [demoMode, setDemoMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [replayKey, setReplayKey] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const niche = isNiche(params.get("niche")) ? params.get("niche") as Niche : "dental";
    const base = configFor(niche);

    setConfig({
      ...base,
      businessName: params.get("business") || base.businessName,
      customerQuestion: params.get("question") || base.customerQuestion,
      botReply: params.get("reply") || base.botReply,
      provider: params.get("provider") || base.provider,
      service: params.get("service") || base.service,
      slotOne: params.get("slot1") || base.slotOne,
      slotTwo: params.get("slot2") || base.slotTwo,
    });
    setDemoMode(params.get("view") === "demo");
  }, []);

  function update<K extends keyof DemoConfig>(key: K, value: DemoConfig[K]) {
    setConfig((current) => ({ ...current, [key]: value }));
    setCopied(false);
  }

  function chooseNiche(niche: Niche) {
    startTransition(() => setConfig(configFor(niche)));
    setCopied(false);
  }

  function makeDemoUrl() {
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("view", "demo");
    url.searchParams.set("niche", config.niche);
    url.searchParams.set("business", config.businessName);
    url.searchParams.set("question", config.customerQuestion);
    url.searchParams.set("reply", config.botReply);
    url.searchParams.set("provider", config.provider);
    url.searchParams.set("service", config.service);
    url.searchParams.set("slot1", config.slotOne);
    url.searchParams.set("slot2", config.slotTwo);
    return url.toString();
  }

  async function copyDemoLink() {
    await navigator.clipboard.writeText(makeDemoUrl());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  }

  if (demoMode) {
    return (
      <main className="public-demo">
        <div className="demo-copy">
          <p className="eyebrow">Booking automation demo</p>
          <h1>Every inquiry can become a booking.</h1>
          <p>
            A simulated WhatsApp flow personalized for {config.businessName.trim() || "your business"}.
          </p>
          <button className="replay-button" type="button" onClick={() => setReplayKey((key) => key + 1)}>
            Replay conversation
          </button>
          <small>Demo simulation · No patient data</small>
        </div>
        <section className="public-phone" aria-label="Animated WhatsApp booking demo">
          <div className="preview-glow" />
          <DemoPhone config={config} animated replayKey={replayKey} />
        </section>
      </main>
    );
  }

  return (
    <main className="workspace">
      <header className="topbar">
        <div className="wordmark">
          <span className="wordmark-dot" />
          Demo Lab
        </div>
        <span className="top-note">WhatsApp booking demos</span>
      </header>

      <section className="editor-panel">
        <p className="eyebrow">Personal demo builder</p>
        <h1>Make it feel built for them.</h1>
        <p className="lede">Choose a preset, change the details, then share the animated demo.</p>

        <div className="field-group">
          <label htmlFor="business">Business name</label>
          <input
            id="business"
            value={config.businessName}
            onChange={(event) => update("businessName", event.target.value)}
            placeholder="Enter prospect name"
          />
        </div>

        <fieldset className="field-group">
          <legend>Business type</legend>
          <div className="niche-grid">
            {nicheKeys.map((key) => (
              <button
                className={key === config.niche ? "niche active" : "niche"}
                key={key}
                type="button"
                onClick={() => chooseNiche(key)}
              >
                {presets[key].label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="section-rule"><span>Conversation</span></div>

        <div className="field-group">
          <label htmlFor="question">Customer question</label>
          <textarea
            id="question"
            rows={3}
            value={config.customerQuestion}
            onChange={(event) => update("customerQuestion", event.target.value)}
          />
        </div>

        <div className="field-group">
          <label htmlFor="reply">Automatic answer</label>
          <textarea
            id="reply"
            rows={3}
            value={config.botReply}
            onChange={(event) => update("botReply", event.target.value)}
          />
        </div>

        <div className="two-fields">
          <div className="field-group">
            <label htmlFor="provider">Doctor / staff</label>
            <input id="provider" value={config.provider} onChange={(event) => update("provider", event.target.value)} />
          </div>
          <div className="field-group">
            <label htmlFor="service">Service</label>
            <input id="service" value={config.service} onChange={(event) => update("service", event.target.value)} />
          </div>
        </div>

        <div className="two-fields">
          <div className="field-group">
            <label htmlFor="slot-one">First slot</label>
            <input id="slot-one" value={config.slotOne} onChange={(event) => update("slotOne", event.target.value)} />
          </div>
          <div className="field-group">
            <label htmlFor="slot-two">Booked slot</label>
            <input id="slot-two" value={config.slotTwo} onChange={(event) => update("slotTwo", event.target.value)} />
          </div>
        </div>

        <div className="share-actions">
          <button className="primary-action" type="button" onClick={copyDemoLink}>
            {copied ? "Link copied" : "Copy demo link"}
          </button>
          <button className="secondary-action" type="button" onClick={() => window.open(makeDemoUrl(), "_blank", "noopener,noreferrer")}>
            Open demo
          </button>
        </div>
      </section>

      <section className="preview-panel" aria-label="WhatsApp demo preview">
        <div className="preview-label">
          <span>Live preview</span>
          <strong>{config.businessName.trim() || "Your Business"}</strong>
        </div>
        <div className="preview-glow" />
        <DemoPhone config={config} />
      </section>
    </main>
  );
}
