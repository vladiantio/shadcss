import { controls } from "./controls";
import { startPageLifecycle } from "./lifecycle";
import { navigation } from "./navigation";
import { applyPreferences } from "./preferences";

startPageLifecycle({
  behaviors: [navigation, controls],
  applyPreferences
});
