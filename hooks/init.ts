import type { PluginHookFn } from "@vellumai/plugin-api";
import { promises as fs } from "node:fs";
import * as path from "node:path";

const onInit: PluginHookFn = async (ctx) => {
  const storageDir =
    ctx.pluginStorageDir ??
    path.join("/workspace", "plugins-data", "inkwell");

  try {
    await fs.mkdir(storageDir, { recursive: true });
    const stateFile = path.join(storageDir, "inkwell-state.json");
    try {
      await fs.access(stateFile);
    } catch {
      await fs.writeFile(
        stateFile,
        JSON.stringify(defaultState(), null, 2),
        "utf8",
      );
      ctx.logger.info({ storageDir }, "inkwell: initialized new state file");
    }
  } catch (err) {
    ctx.logger.error(
      { err: err instanceof Error ? err.message : String(err) },
      "inkwell: init failed",
    );
  }
};

function defaultState() {
  return {
    config: {
      genres: [] as string[],
      dailyTarget: 500,
      sessionMinutes: 25,
    },
    drafts: [],
    sessions: [],
    streak: {
      current: 0,
      longest: 0,
      lastSessionDate: null as string | null,
    },
    lastPromptDate: null as string | null,
    lastPromptId: null as string | null,
  };
}

export default onInit;
