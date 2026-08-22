"use client";

import { startTransition, useEffect, useState } from "react";

type Niche = "dental" | "aesthetic" | "clinic" | "spa" | "salon";
type Device = "android" | "iphone";

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

function isDevice(value: string | null): value is Device {
  return value === "android" || value === "iphone";
}

type VideoBubble = {
  direction: "incoming" | "outgoing";
  kind: "text" | "slots" | "confirmation";
  text?: string;
  revealAt: number;
};

const videoWidth = 720;
const videoHeight = 1280;
const videoDuration = 7200;

function roundedRectangle(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.roundRect(x, y, width, height, safeRadius);
}

function wrapCanvasText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width <= maxWidth || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }

  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function drawCanvasLines(
  context: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  y: number,
  lineHeight: number,
) {
  lines.forEach((line, index) => context.fillText(line, x, y + index * lineHeight));
}

function drawVideoBubble(
  context: CanvasRenderingContext2D,
  config: DemoConfig,
  bubble: VideoBubble,
  y: number,
  elapsed: number,
) {
  const maxTextWidth = 500;
  const lineHeight = 31;
  const businessName = config.businessName.trim() || "Your Business";
  context.font = "500 22px Arial, sans-serif";

  let lines: string[] = [];
  let detailLines: string[] = [];
  if (bubble.kind === "text") {
    lines = wrapCanvasText(context, bubble.text || "", maxTextWidth);
  } else if (bubble.kind === "slots") {
    lines = wrapCanvasText(context, config.botReply, maxTextWidth);
  } else {
    detailLines = [
      config.service,
      `${config.provider} - Tomorrow at ${config.slotTwo}`,
      businessName,
    ].flatMap((line) => wrapCanvasText(context, line, maxTextWidth));
  }

  const measuredLines = bubble.kind === "confirmation" ? detailLines : lines;
  const widestLine = Math.max(
    bubble.kind === "confirmation" ? context.measureText("Appointment confirmed").width : 0,
    ...measuredLines.map((line) => context.measureText(line).width),
    bubble.kind === "slots" ? context.measureText(config.slotOne).width : 0,
    bubble.kind === "slots" ? context.measureText(config.slotTwo).width : 0,
  );
  const width = Math.min(570, Math.max(178, widestLine + 42));
  let height = 48 + measuredLines.length * lineHeight;
  if (bubble.kind === "slots") height += 108;
  if (bubble.kind === "confirmation") height += 39;

  const x = bubble.direction === "outgoing" ? videoWidth - 28 - width : 28;
  const progress = Math.min(1, Math.max(0, (elapsed - bubble.revealAt) / 230));

  if (progress > 0) {
    context.save();
    context.globalAlpha = progress;
    context.translate(0, 14 * (1 - progress));
    context.fillStyle = bubble.direction === "outgoing" ? "#d9fdd3" : "#ffffff";
    context.shadowColor = "rgba(26, 45, 37, 0.12)";
    context.shadowBlur = 8;
    context.shadowOffsetY = 2;
    roundedRectangle(context, x, y, width, height, 15);
    context.fill();
    context.shadowColor = "transparent";

    let textY = y + 17;
    if (bubble.kind === "confirmation") {
      context.fillStyle = "#00725f";
      context.font = "700 22px Arial, sans-serif";
      context.fillText("Appointment confirmed", x + 20, textY);
      textY += 39;
      context.fillStyle = "#18211d";
      context.font = "500 22px Arial, sans-serif";
      drawCanvasLines(context, detailLines, x + 20, textY, lineHeight);
    } else {
      context.fillStyle = "#18211d";
      context.font = "500 22px Arial, sans-serif";
      drawCanvasLines(context, lines, x + 20, textY, lineHeight);
      textY += lines.length * lineHeight + 5;

      if (bubble.kind === "slots") {
        for (const slot of [config.slotOne, config.slotTwo]) {
          context.strokeStyle = "#e1e7e3";
          context.lineWidth = 2;
          context.beginPath();
          context.moveTo(x + 12, textY);
          context.lineTo(x + width - 12, textY);
          context.stroke();
          context.fillStyle = "#008069";
          context.font = "700 21px Arial, sans-serif";
          context.textAlign = "center";
          context.fillText(slot, x + width / 2, textY + 15);
          context.textAlign = "left";
          textY += 54;
        }
      }
    }

    context.fillStyle = "#6d7974";
    context.font = "400 15px Arial, sans-serif";
    context.textAlign = "right";
    context.fillText(bubble.direction === "outgoing" ? "11:19 am  ✓✓" : "11:19 am", x + width - 15, y + height - 23);
    context.textAlign = "left";
    context.restore();
  }

  return height;
}

function drawVideoFrame(context: CanvasRenderingContext2D, config: DemoConfig, device: Device, elapsed: number) {
  const businessName = config.businessName.trim() || "Your Business";
  const avatarLetter = businessName.charAt(0).toUpperCase() || config.avatar;
  context.clearRect(0, 0, videoWidth, videoHeight);
  context.fillStyle = "#f7f8f8";
  context.fillRect(0, 0, videoWidth, videoHeight);

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, videoWidth, 156);
  context.fillStyle = "#18211d";
  context.font = "600 23px Arial, sans-serif";
  context.fillText(device === "iphone" ? "9:41" : "11:18", 28, 19);
  if (device === "iphone") {
    context.fillStyle = "#111513";
    roundedRectangle(context, 294, 8, 132, 31, 16);
    context.fill();
    context.fillStyle = "#18211d";
  }
  context.textAlign = "right";
  context.fillText(`${device === "iphone" ? "5G" : "4G"}   WiFi   81%`, videoWidth - 28, 19);
  context.textAlign = "left";

  const safeBusinessName = businessName.length > 29 ? `${businessName.slice(0, 28)}…` : businessName;
  if (device === "iphone") {
    context.fillStyle = "#008069";
    context.font = "500 38px Arial, sans-serif";
    context.fillText("‹", 26, 78);
    context.font = "500 19px Arial, sans-serif";
    context.fillText("12", 55, 87);
    context.fillStyle = "#f4d3c7";
    context.beginPath();
    context.arc(270, 105, 29, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#86543f";
    context.font = "700 24px Arial, sans-serif";
    context.textAlign = "center";
    context.fillText(avatarLetter, 270, 97);
    context.textAlign = "left";
    context.fillStyle = "#111815";
    context.font = "700 24px Arial, sans-serif";
    context.fillText(safeBusinessName, 312, 78);
    context.fillStyle = "#62706a";
    context.font = "400 16px Arial, sans-serif";
    context.fillText("Business account", 312, 111);

    context.strokeStyle = "#008069";
    context.lineWidth = 4;
    roundedRectangle(context, 594, 76, 32, 24, 6);
    context.stroke();
    context.beginPath();
    context.moveTo(626, 83);
    context.lineTo(642, 76);
    context.lineTo(642, 100);
    context.lineTo(626, 93);
    context.stroke();
    context.beginPath();
    context.moveTo(663, 78);
    context.bezierCurveTo(663, 92, 674, 103, 688, 103);
    context.stroke();
  } else {
    context.font = "500 48px Arial, sans-serif";
    context.fillText("‹", 27, 74);
    context.fillStyle = "#d6e7ff";
    context.beginPath();
    context.arc(106, 105, 35, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#1769aa";
    context.font = "700 29px Arial, sans-serif";
    context.textAlign = "center";
    context.fillText(avatarLetter, 106, 89);
    context.textAlign = "left";
    context.fillStyle = "#111815";
    context.font = "700 27px Arial, sans-serif";
    context.fillText(safeBusinessName, 158, 77);
    context.fillStyle = "#62706a";
    context.font = "400 18px Arial, sans-serif";
    context.fillText("Business Account", 158, 113);
    context.fillStyle = "#1d2823";
    context.font = "500 31px Arial, sans-serif";
    context.fillText("▣     ☎     ⋮", 542, 86);
  }

  context.fillStyle = "#efeae2";
  context.fillRect(0, 156, videoWidth, 960);
  context.save();
  context.globalAlpha = 0.06;
  context.strokeStyle = "#688078";
  context.lineWidth = 2;
  for (let row = 0; row < 10; row += 1) {
    for (let column = 0; column < 7; column += 1) {
      const x = 48 + column * 108 + (row % 2) * 31;
      const y = 190 + row * 104;
      context.beginPath();
      context.arc(x, y, 13, 0, Math.PI * 1.6);
      context.stroke();
    }
  }
  context.restore();

  context.fillStyle = "rgba(255,255,255,.84)";
  roundedRectangle(context, 316, 174, 88, 38, 15);
  context.fill();
  context.fillStyle = "#65736d";
  context.font = "600 17px Arial, sans-serif";
  context.textAlign = "center";
  context.fillText("Today", 360, 184);
  context.textAlign = "left";

  const bubbles: VideoBubble[] = [
    { direction: "outgoing", kind: "text", text: config.customerQuestion, revealAt: 550 },
    { direction: "incoming", kind: "slots", revealAt: 1650 },
    { direction: "outgoing", kind: "text", text: config.slotTwo, revealAt: 2950 },
    { direction: "incoming", kind: "text", text: "Sure. What name should I book it under?", revealAt: 3850 },
    { direction: "outgoing", kind: "text", text: "Zain Javed", revealAt: 4750 },
    { direction: "incoming", kind: "confirmation", revealAt: 5850 },
  ];

  const visibleBubbles = bubbles.filter((bubble) => elapsed >= bubble.revealAt);
  const bubbleHeights = visibleBubbles.map((bubble) => drawVideoBubble(context, config, bubble, 0, -1000));
  const stackHeight = bubbleHeights.reduce((total, height) => total + height, 0) + Math.max(0, visibleBubbles.length - 1) * 14;
  let y = Math.max(226, 1098 - stackHeight);
  for (const [index, bubble] of visibleBubbles.entries()) {
    drawVideoBubble(context, config, bubble, y, elapsed);
    y += bubbleHeights[index] + 14;
  }

  context.fillStyle = device === "iphone" ? "#f8f8f8" : "#efeae2";
  context.fillRect(0, 1116, videoWidth, 112);
  if (device === "iphone") {
    context.strokeStyle = "#718079";
    context.lineWidth = 3;
    context.beginPath();
    context.arc(34, 1167, 21, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.moveTo(24, 1167);
    context.lineTo(44, 1167);
    context.moveTo(34, 1157);
    context.lineTo(34, 1177);
    context.stroke();

    context.fillStyle = "#ffffff";
    context.strokeStyle = "#cfd5d2";
    roundedRectangle(context, 70, 1135, 565, 64, 32);
    context.fill();
    context.stroke();
    context.fillStyle = "#89948f";
    context.font = "400 22px Arial, sans-serif";
    context.fillText("Message", 94, 1157);
    context.strokeStyle = "#718079";
    context.strokeRect(583, 1152, 28, 22);
    context.beginPath();
    context.arc(597, 1163, 6, 0, Math.PI * 2);
    context.stroke();

    context.fillStyle = "#718079";
    roundedRectangle(context, 672, 1148, 13, 23, 7);
    context.fill();
    context.strokeStyle = "#718079";
    context.beginPath();
    context.arc(678.5, 1161, 12, 0.15, Math.PI - 0.15);
    context.stroke();
    context.fillRect(677, 1173, 3, 8);
  } else {
    context.fillStyle = "#ffffff";
    roundedRectangle(context, 18, 1132, 620, 70, 35);
    context.fill();
    context.fillStyle = "#78857f";
    context.font = "400 22px Arial, sans-serif";
    context.fillText("☺   Message", 42, 1155);
    context.strokeStyle = "#78857f";
    context.lineWidth = 3;
    context.strokeRect(574, 1149, 30, 24);
    context.beginPath();
    context.arc(589, 1161, 7, 0, Math.PI * 2);
    context.stroke();
    context.fillStyle = "#111815";
    context.beginPath();
    context.arc(678, 1167, 35, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#ffffff";
    roundedRectangle(context, 671, 1148, 14, 24, 7);
    context.fill();
    context.strokeStyle = "#ffffff";
    context.lineWidth = 3;
    context.beginPath();
    context.arc(678, 1161, 13, 0.15, Math.PI - 0.15);
    context.stroke();
    context.fillRect(676.5, 1173, 3, 8);
  }

  context.fillStyle = "#f7f8f8";
  context.fillRect(0, 1228, videoWidth, 52);
  if (device === "iphone") {
    context.fillStyle = "#111513";
    roundedRectangle(context, 260, 1255, 200, 8, 4);
    context.fill();
  } else {
    context.fillStyle = "#737a77";
    context.font = "500 23px Arial, sans-serif";
    context.textAlign = "center";
    context.fillText("■          ○          ◀", 360, 1242);
  }
  context.textAlign = "left";
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
}: {
  config: DemoConfig;
  device: Device;
  animated?: boolean;
  replayKey?: number;
}) {
  const [step, setStep] = useState(animated ? 0 : 6);
  const businessName = config.businessName.trim() || "Your Business";
  const avatarLetter = businessName.charAt(0).toUpperCase() || config.avatar;

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
  const [videoState, setVideoState] = useState<"idle" | "rendering" | "done" | "failed">("idle");

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
    setDevice(isDevice(params.get("device")) ? params.get("device") as Device : "android");
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
        videoBitsPerSecond: 5_000_000,
      });
      const chunks: BlobPart[] = [];
      const recording = new Promise<Blob>((resolve, reject) => {
        recorder.ondataavailable = (event) => {
          if (event.data.size) chunks.push(event.data);
        };
        recorder.onerror = () => reject(new Error("The browser could not record the demo."));
        recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType || "video/webm" }));
      });

      drawVideoFrame(context, config, device, 0);
      recorder.start(200);
      const startedAt = performance.now();
      await new Promise<void>((resolve) => {
        function renderFrame(now: number) {
          const elapsed = Math.min(now - startedAt, videoDuration);
          drawVideoFrame(context!, config, device, elapsed);
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
    }
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
        <h1>Build their demo.</h1>
        <p className="lede">Choose the niche and add the prospect's business name.</p>

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
  );
}
