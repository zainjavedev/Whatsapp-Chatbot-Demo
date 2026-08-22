"use client";

import html2canvas from "html2canvas";
import { startTransition, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

type Niche = "dental" | "aesthetic" | "clinic" | "spa" | "salon";
type Device = "android" | "iphone";

type DemoConfig = {
  niche: Niche;
  businessName: string;
  customerName: string;
  avatar: string;
  customerQuestion: string;
  botReply: string;
  provider: string;
  service: string;
  slotOne: string;
  slotTwo: string;
};

const defaultCustomerName = "Ubaid Khan";

const presets: Record<Niche, Omit<DemoConfig, "niche" | "customerName"> & { label: string }> = {
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
  const preset = presets[niche];
  return {
    niche,
    businessName: preset.businessName,
    customerName: defaultCustomerName,
    avatar: preset.avatar,
    customerQuestion: preset.customerQuestion,
    botReply: preset.botReply,
    provider: preset.provider,
    service: preset.service,
    slotOne: preset.slotOne,
    slotTwo: preset.slotTwo,
  };
}

function isNiche(value: string | null): value is Niche {
  return value !== null && nicheKeys.includes(value as Niche);
}

function isDevice(value: string | null): value is Device {
  return value === "android" || value === "iphone";
}

const videoWidth = 1080;
const videoHeight = 1920;
const videoDuration = 7200;
const videoRevealTimes = [0, 550, 1650, 2950, 3850, 4750, 5850];
const videoTransitionDuration = 280;

type VideoBubbleBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  cssScale: number;
  direction: "incoming" | "outgoing";
};

type VideoSnapshot = {
  full: HTMLCanvasElement;
  base: HTMLCanvasElement;
  bubble?: VideoBubbleBounds;
};

function waitForPaint() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

function drawVideoBackground(context: CanvasRenderingContext2D) {
  const background = context.createLinearGradient(0, 0, videoWidth, videoHeight);
  background.addColorStop(0, "#f8f4eb");
  background.addColorStop(1, "#dfe9e2");
  context.fillStyle = background;
  context.fillRect(0, 0, videoWidth, videoHeight);

  const glow = context.createRadialGradient(760, 720, 20, 760, 720, 600);
  glow.addColorStop(0, "rgba(216, 239, 87, 0.5)");
  glow.addColorStop(1, "rgba(216, 239, 87, 0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, videoWidth, videoHeight);
}

function getPhonePlacement(snapshot: HTMLCanvasElement) {
  const scale = Math.min(790 / snapshot.width, 1690 / snapshot.height);
  const width = snapshot.width * scale;
  const height = snapshot.height * scale;
  return {
    scale,
    width,
    height,
    x: (videoWidth - width) / 2,
    y: (videoHeight - height) / 2,
  };
}

function drawPhoneSnapshot(
  context: CanvasRenderingContext2D,
  snapshot: HTMLCanvasElement,
  opacity = 1,
) {
  const placement = getPhonePlacement(snapshot);

  context.save();
  context.globalAlpha = opacity;
  context.drawImage(snapshot, placement.x, placement.y, placement.width, placement.height);
  context.restore();
}

function drawPhoneShadow(context: CanvasRenderingContext2D, snapshot: HTMLCanvasElement) {
  const placement = getPhonePlacement(snapshot);

  context.save();
  context.fillStyle = "rgba(17, 35, 28, 0.16)";
  context.shadowColor = "rgba(17, 35, 28, 0.34)";
  context.shadowBlur = 70;
  context.shadowOffsetY = 32;
  context.beginPath();
  context.roundRect(
    placement.x + 8,
    placement.y + 8,
    placement.width - 16,
    placement.height - 16,
    placement.width * 0.1,
  );
  context.fill();
  context.restore();
}

function animationEase(progress: number) {
  const target = Math.min(1, Math.max(0, progress));
  let low = 0;
  let high = 1;
  let time = target;

  for (let iteration = 0; iteration < 10; iteration += 1) {
    time = (low + high) / 2;
    const inverse = 1 - time;
    const x = 3 * inverse * inverse * time * 0.2 + 3 * inverse * time * time * 0.2 + time ** 3;
    if (x < target) low = time;
    else high = time;
  }

  const inverse = 1 - time;
  return 3 * inverse * inverse * time * 0.8 + 3 * inverse * time * time + time ** 3;
}

function drawAnimatedBubble(
  context: CanvasRenderingContext2D,
  snapshot: VideoSnapshot,
  progress: number,
) {
  if (!snapshot.bubble) return;
  const placement = getPhonePlacement(snapshot.full);
  const bubble = snapshot.bubble;
  const eased = animationEase(progress);
  const x = placement.x + bubble.x * placement.scale;
  const y = placement.y + bubble.y * placement.scale;
  const width = bubble.width * placement.scale;
  const height = bubble.height * placement.scale;
  const radius = bubble.radius * placement.scale;
  const tail = 8 * bubble.cssScale * placement.scale;
  const translateY = 9 * bubble.cssScale * placement.scale * (1 - eased);
  const bubbleScale = 0.985 + 0.015 * eased;
  const centerX = x + width / 2;
  const centerY = y + height / 2;

  context.save();
  context.globalAlpha = eased;
  context.translate(centerX, centerY + translateY);
  context.scale(bubbleScale, bubbleScale);
  context.translate(-centerX, -centerY);
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  if (bubble.direction === "incoming") {
    context.moveTo(x + 1, y);
    context.lineTo(x - tail, y);
    context.lineTo(x + 1, y + tail);
  } else {
    context.moveTo(x + width - 1, y);
    context.lineTo(x + width + tail, y + tail);
    context.lineTo(x + width - 1, y);
  }
  context.closePath();
  context.clip();
  context.drawImage(
    snapshot.full,
    placement.x,
    placement.y,
    placement.width,
    placement.height,
  );
  context.restore();
}

function drawVideoFrame(
  context: CanvasRenderingContext2D,
  snapshots: VideoSnapshot[],
  elapsed: number,
) {
  drawVideoBackground(context);
  const step = videoRevealTimes.findLastIndex((revealAt) => elapsed >= revealAt);
  const safeStep = Math.max(0, step);
  const transition = safeStep === 0
    ? 1
    : Math.min(1, Math.max(0, (elapsed - videoRevealTimes[safeStep]) / videoTransitionDuration));

  const snapshot = snapshots[safeStep];
  drawPhoneShadow(context, snapshot.full);
  if (safeStep > 0 && transition < 1) {
    drawPhoneSnapshot(context, snapshot.base);
    drawAnimatedBubble(context, snapshot, transition);
  } else {
    drawPhoneSnapshot(context, snapshot.full);
  }
}

type WhatsAppIconName = "back" | "chevron" | "video" | "videoOutline" | "phone" | "phoneOutline" | "plus" | "menu" | "smile" | "paperclip" | "camera" | "mic" | "signal" | "wifi" | "battery";

function WhatsAppIcon({ name }: { name: WhatsAppIconName }) {
  if (name === "chevron") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15.5 4-8 8 8 8" /></svg>;
  }

  if (name === "plus") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5" /><path d="M12 7.5v9M7.5 12h9" /></svg>;
  }

  if (name === "videoOutline") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="13" height="12" rx="3" /><path d="m16 10 5-3v10l-5-3" /></svg>;
  }

  if (name === "phoneOutline") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.2 3.5h3l1.2 4-2.1 1.4a13.3 13.3 0 0 0 5.8 5.8l1.4-2.1 4 1.2v3a2 2 0 0 1-2 2C10.9 18.8 5.2 13.1 5.2 6.5a3 3 0 0 1 2-3Z" /></svg>;
  }

  if (name === "menu") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" />
      </svg>
    );
  }

  if (name === "video") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h8A2.5 2.5 0 0 1 17 6.5v2.1l4-2.4v11.6l-4-2.4v2.1a2.5 2.5 0 0 1-2.5 2.5h-8A2.5 2.5 0 0 1 4 17.5z" /></svg>;
  }

  if (name === "phone") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.2 1.2.4 2.5.7 3.8.7.6 0 1 .4 1 1v3.5c0 .6-.4 1-1 1A17.3 17.3 0 0 1 2.8 3.7c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.6.7 3.8.1.4 0 .8-.2 1.1z" /></svg>;
  }

  if (name === "smile") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><circle cx="9" cy="10" r="1" /><circle cx="15" cy="10" r="1" /><path d="M8.5 14c.9 1.4 2 2 3.5 2s2.6-.6 3.5-2" /></svg>;
  }

  if (name === "paperclip") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m20.5 11.5-8.3 8.3a6 6 0 0 1-8.5-8.5l9-9a4 4 0 1 1 5.7 5.7l-9 9a2 2 0 0 1-2.8-2.8l8.3-8.3" /></svg>;
  }

  if (name === "camera") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4.2 6h3.1l1.6-2h6.2l1.6 2h3.1A2.2 2.2 0 0 1 22 8.2v10.6a2.2 2.2 0 0 1-2.2 2.2H4.2A2.2 2.2 0 0 1 2 18.8V8.2A2.2 2.2 0 0 1 4.2 6Z" />
        <circle className="camera-lens-cutout" cx="12" cy="13" r="4.6" />
        <circle className="camera-lens" cx="12" cy="13" r="3" />
      </svg>
    );
  }

  if (name === "mic") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 15.1a3.7 3.7 0 0 0 3.7-3.7V5.7a3.7 3.7 0 1 0-7.4 0v5.7a3.7 3.7 0 0 0 3.7 3.7Z" />
        <path d="M18.3 10.7v.7a6.3 6.3 0 0 1-5.3 6.2V20h3v2H8v-2h3v-2.4a6.3 6.3 0 0 1-5.3-6.2v-.7h2v.7a4.3 4.3 0 1 0 8.6 0v-.7Z" />
      </svg>
    );
  }

  if (name === "signal") {
    return <svg viewBox="0 0 20 16" aria-hidden="true"><rect x="1" y="11" width="3" height="4" rx="1" /><rect x="6" y="8" width="3" height="7" rx="1" /><rect x="11" y="5" width="3" height="10" rx="1" /><rect x="16" y="1" width="3" height="14" rx="1" /></svg>;
  }

  if (name === "wifi") {
    return <svg viewBox="0 0 24 20" aria-hidden="true"><path d="M2 6.5a15.5 15.5 0 0 1 20 0M5.5 10a10.5 10.5 0 0 1 13 0M9 13.5a5.4 5.4 0 0 1 6 0" /><circle cx="12" cy="17" r="1.5" /></svg>;
  }

  if (name === "battery") {
    return <svg viewBox="0 0 28 14" aria-hidden="true"><rect x="1" y="1" width="23" height="12" rx="2" /><path d="M26 5v4" /><rect x="3.5" y="3.5" width="17" height="7" rx="1" /></svg>;
  }

  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20z" /></svg>;
}

function DemoPhone({
  config,
  device,
  animated = false,
  replayKey = 0,
  forcedStep,
}: {
  config: DemoConfig;
  device: Device;
  animated?: boolean;
  replayKey?: number;
  forcedStep?: number;
}) {
  const [step, setStep] = useState(animated ? 0 : 6);
  const visibleStep = forcedStep ?? step;
  const businessName = config.businessName.trim() || "Your Business";
  const avatarLetter = businessName.charAt(0).toUpperCase() || config.avatar;

  useEffect(() => {
    if (!animated) return;

    const timers = [
      window.setTimeout(() => setStep(0), 0),
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
    <div className={`phone-frame device-${device}`}>
      <div className="phone-status">
        <span>{device === "iphone" ? "9:41" : "11:18"}</span>
        <span className="ios-island" />
        <span className="phone-indicators">
          <span>{device === "iphone" ? "5G" : "4G"}</span>
          <WhatsAppIcon name="signal" />
          <WhatsAppIcon name="wifi" />
          <WhatsAppIcon name="battery" />
          {device === "android" && <span>81%</span>}
        </span>
      </div>
      {device === "iphone" ? (
        <div className="wa-header ios-header">
          <span className="ios-back"><WhatsAppIcon name="chevron" /><small>12</small></span>
          <span className="ios-contact">
            <span className="wa-avatar">{avatarLetter}</span>
            <span className="wa-business">
              <strong>{businessName}</strong>
              <small>Business account</small>
            </span>
          </span>
          <span className="ios-header-actions">
            <WhatsAppIcon name="videoOutline" />
            <WhatsAppIcon name="phoneOutline" />
          </span>
        </div>
      ) : (
        <div className="wa-header">
          <span className="back"><WhatsAppIcon name="back" /></span>
          <span className="wa-avatar">{avatarLetter}</span>
          <span className="wa-business">
            <strong>{businessName}</strong>
            <small>Business Account</small>
          </span>
          <span className="wa-action"><WhatsAppIcon name="video" /></span>
          <span className="wa-action"><WhatsAppIcon name="phone" /></span>
          <span className="wa-menu"><WhatsAppIcon name="menu" /></span>
        </div>
      )}

      <div className="wa-chat">
        <span className="today">Today</span>
        <div className="chat-stack">
          <div className={`bubble outgoing demo-message ${visibleStep >= 1 ? "shown" : ""}`}>
            {config.customerQuestion}
            <span className="bubble-meta">11:18 am <b>✓✓</b></span>
          </div>
          <div className={`bubble incoming slot-card demo-message ${visibleStep >= 2 ? "shown" : ""}`}>
            {config.botReply}
            <span className="slot">{config.slotOne}</span>
            <span className="slot">{config.slotTwo}</span>
            <span className="bubble-meta">11:18 am</span>
          </div>
          <div className={`bubble outgoing short demo-message ${visibleStep >= 3 ? "shown" : ""}`}>
            {config.slotTwo}
            <span className="bubble-meta">11:19 am <b>✓✓</b></span>
          </div>
          <div className={`bubble incoming demo-message ${visibleStep >= 4 ? "shown" : ""}`}>
            Sure. What name should I book it under?
            <span className="bubble-meta">11:19 am</span>
          </div>
          <div className={`bubble outgoing short demo-message ${visibleStep >= 5 ? "shown" : ""}`}>
            {config.customerName.trim() || defaultCustomerName}
            <span className="bubble-meta">11:19 am <b>✓✓</b></span>
          </div>
          <div className={`bubble incoming confirmation demo-message ${visibleStep >= 6 ? "shown" : ""}`}>
            <strong>Appointment confirmed</strong>
            <span>{config.service}</span>
            <span>{config.provider} · Tomorrow at {config.slotTwo}</span>
            <span>{businessName}</span>
            <span className="bubble-meta">11:19 am</span>
          </div>
        </div>
      </div>

      {device === "iphone" ? (
        <div className="wa-composer ios-composer">
          <span className="ios-plus"><WhatsAppIcon name="plus" /></span>
          <div className="message-input">
            <span>Message</span>
            <WhatsAppIcon name="camera" />
          </div>
          <span className="ios-microphone"><WhatsAppIcon name="mic" /></span>
        </div>
      ) : (
        <div className="wa-composer">
          <div className="message-input">
            <span className="message-placeholder"><WhatsAppIcon name="smile" />Message</span>
            <span className="composer-icons"><WhatsAppIcon name="paperclip" /><WhatsAppIcon name="camera" /></span>
          </div>
          <div className="microphone"><WhatsAppIcon name="mic" /></div>
        </div>
      )}
      {device === "android" ? (
        <div className="android-nav"><span className="nav-square" /><span className="nav-circle" /><span className="nav-triangle" /></div>
      ) : (
        <div className="iphone-nav"><span /></div>
      )}
    </div>
  );
}

export default function Home() {
  const [config, setConfig] = useState<DemoConfig>(() => configFor("dental"));
  const [device, setDevice] = useState<Device>("android");
  const [demoMode, setDemoMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [replayKey, setReplayKey] = useState(0);
  const [captureStep, setCaptureStep] = useState(6);
  const [videoState, setVideoState] = useState<"idle" | "rendering" | "done" | "failed">("idle");
  const captureStageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initialize = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const niche = isNiche(params.get("niche")) ? params.get("niche") as Niche : "dental";
      const base = configFor(niche);

      setConfig({
        ...base,
        businessName: params.get("business") || base.businessName,
        customerName: params.get("customer") || base.customerName,
        customerQuestion: params.get("question") || base.customerQuestion,
        botReply: params.get("reply") || base.botReply,
        provider: params.get("provider") || base.provider,
        service: params.get("service") || base.service,
        slotOne: params.get("slot1") || base.slotOne,
        slotTwo: params.get("slot2") || base.slotTwo,
      });
      setDevice(isDevice(params.get("device")) ? params.get("device") as Device : "android");
      setDemoMode(params.get("view") === "demo");
    }, 0);

    return () => window.clearTimeout(initialize);
  }, []);

  function update<K extends keyof DemoConfig>(key: K, value: DemoConfig[K]) {
    setConfig((current) => ({ ...current, [key]: value }));
    setCopied(false);
  }

  function chooseNiche(niche: Niche) {
    startTransition(() => setConfig(configFor(niche)));
    setCopied(false);
  }

  function chooseDevice(nextDevice: Device) {
    setDevice(nextDevice);
    setCopied(false);
  }

  function makeDemoUrl() {
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("view", "demo");
    url.searchParams.set("niche", config.niche);
    url.searchParams.set("business", config.businessName);
    url.searchParams.set("customer", config.customerName);
    url.searchParams.set("device", device);
    return url.toString();
  }

  async function copyDemoLink() {
    await navigator.clipboard.writeText(makeDemoUrl());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  }

  async function downloadVideo() {
    if (videoState === "rendering") return;
    setVideoState("rendering");
    let stream: MediaStream | null = null;

    try {
      const capturePhone = captureStageRef.current?.querySelector<HTMLElement>(".phone-frame");
      if (!capturePhone) throw new Error("The phone mockup is not ready.");

      await document.fonts.ready;
      const snapshots: VideoSnapshot[] = [];
      for (let step = 0; step < videoRevealTimes.length; step += 1) {
        flushSync(() => setCaptureStep(step));
        await waitForPaint();
        const full = await html2canvas(capturePhone, {
          backgroundColor: null,
          logging: false,
          scale: 3,
          useCORS: true,
        });
        let base = full;
        let bubble: VideoBubbleBounds | undefined;

        if (step > 0) {
          const messages = capturePhone.querySelectorAll<HTMLElement>(".demo-message");
          const newestMessage = messages[step - 1];
          if (newestMessage) {
            const phoneRect = capturePhone.getBoundingClientRect();
            const bubbleRect = newestMessage.getBoundingClientRect();
            const pixelScale = full.width / phoneRect.width;
            const styles = window.getComputedStyle(newestMessage);
            bubble = {
              x: (bubbleRect.left - phoneRect.left) * pixelScale,
              y: (bubbleRect.top - phoneRect.top) * pixelScale,
              width: bubbleRect.width * pixelScale,
              height: bubbleRect.height * pixelScale,
              radius: parseFloat(styles.borderBottomRightRadius) * pixelScale,
              cssScale: pixelScale,
              direction: newestMessage.classList.contains("incoming") ? "incoming" : "outgoing",
            };

            const previousVisibility = newestMessage.style.visibility;
            newestMessage.style.visibility = "hidden";
            try {
              await waitForPaint();
              base = await html2canvas(capturePhone, {
                backgroundColor: null,
                logging: false,
                scale: 3,
                useCORS: true,
              });
            } finally {
              newestMessage.style.visibility = previousVisibility;
            }
          }
        }

        snapshots.push({ full, base, bubble });
      }

      const canvas = document.createElement("canvas");
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      const context = canvas.getContext("2d");
      if (!context || typeof canvas.captureStream !== "function" || typeof MediaRecorder === "undefined") {
        throw new Error("Video export is not supported in this browser.");
      }

      const formats = [
        { mimeType: "video/mp4;codecs=avc1.42E01E", extension: "mp4" },
        { mimeType: "video/mp4", extension: "mp4" },
        { mimeType: "video/webm;codecs=vp9", extension: "webm" },
        { mimeType: "video/webm", extension: "webm" },
      ];
      const format = formats.find(({ mimeType }) => MediaRecorder.isTypeSupported(mimeType));
      stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, {
        ...(format ? { mimeType: format.mimeType } : {}),
        videoBitsPerSecond: 10_000_000,
      });
      const chunks: BlobPart[] = [];
      const recording = new Promise<Blob>((resolve, reject) => {
        recorder.ondataavailable = (event) => {
          if (event.data.size) chunks.push(event.data);
        };
        recorder.onerror = () => reject(new Error("The browser could not record the demo."));
        recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType || "video/webm" }));
      });

      drawVideoFrame(context, snapshots, 0);
      recorder.start(200);
      const startedAt = performance.now();
      await new Promise<void>((resolve) => {
        function renderFrame(now: number) {
          const elapsed = Math.min(now - startedAt, videoDuration);
          drawVideoFrame(context!, snapshots, elapsed);
          if (elapsed < videoDuration) {
            requestAnimationFrame(renderFrame);
          } else {
            resolve();
          }
        }
        requestAnimationFrame(renderFrame);
      });
      await new Promise((resolve) => window.setTimeout(resolve, 180));
      recorder.stop();

      const blob = await recording;
      const extension = (recorder.mimeType || format?.mimeType || "").includes("mp4") ? "mp4" : "webm";
      const safeName = (config.businessName.trim() || "booking-demo")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${safeName || "booking-demo"}-whatsapp-demo.${extension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1500);
      setVideoState("done");
      window.setTimeout(() => setVideoState("idle"), 6000);
    } catch (error) {
      console.error(error);
      setVideoState("failed");
      window.setTimeout(() => setVideoState("idle"), 3000);
    } finally {
      stream?.getTracks().forEach((track) => track.stop());
      setCaptureStep(6);
    }
  }

  const videoCaptureStage = (
    <div className="video-capture-stage" ref={captureStageRef} aria-hidden="true">
      <DemoPhone config={config} device={device} forcedStep={captureStep} />
    </div>
  );

  if (demoMode) {
    return (
      <>
        <main className="public-demo">
          <div className="demo-copy">
            <p className="eyebrow">Booking automation demo</p>
            <h1>Every inquiry can become a booking.</h1>
            <p>
              A simulated WhatsApp flow personalized for {config.businessName.trim() || "your business"}.
            </p>
            <div className="demo-actions">
              <button className="replay-button" type="button" onClick={() => setReplayKey((key) => key + 1)}>
                Replay conversation
              </button>
              <button className="download-button" type="button" onClick={downloadVideo} disabled={videoState === "rendering"}>
                {videoState === "rendering" ? "Rendering video..." : videoState === "done" ? "Downloaded" : videoState === "failed" ? "Export failed" : "Download video"}
              </button>
            </div>
            <small>Demo simulation · No patient data</small>
          </div>
          <section className="public-phone" aria-label="Animated WhatsApp booking demo">
            <div className="preview-glow" />
            <DemoPhone config={config} device={device} animated replayKey={replayKey} />
          </section>
        </main>
        {videoCaptureStage}
      </>
    );
  }

  return (
    <>
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
        <h1>Build their demo.</h1>
        <p className="lede">Choose the niche and add the prospect&apos;s business name.</p>

        <div className="field-group">
          <label htmlFor="business">Business name</label>
          <input
            id="business"
            value={config.businessName}
            onChange={(event) => update("businessName", event.target.value)}
            placeholder="Enter prospect name"
          />
        </div>

        <div className="field-group">
          <label htmlFor="customer">Customer name</label>
          <input
            id="customer"
            value={config.customerName}
            onChange={(event) => update("customerName", event.target.value)}
            placeholder={defaultCustomerName}
          />
        </div>

        <fieldset className="field-group">
          <legend>Niche</legend>
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

        <fieldset className="field-group">
          <legend>Phone</legend>
          <div className="device-switch">
            {(["android", "iphone"] as Device[]).map((option) => (
              <button
                className={device === option ? "device-option active" : "device-option"}
                key={option}
                type="button"
                onClick={() => chooseDevice(option)}
              >
                {option === "android" ? "Android" : "iPhone"}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="share-actions">
          <button className="primary-action" type="button" onClick={copyDemoLink}>
            {copied ? "Link copied" : "Copy demo link"}
          </button>
          <button className="secondary-action" type="button" onClick={() => window.open(makeDemoUrl(), "_blank", "noopener,noreferrer")}>
            Open demo
          </button>
          <button className="download-button video-action" type="button" onClick={downloadVideo} disabled={videoState === "rendering"}>
            {videoState === "rendering" ? "Rendering video..." : videoState === "done" ? "Downloaded" : videoState === "failed" ? "Export failed" : "Download video"}
          </button>
        </div>
      </section>

        <section className="preview-panel" aria-label="WhatsApp demo preview">
          <div className="preview-label">
            <span>Live preview</span>
            <strong>{config.businessName.trim() || "Your Business"}</strong>
          </div>
          <div className="preview-glow" />
          <DemoPhone config={config} device={device} />
        </section>
      </main>
      {videoCaptureStage}
    </>
  );
}
