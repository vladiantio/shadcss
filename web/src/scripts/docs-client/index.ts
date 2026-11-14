import { controls } from "./controls";
import { mountDemo } from "./demo";
import { startPageLifecycle } from "./lifecycle";
import { navigation } from "./navigation";
import { applyPreferences } from "./preferences";
import { toc } from "./toc";

mountDemo();

startPageLifecycle({
  behaviors: [navigation, controls, toc],
  applyPreferences
});
