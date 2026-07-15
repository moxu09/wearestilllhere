import React from "react";
import { readFileSync } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CARD_SCALE = 2;
const CARD_WIDTH = 640 * CARD_SCALE;
const CARD_HEIGHT = 413 * CARD_SCALE;

type CardLayout = {
  asset: string;
  position: { top?: number; right?: number; bottom?: number; left?: number };
  align: "left" | "center" | "right";
  color: string;
  muted: string;
  shadow: string;
  maxWidth: number;
};

const CARD_LAYOUTS: Record<string, CardLayout> = {
  star_traveler: {
    asset: "star-traveler-hq.png",
    position: { right: 36, bottom: 29 },
    align: "right",
    color: "#f0e8df",
    muted: "#c8bfbd",
    shadow: "0 1px 5px rgba(3, 10, 24, 0.95)",
    maxWidth: 245,
  },
  silver_wing: {
    asset: "silver-wing-hq.png",
    position: { right: 34, bottom: 30 },
    align: "right",
    color: "#30343b",
    muted: "#484d55",
    shadow: "0 1px 2px rgba(255, 255, 255, 0.75)",
    maxWidth: 245,
  },
  gold_wing: {
    asset: "gold-wing-hq.png",
    position: { left: 38, top: 30 },
    align: "left",
    color: "#f1d49b",
    muted: "#c7a86f",
    shadow: "0 1px 5px rgba(16, 5, 7, 0.98)",
    maxWidth: 220,
  },
  radiant_star: {
    asset: "radiant-star-hq.png",
    position: { left: 34, bottom: 47 },
    align: "left",
    color: "#eee9e1",
    muted: "#aaa5a0",
    shadow: "0 1px 5px rgba(0, 0, 0, 0.98)",
    maxWidth: 175,
  },
  obsidian: {
    asset: "obsidian-hq.png",
    position: { left: 35, top: 82 },
    align: "left",
    color: "#d7c8b7",
    muted: "#a99582",
    shadow: "0 1px 5px rgba(0, 0, 0, 0.98)",
    maxWidth: 235,
  },
  exclusive_white: {
    asset: "exclusive-white-hq.png",
    position: { right: 34, bottom: 40 },
    align: "right",
    color: "#756e66",
    muted: "#918980",
    shadow: "0 1px 3px rgba(255, 255, 255, 0.95)",
    maxWidth: 245,
  },
  exclusive_black: {
    asset: "exclusive-black-hq.png",
    position: { left: 36, bottom: 37 },
    align: "left",
    color: "#d3bfa5",
    muted: "#9f8971",
    shadow: "0 1px 5px rgba(0, 0, 0, 0.98)",
    maxWidth: 245,
  },
};

const memberCardFont = readFileSync(
  path.join(process.cwd(), "public/fonts/NotoSansCJKtc-Regular.otf"),
);

function nameFontSize(name: string, maxWidth: number) {
  const units = [...name].reduce(
    (total, character) => total + (/^[\x00-\xff]$/.test(character) ? 0.62 : 1),
    0,
  );
  return Math.max(15, Math.min(23, Math.floor(maxWidth / Math.max(units, 1))));
}

function scaledPosition(position: CardLayout["position"]) {
  return Object.fromEntries(
    Object.entries(position).map(([key, value]) => [key, value * CARD_SCALE]),
  );
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ discordId: string }> },
) {
  const { discordId } = await context.params;
  if (!/^\d{15,22}$/.test(discordId)) {
    return new Response("Invalid member number", { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data: member, error } = await admin
    .from("alliance_members")
    .select(
      "discord_user_id, display_name, custom_display_name, tier_key, exclusive_card_variant",
    )
    .eq("discord_user_id", discordId)
    .maybeSingle();
  if (error || !member) return new Response("Member not found", { status: 404 });

  const layoutKey =
    member.tier_key === "exclusive"
      ? member.exclusive_card_variant === "black"
        ? "exclusive_black"
        : member.exclusive_card_variant === "white"
          ? "exclusive_white"
          : null
      : member.tier_key;
  const layout = layoutKey ? CARD_LAYOUTS[layoutKey] : null;
  if (!layout) return new Response("Membership card not selected", { status: 404 });

  const name = String(
    member.custom_display_name || member.display_name || "星夜會員",
  ).slice(0, 30);
  const fontSize = nameFontSize(name, layout.maxWidth);
  const fonts = [
    {
      name: "MemberCardFont",
      data: memberCardFont,
      weight: 600 as const,
      style: "normal" as const,
    },
  ];
  const fontFamily = "MemberCardFont";
  const assetPath = path.join(
    process.cwd(),
    "public/membership-cards",
    layout.asset,
  );
  const mimeType = layout.asset.endsWith(".png") ? "image/png" : "image/jpeg";
  const background = `data:${mimeType};base64,${readFileSync(assetPath).toString("base64")}`;

  const response = new ImageResponse(
    React.createElement(
      "div",
      {
        style: {
          position: "relative",
          display: "flex",
          width: `${CARD_WIDTH}px`,
          height: `${CARD_HEIGHT}px`,
          overflow: "hidden",
          fontFamily,
        },
      },
      React.createElement("img", {
        src: background,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        style: {
          position: "absolute",
          inset: 0,
          width: `${CARD_WIDTH}px`,
          height: `${CARD_HEIGHT}px`,
        },
      }),
      React.createElement(
        "div",
        {
          style: {
            position: "absolute",
            display: "flex",
            flexDirection: "column",
            alignItems:
              layout.align === "right"
                ? "flex-end"
                : layout.align === "center"
                  ? "center"
                  : "flex-start",
            width: `${layout.maxWidth * CARD_SCALE}px`,
            textAlign: layout.align,
            ...scaledPosition(layout.position),
          },
        },
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              color: layout.color,
              fontSize: `${fontSize * CARD_SCALE}px`,
              fontWeight: 650,
              lineHeight: 1.2,
              textShadow: layout.shadow,
              whiteSpace: "nowrap",
            },
          },
          name,
        ),
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              marginTop: `${5 * CARD_SCALE}px`,
              color: layout.muted,
              fontSize: `${11 * CARD_SCALE}px`,
              fontWeight: 500,
              letterSpacing: "0.08em",
              lineHeight: 1,
              textShadow: layout.shadow,
            },
          },
          `NO. ${discordId}`,
        ),
      ),
    ),
    { width: CARD_WIDTH, height: CARD_HEIGHT, fonts },
  );
  response.headers.set(
    "Cache-Control",
    "public, max-age=300, stale-while-revalidate=3600",
  );
  return response;
}
