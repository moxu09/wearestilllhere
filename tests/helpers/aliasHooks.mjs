import { registerHooks } from "node:module";

// Resolve the app's "@/lib/*" alias (and extensionless "./x" imports inside lib/) for node:test,
// and swap Supabase for the in-memory fake. Import this before any lib module.
const libUrl = new URL("../../lib/", import.meta.url);
const fakeAdminUrl = new URL("./fakeSupabaseAdmin.mjs", import.meta.url).href;
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "@/lib/supabaseAdmin" || (specifier === "./supabaseAdmin" && context.parentURL?.startsWith(libUrl.href)))
      return { url: fakeAdminUrl, shortCircuit: true };
    if (specifier.startsWith("@/lib/")) return nextResolve(new URL(`${specifier.slice(6)}.ts`, libUrl).href, context);
    if (/^\.\/[A-Za-z]+$/.test(specifier) && context.parentURL?.startsWith(libUrl.href))
      return nextResolve(new URL(`${specifier}.ts`, context.parentURL).href, context);
    return nextResolve(specifier, context);
  },
});
