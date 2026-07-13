import { NextResponse } from "next/server";

export const runtime = "nodejs";

const GUILD_ID = "1501836172199202856";
const THANKS_ROLE_ID = "1505307437597724762";

type DiscordMember = {
  nick?: string | null;
  avatar?: string | null;
  roles?: string[];
  user: {
    id: string;
    username: string;
    global_name?: string | null;
    avatar?: string | null;
  };
};

function avatarUrl(member: DiscordMember) {
  if (member.avatar) {
    return `https://cdn.discordapp.com/guilds/${GUILD_ID}/users/${member.user.id}/avatars/${member.avatar}.png?size=128`;
  }
  if (member.user.avatar) {
    return `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png?size=128`;
  }
  const fallbackIndex = Number(
    (BigInt(member.user.id) >> BigInt(22)) % BigInt(6),
  );
  return `https://cdn.discordapp.com/embed/avatars/${fallbackIndex}.png`;
}

export async function GET() {
  const token =
    process.env.DISCORD_DEEPNIGHT_BOT_TOKEN ||
    process.env.DISCORD_BOT_TOKEN ||
    process.env.BOT_TOKEN;

  if (!token) {
    return NextResponse.json(
      { members: [], error: "感謝牆名單尚未連線" },
      { status: 503 },
    );
  }

  try {
    const members: DiscordMember[] = [];
    let after = "0";

    for (;;) {
      const response = await fetch(
        `https://discord.com/api/v10/guilds/${GUILD_ID}/members?limit=1000&after=${after}`,
        {
          headers: { Authorization: `Bot ${token}` },
          cache: "no-store",
        },
      );
      if (!response.ok) {
        throw new Error(`Discord API ${response.status}`);
      }
      const page = (await response.json()) as DiscordMember[];
      members.push(...page);
      if (page.length < 1000) break;
      after = page.at(-1)?.user.id || after;
    }

    const thankedMembers = members
      .filter((member) => member.roles?.includes(THANKS_ROLE_ID))
      .map((member) => ({
        id: member.user.id,
        name:
          member.nick ||
          member.user.global_name ||
          member.user.username ||
          "星夜夥伴",
        avatarUrl: avatarUrl(member),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "zh-Hant"));

    return NextResponse.json(
      { members: thankedMembers },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
        },
      },
    );
  } catch (error) {
    console.error("[感謝牆] Discord 名單讀取失敗", error);
    return NextResponse.json(
      { members: [], error: "感謝牆名單暫時無法載入" },
      { status: 502 },
    );
  }
}
