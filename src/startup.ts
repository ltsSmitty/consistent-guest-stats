import { mainWindow } from "./ui/window";
import { Model } from "./viewModels/model";

function onClickMenuItem() {
  // Write code here that should happen when the player clicks the menu item under the map icon.

  console.log("Hello world!");
}

function openWindow(model: Model) {
  if (context.apiVersion < 59) {
    // 59 => https://github.com/OpenRCT2/OpenRCT2/pull/17821
    const title = "Please update the game!";
    const message =
      "The version of OpenRCT2 you are currently playing is too old for this plugin.";

    ui.showError(title, message);
    console.log(`[Wet Paint] ${title} ${message}`);
    return;
  }

  mainWindow(model).open();
}

export function startup() {
  // Write code here that should happen on startup of the plugin.

  // Register a menu item under the map icon:
  if (typeof ui !== "undefined") {
    const model = new Model();
    ui.registerMenuItem("Consistent Guest Stats", () => openWindow(model));
  }
}
