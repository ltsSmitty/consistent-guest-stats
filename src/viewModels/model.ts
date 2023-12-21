import { WritableStore, store } from "openrct2-flexui";
import { setAllGuestStats } from "../setGuestStats";

export type GuestStat =
  | "happiness"
  | "energy"
  | "hunger"
  | "thirst"
  | "nausea"
  | "toilet";

export type StatParam = {
  value: number;
  enabled: boolean;
};

export enum UpdateFrequency {
  EveryTick,
  EveryOtherTick,
  EveryFiveTicks,
  Daily,
  Every2Days,
  Weekly,
  Monthly,
}

type StatValues = { [key in GuestStat]: WritableStore<StatParam> };

export class Model {
  updateFrequency = store<UpdateFrequency>(3);

  stats: StatValues = {
    happiness: store<StatParam>({ value: 12, enabled: false }),
    energy: store<StatParam>({ value: 12, enabled: false }),
    hunger: store<StatParam>({ value: 0, enabled: false }),
    thirst: store<StatParam>({ value: 0, enabled: false }),
    nausea: store<StatParam>({ value: 0, enabled: false }),
    toilet: store<StatParam>({ value: 0, enabled: false }),
  };

  updateValue(stat: GuestStat, value: number) {
    this.stats[stat].set({ ...this.stats[stat].get(), value });
  }

  updateEnabled(stat: GuestStat, enabled: boolean) {
    console.log("updateEnabled", stat, enabled);
    this.stats[stat].set({ ...this.stats[stat].get(), enabled });
    if (enabled) {
      setAllGuestStats(stat, this.stats[stat].get().value);
    }
  }

  updateFrequencyValue(value: UpdateFrequency) {
    this.updateFrequency.set(value);
  }
}
