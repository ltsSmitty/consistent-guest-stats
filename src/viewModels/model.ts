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
    happiness: store<StatParam>({ value: 16, enabled: false }),
    energy: store<StatParam>({ value: 16, enabled: false }),
    hunger: store<StatParam>({ value: 16, enabled: false }),
    thirst: store<StatParam>({ value: 16, enabled: false }),
    nausea: store<StatParam>({ value: 0, enabled: false }),
    toilet: store<StatParam>({ value: 0, enabled: false }),
  };

  tick = 0;

  tickSubcription = context.subscribe("interval.tick", () => {
    if (this.updateFrequency.get() === UpdateFrequency.EveryTick) {
      Object.keys(this.stats).forEach((stat) => {
        const value = this.stats[stat as GuestStat].get().value;
        if (this.stats[stat as GuestStat].get().enabled) {
          setAllGuestStats(stat as GuestStat, value);
        }
      });
    } else if (this.updateFrequency.get() === UpdateFrequency.EveryOtherTick) {
      const guests = map.getAllEntities("guest").filter((guest) => {
        guest.id && guest.id % 2 === 0;
      });
      Object.keys(this.stats).forEach((stat) => {
        const value = this.stats[stat as GuestStat].get().value;
        if (this.stats[stat as GuestStat].get().enabled) {
          setAllGuestStats(stat as GuestStat, value, guests);
        }
      });
    } else if (this.updateFrequency.get() === UpdateFrequency.EveryFiveTicks) {
      const guests = map.getAllEntities("guest").filter((guest) => {
        guest.id && guest.id % 5 === 0;
      });
      Object.keys(this.stats).forEach((stat) => {
        const value = this.stats[stat as GuestStat].get().value;
        if (this.stats[stat as GuestStat].get().enabled) {
          setAllGuestStats(stat as GuestStat, value, guests);
        }
      });
    }
    this.tick++;
  });

  daySubcription = context.subscribe("interval.day", () => {
    if (this.updateFrequency.get() === UpdateFrequency.Daily) {
      Object.keys(this.stats).forEach((stat) => {
        const value = this.stats[stat as GuestStat].get().value;
        if (this.stats[stat as GuestStat].get().enabled) {
          setAllGuestStats(stat as GuestStat, value);
        }
      });
    } else if (this.updateFrequency.get() === UpdateFrequency.Every2Days) {
      const guests = map.getAllEntities("guest").filter((guest) => {
        guest.id && guest.id % 2 === 0;
      });
      Object.keys(this.stats).forEach((stat) => {
        const value = this.stats[stat as GuestStat].get().value;
        if (this.stats[stat as GuestStat].get().enabled) {
          setAllGuestStats(stat as GuestStat, value, guests);
        }
      });
    } else if (this.updateFrequency.get() === UpdateFrequency.Weekly) {
      const guests = map.getAllEntities("guest").filter((guest) => {
        guest.id && guest.id % 7 === 0;
      });
      Object.keys(this.stats).forEach((stat) => {
        const value = this.stats[stat as GuestStat].get().value;
        if (this.stats[stat as GuestStat].get().enabled) {
          setAllGuestStats(stat as GuestStat, value, guests);
        }
      });
    } else if (this.updateFrequency.get() === UpdateFrequency.Monthly) {
      const guests = map.getAllEntities("guest").filter((guest) => {
        guest.id && guest.id % 28 === 0;
      });
      Object.keys(this.stats).forEach((stat) => {
        const value = this.stats[stat as GuestStat].get().value;
        if (this.stats[stat as GuestStat].get().enabled) {
          setAllGuestStats(stat as GuestStat, value, guests);
        }
      });
    }
  });

  updateValue(stat: GuestStat, value: number) {
    this.stats[stat].set({ ...this.stats[stat].get(), value });
    if (this.stats[stat].get().enabled) {
      setAllGuestStats(stat, value);
    }
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
