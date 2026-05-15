import { GlobalSettings } from "../types";
import { DEFAULT_SETTINGS } from "../defaults";
import { supabaseAdmin } from "../supabase-admin";

const SETTINGS_ID = "singleton";
const SETTINGS_BUCKET = "app-settings";
const SETTINGS_PATH = "global/quote-settings.json";

async function ensureSettingsBucket() {
  await supabaseAdmin.storage.createBucket(SETTINGS_BUCKET, {
    public: false,
    fileSizeLimit: 1024 * 1024,
    allowedMimeTypes: ["application/json"],
  }).catch(() => {});
}

function mergeSettings(stored?: Partial<GlobalSettings> | null): GlobalSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...(stored ?? {}),
    delivery: {
      ...DEFAULT_SETTINGS.delivery,
      ...(stored?.delivery ?? {}),
    },
    tiers: stored?.tiers?.length ? stored.tiers : DEFAULT_SETTINGS.tiers,
    addons: stored?.addons?.length ? stored.addons : DEFAULT_SETTINGS.addons,
  };
}

export async function getSettings(): Promise<GlobalSettings> {
  await ensureSettingsBucket();

  const storedFile = await supabaseAdmin.storage
    .from(SETTINGS_BUCKET)
    .download(SETTINGS_PATH);

  if (storedFile.data && !storedFile.error) {
    try {
      const parsed = JSON.parse(await storedFile.data.text()) as Partial<GlobalSettings>;
      return mergeSettings(parsed);
    } catch {
      // Fall through to legacy table/defaults.
    }
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("quote_settings")
      .select("data")
      .eq("id", SETTINGS_ID)
      .single();

    if (error || !data) {
      return DEFAULT_SETTINGS;
    }

    const stored = data.data as Partial<GlobalSettings>;
    return mergeSettings(stored);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: GlobalSettings): Promise<void> {
  const next = mergeSettings(settings);

  await ensureSettingsBucket();
  const { error: storageError } = await supabaseAdmin.storage
    .from(SETTINGS_BUCKET)
    .upload(SETTINGS_PATH, JSON.stringify(next, null, 2), {
      contentType: "application/json",
      upsert: true,
    });

  if (storageError) {
    throw new Error(`Failed to save settings: ${storageError.message}`);
  }

  try {
    await supabaseAdmin
      .from("quote_settings")
      .upsert({ id: SETTINGS_ID, data: next, updated_at: new Date().toISOString() });
  } catch {
    // Older deployments may not have the legacy quote_settings table.
  }
}
