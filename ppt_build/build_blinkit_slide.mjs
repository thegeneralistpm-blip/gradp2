import fs from "node:fs/promises";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const OUT = "../blinkit-problem-framing.pptx";
const PREVIEW = "slide-1.png";

async function writeBlob(path, blob) {
  await fs.writeFile(path, new Uint8Array(await blob.arrayBuffer()));
}

function box(slide, { x, y, w, h, fill, stroke = "#d6d2d0", radius = "rounded-xl" }) {
  return slide.shapes.add({
    geometry: "roundRect",
    position: { left: x, top: y, width: w, height: h },
    fill,
    line: { style: "solid", fill: stroke, width: 1 },
    borderRadius: radius,
  });
}

function text(slide, { x, y, w, h, value, size = 16, color = "#1f2937", bold = false, align = "left", valign = "top" }) {
  const s = slide.shapes.add({
    geometry: "textbox",
    position: { left: x, top: y, width: w, height: h },
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  s.text = value;
  s.text.style = {
    fontSize: size,
    color,
    bold,
    alignment: align,
    verticalAlignment: valign,
    typeface: "Arial",
  };
  s.text.insets = { left: 0, right: 0, top: 0, bottom: 0 };
  return s;
}

function addCard(slide, { x, y, w, h, title, body, fill }) {
  box(slide, { x, y, w, h, fill, stroke: "#e6b8bf" });
  text(slide, { x: x + 18, y: y + 13, w: w - 36, h: 27, value: title, size: 18, color: "#c61f45", bold: true });
  text(slide, { x: x + 18, y: y + 47, w: w - 36, h: h - 58, value: body, size: 15, color: "#27272a" });
}

async function main() {
  const p = Presentation.create({ slideSize: { width: 1280, height: 720 } });
  const s = p.slides.add();
  s.background.fill = "#fffdfb";

  text(s, {
    x: 28, y: 16, w: 1060, h: 46,
    value: "The Reorder Loop Is Limiting Blinkit’s Cross-Category Growth",
    size: 30, color: "#171717", bold: true,
  });
  s.shapes.add({
    geometry: "rect",
    position: { left: 28, top: 65, width: 1224, height: 1 },
    fill: "#ecd5d7",
    line: { style: "solid", fill: "#ecd5d7", width: 0 },
  });
  text(s, { x: 1110, y: 12, w: 142, h: 45, value: "blinkit", size: 31, color: "#1f1f1b", bold: true, align: "right" });
  box(s, { x: 1210, y: 12, w: 40, h: 40, fill: "#f7d34b", stroke: "#f7d34b" });
  text(s, { x: 1210, y: 12, w: 40, h: 40, value: "•", size: 29, color: "#1f1f1b", bold: true, align: "center", valign: "middle" });

  const topY = 82, topH = 235, gap = 10, left = 28, cardW = 398;
  addCard(s, {
    x: left, y: topY, w: cardW, h: topH, fill: "#fbe8eb",
    title: "What Is the True Problem?",
    body: "Many customers open Blinkit with a known mission—often groceries, snacks or household essentials—and reorder from familiar categories.\n\nWhen a new category appears, confidence can drop because users cannot quickly judge quality, price, availability, substitutions or returns.\n\nThis creates a reorder loop that can suppress the north-star metric: monthly active customers buying at least one new category.",
  });
  addCard(s, {
    x: left + cardW + gap, y: topY, w: cardW, h: topH, fill: "#fbe8eb",
    title: "Who Faces the Problem?",
    body: "Routine replenishment users: customers with repeated monthly orders in one or two categories and little/no cross-category trial.\n\nThey value speed and predictability, but may experiment when the recommendation feels relevant, available and low-risk.\n\nPrimary research with 5–6 users should validate this segment and reveal differences by life stage, household needs and shopping mission.",
  });
  addCard(s, {
    x: left + (cardW + gap) * 2, y: topY, w: cardW, h: topH, fill: "#fbe8eb",
    title: "How Do We Know It’s Real?",
    body: "Directional evidence from 3,000 public App Store and Google Play reviews.\n\n555 records are currently flagged by the keyword screening layer for discovery/category-related signals; AI validation is pending. False-positive cleanup reduced discovery/navigation signals to 17.\n\nTrust, availability, product-quality and navigation concerns recur. Reviews are a starting point—not causal proof—so interviews are required.",
  });

  const botY = 329, botH = 257, botW = 398;
  addCard(s, {
    x: left, y: botY, w: botW, h: botH, fill: "#fff0e6",
    title: "Value to the Customer",
    body: "• Discover adjacent categories without browsing a huge catalogue.\n\n• Get the information needed to try: brand, rating, price, expiry/quality cues, availability and an easy recovery path.\n\n• Keep the speed and control that make quick commerce useful.",
  });
  addCard(s, {
    x: left + botW + gap, y: botY, w: botW, h: botH, fill: "#fff0e6",
    title: "Value to the Business",
    body: "• Increase the percentage of monthly active customers who buy a new category.\n\n• Turn routine replenishment journeys into relevant cross-category discovery.\n\n• Expand category penetration and basket breadth while protecting trust and repeat frequency.",
  });
  addCard(s, {
    x: left + (botW + gap) * 2, y: botY, w: botW, h: botH, fill: "#fff0e6",
    title: "Why Solve This Now?",
    body: "Quick commerce is already part of weekly routines, so growth can come from helping existing customers go deeper across categories.\n\nA weekly review pipeline can surface emerging friction and new themes; a controlled experiment can test whether confidence-led discovery changes trial.\n\nNext gate: validate the segment, triggers and barriers through 5–6 interviews before scaling.",
  });

  const navY = 603, navH = 49, navGap = 6, navX = 28, navW = 116;
  const nav = [
    "SLIDE 1\nREVIEW ANALYZER\nWORKFLOW", "SLIDE 2\nUSER SEGMENTATION", "SLIDE 3\nUSER RESEARCH",
    "SLIDE 4\nPROBLEM FRAMING", "SLIDE 5\nSOLUTIONS", "SLIDE 6\nPRIORITIZATION",
    "SLIDE 7\nUSER FLOW", "SLIDE 8\nWIREFRAMES", "SLIDE 9\nMETRICS", "SLIDE 10\nGTM STRATEGY + RISK",
  ];
  nav.forEach((label, i) => {
    const x = navX + i * (navW + navGap);
    box(s, { x, y: navY, w: navW, h: navH, fill: "#f6f3f1", stroke: i === 3 ? "#ff355d" : "#353535", radius: "rounded-lg" });
    text(s, { x: x + 6, y: navY + 7, w: navW - 12, h: navH - 12, value: label, size: 8, color: "#252525", bold: true, align: "center", valign: "middle" });
  });
  text(s, { x: 28, y: 684, w: 1224, h: 18, value: "Blinkit discovery engine • Evidence base: public review corpus + primary research validation pending", size: 10, color: "#6b7280", align: "right" });

  s.speakerNotes.textFrame.setText([
    "[Sources]",
    "- Internal public-review corpus and screening counts: C:/Users/DELL/Documents/GRAD P2/data/collection_report.json and data/screening_report.json (generated 2026-07-30).",
    "- Blinkit category and brand context: https://blinkit.com/",
    "- Review counts are directional evidence from public feedback; they do not establish causality. Segment and problem validation requires 5–6 primary interviews.",
  ]);
  s.speakerNotes.setVisible(true);

  await writeBlob(PREVIEW, await p.export({ slide: s, format: "png", scale: 1 }));
  const pptx = await PresentationFile.exportPptx(p);
  await pptx.save(OUT);
  console.log(`saved ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
