import { controls } from "./controls";
import { startPageLifecycle } from "./lifecycle";
import { navigation } from "./navigation";
import { applyPreferences } from "./preferences";
import { toc } from "./toc";

startPageLifecycle({
  behaviors: [navigation, controls, toc],
  applyPreferences
});
