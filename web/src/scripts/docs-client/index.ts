import { controls } from "./controls";
import { startPageLifecycle } from "./lifecycle";
import { applyPreferences } from "./preferences";

startPageLifecycle({
  behaviors: [controls],
  applyPreferences
});
