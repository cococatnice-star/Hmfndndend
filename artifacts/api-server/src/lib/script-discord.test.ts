import { after, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Collection, MessageFlags, PermissionFlagsBits, type Client, type Interaction } from "discord.js";
import { db, pool, namedScriptsTable, scriptRequestLimitsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { codeRedeemerPanel, handleScriptInteraction, registerScriptCommands } from "./script-discord";
import { findGuildScript, redeemScriptKey } from "./named-scripts";
import { removeScriptSource } from "./script-source-storage";
import { privateFingerprint } from "./script-key-crypto";

const guildId = `discord-fixture-${randomUUID()}`;
const adminId = "synthetic-admin";
const memberId = "synthetic-member";
const roleId = "123456789012345678";
let privilegedRole = false;
const roleGrants: string[] = [];
const fakeGuild = {
  id: guildId, ownerId: adminId,
  roles: { fetch: async () => ({
    id: roleId, managed: false, permissions: { bitfield: privilegedRole ? PermissionFlagsBits.Administrator : 0n },
  }) },
  members: {
    fetchMe: async () => ({ permissions: { has: () => true }, roles: { highest: { comparePositionTo: () => 1 } } }),
    fetch: async (id: string) => ({
      permissions: { has: () => id === adminId },
      roles: { highest: { comparePositionTo: () => 1 }, add: async () => { roleGrants.push(id); } },
    }),
  },
};
function fakeInteraction(overrides: Record<string, unknown> = {}, admin = true) {
  const state: { reply?: any; modal?: any; flags?: number; publicMessage?: any } = {};
  const base = {
    guild: fakeGuild, guildId, user: { id: admin ? adminId : memberId },
    memberPermissions: { has: () => admin },
    inGuild: () => true, isChatInputCommand: () => false, isAutocomplete: () => false,
    isButton: () => false, isModalSubmit: () => false, isRepliable: () => true,
    deferred: false, replied: false,
    showModal: async (value: any) => { state.modal = value.toJSON(); },
    deferReply: async (value: { flags: number }) => { state.flags = value.flags; base.deferred = true; },
    reply: async (value: any) => { state.reply = value; },
    editReply: async (value: any) => { state.reply = value; },
    channel: { isSendable: () => true, send: async (value: any) => { state.publicMessage = value; } },
    ...overrides,
  };
  return { interaction: base as unknown as Interaction, state };
}
let script: NonNullable<Awaited<ReturnType<typeof findGuildScript>>>;
let key: string;
after(async () => {
  const all = await db.select().from(namedScriptsTable).where(eq(namedScriptsTable.guildId, guildId));
  for (const item of all) await removeScriptSource(item.objectPath).catch(() => {});
  await db.delete(namedScriptsTable).where(eq(namedScriptsTable.guildId, guildId));
  await db.delete(scriptRequestLimitsTable).where(eq(scriptRequestLimitsTable.bucketHash, privateFingerprint("script-request", `discord:${guildId}:${memberId}`)));
  await pool.end();
});
test("setup is admin-only and the native modal asks for name, then Lua/TXT upload", async () => {
  const options = { getRole: () => null };
  const denied = fakeInteraction({ isChatInputCommand: () => true, commandName: "setup-script", options }, false);
  await handleScriptInteraction(denied.interaction);
  assert.equal(denied.state.reply.flags, MessageFlags.Ephemeral);
  assert.equal(denied.state.modal, undefined);
  const allowed = fakeInteraction({ isChatInputCommand: () => true, commandName: "setup-script", options });
  await handleScriptInteraction(allowed.interaction);
  assert.equal(allowed.state.modal.components[0].label, "Script name");
  assert.equal(allowed.state.modal.components[1].label, "Upload Lua code or upload TXT");
  assert.equal(allowed.state.modal.components[1].component.type, 19);
});
test("upload persists private Lua and returns 90 keys plus edited Worker only ephemerally", async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    if (String(input).startsWith("https://cdn.discordapp.com/")) return new Response("return 'synthetic script'");
    return realFetch(input, init);
  }) as typeof fetch;
  try {
    const upload = fakeInteraction({
      isModalSubmit: () => true, customId: "script:setup:0",
      fields: {
        getTextInputValue: () => "Setup Fixture",
        getUploadedFiles: () => new Collection([["file", {
          name: "script.lua", size: 25, url: "https://cdn.discordapp.com/attachments/synthetic/script.lua",
        }]]),
      },
    });
    await handleScriptInteraction(upload.interaction);
    assert.equal(upload.state.flags, MessageFlags.Ephemeral);
    assert.equal(upload.state.publicMessage, undefined);
    assert.equal(upload.state.reply.files.length, 2);
    const keyText = upload.state.reply.files[0].attachment.toString("utf8");
    const values = keyText.split("\n").filter((line: string) => line.startsWith("COCOX-"));
    assert.equal(values.length, 90);
    assert.equal(new Set(values).size, 90);
    key = values[0];
    assert.equal(upload.state.reply.files[1].name, "hhhh.js");
    script = (await findGuildScript(guildId, "Setup Fixture"))!;
    assert.ok(script);
    assert.equal(script.roleId, null);
  } finally { globalThis.fetch = realFetch; }
});
test("named panel has orange Code Redeemer title, five buttons, no Unlink Key, no public key file", async () => {
  const show = fakeInteraction({
    isChatInputCommand: () => true, commandName: "show",
    options: { getSubcommand: () => "panel", getString: () => "Setup Fixture", getRole: () => ({ id: roleId }) },
  });
  await handleScriptInteraction(show.interaction);
  assert.equal(show.state.flags, MessageFlags.Ephemeral);
  assert.ok(show.state.publicMessage);
  assert.equal(show.state.publicMessage.embeds[0].data.title, "Code Redeemer");
  assert.equal(show.state.publicMessage.embeds[0].data.color, 0xf97316);
  const labels = show.state.publicMessage.components.flatMap((row: any) => row.toJSON().components.map((item: any) => item.label));
  assert.deepEqual(labels, ["Redeem Key", "Get Script", "Get Role", "My Stats", "Reset HWID"]);
  assert.equal(show.state.publicMessage.files, undefined);
  assert.equal(JSON.stringify(show.state.publicMessage).includes(key), false);
  assert.equal(show.state.reply.files.length, 2);
  script = (await findGuildScript(guildId, "Setup Fixture"))!;
  assert.equal(script.roleId, roleId);
  assert.equal(codeRedeemerPanel({ ...script, roleId: null }).components[0].components[2].data.disabled, true);
});
test("member loaders/stats/roles require that member's redeemed key; privileged roles cannot be granted", async () => {
  const denied = fakeInteraction({ isButton: () => true, customId: `script:get:${script.id}` }, false);
  await handleScriptInteraction(denied.interaction);
  assert.equal(denied.state.reply.content.includes("Redeem a key"), true);
  await redeemScriptKey(script.id, key, memberId);
  const get = fakeInteraction({ isButton: () => true, customId: `script:get:${script.id}` }, false);
  await handleScriptInteraction(get.interaction);
  assert.equal(get.state.flags, MessageFlags.Ephemeral);
  assert.equal(get.state.reply.content.includes(`CocoX_Key = "${key}"`), true);
  assert.equal(get.state.reply.content.includes(`https://cocox.wtf/${script.slug}`), true);
  assert.equal(get.state.publicMessage, undefined);
  const role = fakeInteraction({ isButton: () => true, customId: `script:role:${script.id}` }, false);
  await handleScriptInteraction(role.interaction);
  assert.deepEqual(roleGrants, [memberId]);
  privilegedRole = true;
  const dangerous = fakeInteraction({ isButton: () => true, customId: `script:role:${script.id}` }, false);
  await handleScriptInteraction(dangerous.interaction);
  assert.equal(dangerous.state.reply.content.includes("Privileged roles cannot"), true);
  assert.equal(roleGrants.length, 1);
  privilegedRole = false;
  const stats = fakeInteraction({ isButton: () => true, customId: `script:stats:${script.id}` }, false);
  await handleScriptInteraction(stats.interaction);
  assert.equal(stats.state.reply.embeds[0].data.title, "My Stats");
  const foreign = fakeInteraction({ isButton: () => true, customId: `script:get:${script.id}`, guild: { ...fakeGuild, id: "foreign-guild" } }, false);
  await handleScriptInteraction(foreign.interaction);
  assert.equal(foreign.state.reply.content.includes("no longer available"), true);
});
test("command registration preserves unrelated commands and existing show subcommands", async () => {
  const created: any[] = [], patched: any[] = [];
  const commandRoute = {
    id: guildId,
    commands: {
      fetch: async () => new Collection([["show", { id: "show-id", name: "show" }]]),
      create: async (value: any) => { created.push(value); },
    },
  };
  await registerScriptCommands({
    user: { id: "bot-id" }, guilds: { cache: new Collection([[guildId, commandRoute]]) },
    rest: {
      get: async () => ({ options: [{ type: 1, name: "existing", description: "Existing subcommand" }] }),
      patch: async (_url: string, value: any) => { patched.push(value.body); },
    },
  } as unknown as Client<true>);
  assert.deepEqual(created.map(value => value.name), ["setup-script"]);
  assert.deepEqual(patched[0].options.map((value: any) => value.name), ["existing", "panel"]);
  assert.equal(patched[0].options[1].options[0].name, "script");
  assert.equal(patched[0].options[1].options[0].autocomplete, true);
});
