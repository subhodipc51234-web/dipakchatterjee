#!/usr/bin/env node
// scripts/purge-content.mjs
//
// Deletes every row from the content tables (features, feature_media,
// posts, post_media) and empties both Storage buckets they reference.
// `profiles` and Supabase Auth users are never touched.
//
// Requires the service role key (bypasses RLS) from .env.local, so this
// only ever runs from a trusted machine, never from client code.
//
// Usage: node scripts/purge-content.mjs --confirm

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");

if (!process.argv.includes("--confirm")) {
  console.error(
    "This permanently deletes ALL features, posts, and their media/storage files.\n" +
      "profiles and Supabase Auth users are left untouched.\n\n" +
      "Re-run with --confirm to proceed: node scripts/purge-content.mjs --confirm"
  );
  process.exit(1);
}

const env = Object.fromEntries(
  fs
    .readFileSync(envPath, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function emptyBucket(bucket) {
  const { data: topLevel, error } = await supabase.storage.from(bucket).list("", { limit: 1000 });
  if (error) throw error;

  let removed = 0;
  for (const entry of topLevel ?? []) {
    // Uploaded files live under `<entity-id>/<file>`; Storage's list() is
    // not recursive, so descend into each entity's folder explicitly.
    const { data: children } = await supabase.storage.from(bucket).list(entry.name, { limit: 1000 });
    if (children && children.length > 0) {
      const paths = children.map((f) => `${entry.name}/${f.name}`);
      await supabase.storage.from(bucket).remove(paths);
      removed += paths.length;
    } else {
      // Not a folder — a stray top-level file.
      await supabase.storage.from(bucket).remove([entry.name]);
      removed += 1;
    }
  }
  return removed;
}

console.log("Purging content tables (profiles and Supabase Auth users are untouched)...\n");

const { error: fmErr, count: fmCount } = await supabase
  .from("feature_media")
  .delete({ count: "exact" })
  .not("id", "is", null);
if (fmErr) throw fmErr;
console.log(`  feature_media: deleted ${fmCount ?? 0} row(s)`);

const { error: fErr, count: fCount } = await supabase
  .from("features")
  .delete({ count: "exact" })
  .not("id", "is", null);
if (fErr) throw fErr;
console.log(`  features: deleted ${fCount ?? 0} row(s)`);

const { error: pmErr, count: pmCount } = await supabase
  .from("post_media")
  .delete({ count: "exact" })
  .not("id", "is", null);
if (pmErr) throw pmErr;
console.log(`  post_media: deleted ${pmCount ?? 0} row(s)`);

const { error: pErr, count: pCount } = await supabase
  .from("posts")
  .delete({ count: "exact" })
  .not("id", "is", null);
if (pErr) throw pErr;
console.log(`  posts: deleted ${pCount ?? 0} row(s)`);

const featureFiles = await emptyBucket("feature-media");
console.log(`  feature-media bucket: removed ${featureFiles} file(s)`);

const postFiles = await emptyBucket("post-media");
console.log(`  post-media bucket: removed ${postFiles} file(s)`);

console.log("\nDone. profiles and Supabase Auth users were not touched.");
