import { WritableStore, store } from "openrct2-flexui";
import { setAllGuestStats } from "../setGuestStats";

const PLUGIN_NAMESPACE = "CONSISTENT_GUEST_STATS";

export type GuestStat = "happiness" | "energy" | "hunger" | "thirst" | "nausea" | "toilet";

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

export type GuestID = number;

type PluginValues = {
  updateFrequency: UpdateFrequency;
  stats: {
    happiness: StatParam;
    energy: StatParam;
    hunger: StatParam;
    thirst: StatParam;
    nausea: StatParam;
    toilet: StatParam;
  };
};

const defaultValues: PluginValues = {
  updateFrequency: UpdateFrequency.Daily,
  stats: {
    happiness: { value: 16, enabled: false },
    energy: { value: 9, enabled: false },
    hunger: { value: 16, enabled: false },
    thirst: { value: 16, enabled: false },
    nausea: { value: 0, enabled: false },
    toilet: { value: 0, enabled: false },
  },
};

export class Model {
  updateFrequency = store<UpdateFrequency>(3);

  stats: StatValues = {
    happiness: store<StatParam>({ value: 16, enabled: false }),
    energy: store<StatParam>({ value: 9, enabled: false }),
    hunger: store<StatParam>({ value: 16, enabled: false }),
    thirst: store<StatParam>({ value: 16, enabled: false }),
    nausea: store<StatParam>({ value: 0, enabled: false }),
    toilet: store<StatParam>({ value: 0, enabled: false }),
  };

  constructor() {
    this.initArrays();
    this.loadValues();
  }

  tick = 0;

  guests: GuestID[] = [];
  everyOtherGuests: GuestID[][] = new Array(2);
  everyFifthGuests: GuestID[][] = new Array(5);
  everySeventhGuests: GuestID[][] = new Array(7);
  everyTwentyEighthGuests: GuestID[][] = new Array(28);

  initArrays = () => {
    for (let i = 0; i < 2; i++) {
      this.everyOtherGuests[i] = [];
    }
    for (let i = 0; i < 5; i++) {
      this.everyFifthGuests[i] = [];
    }
    for (let i = 0; i < 7; i++) {
      this.everySeventhGuests[i] = [];
    }
    for (let i = 0; i < 28; i++) {
      this.everyTwentyEighthGuests[i] = [];
    }
  };

  updateGuestStats = (guestIds: GuestID[]) => {
    Object.keys(this.stats).forEach((stat) => {
      const value = this.stats[stat as GuestStat].get().value;
      if (this.stats[stat as GuestStat].get().enabled) {
        setAllGuestStats(stat as GuestStat, value, guestIds);
      }
    });
  };

  lastBiggestGuestId = 0;

  dailyAddNewGuests = context.subscribe("interval.day", () => {
    // add any new guests to the arrays each day
    this.guests = map.getAllEntities("guest").map((guest) => {
      return guest.id ?? 0;
    });
    const lastGuest = map.getEntity(this.lastBiggestGuestId) as Guest; // start from the most recent guest from the last day

    const firstNewGuestIndex = this.guests.indexOf(lastGuest?.id ?? 0);
    const newGuests = this.guests.slice(firstNewGuestIndex + 1);

    // split any new guests into the proper arrays
    newGuests.forEach((id) => {
      if (!id) return;
      this.everyOtherGuests[id % 2].push(id);
      this.everyFifthGuests[id % 5].push(id);
      this.everySeventhGuests[id % 7].push(id);
      this.everyTwentyEighthGuests[id % 28].push(id);
    });

    // update the last biggest guest id
    this.lastBiggestGuestId = this.guests[this.guests.length - 1] ?? 0;
  });

  daySubcription = context.subscribe("interval.day", () => {
    if (this.updateFrequency.get() === UpdateFrequency.Daily) {
      this.updateGuestStats(this.guests);
    } else if (this.updateFrequency.get() === UpdateFrequency.Every2Days) {
      this.updateGuestStats(this.everyOtherGuests[date.day % 2]);
    } else if (this.updateFrequency.get() === UpdateFrequency.Weekly) {
      this.updateGuestStats(this.everySeventhGuests[date.day % 7]);
    } else if (this.updateFrequency.get() === UpdateFrequency.Monthly) {
      this.updateGuestStats(this.everyTwentyEighthGuests[date.day % 28]);
    }
  });

  tickSubcription = context.subscribe("interval.tick", () => {
    if (this.updateFrequency.get() === UpdateFrequency.EveryTick) {
      this.updateGuestStats(this.guests);
    } else if (this.updateFrequency.get() === UpdateFrequency.EveryOtherTick) {
      const thisSlice = this.everyOtherGuests[this.tick % 2];
      console.log(`tick group ${this.tick % 2}`);
      this.updateGuestStats(thisSlice);
    } else if (this.updateFrequency.get() === UpdateFrequency.EveryFiveTicks) {
      const thisSlice = this.everyFifthGuests[this.tick % 5];
      console.log(`tick group ${this.tick % 5}`);
      this.updateGuestStats(thisSlice);
    }
    this.tick++;
  });

  // only save if the api supports it
  saveSubcription =
    context.apiVersion >= 70
      ? context.subscribe("map.save", () => {
          this.saveValues();
        })
      : null;

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

  saveValues() {
    // for v0.3.5 or earlier,
    // make sure park storage is available
    if (!context.getParkStorage) {
      return;
    }
    const values: PluginValues = {
      updateFrequency: this.updateFrequency.get(),
      stats: {
        happiness: this.stats.happiness.get(),
        energy: this.stats.energy.get(),
        hunger: this.stats.hunger.get(),
        thirst: this.stats.thirst.get(),
        nausea: this.stats.nausea.get(),
        toilet: this.stats.toilet.get(),
      },
    };
    context.getParkStorage().set(`${PLUGIN_NAMESPACE}.values`, values);
  }

  loadValues() {
    // for v0.3.5 or earlier,
    // make sure park storage is available
    if (context.getParkStorage) {
      const values = context.getParkStorage().get<PluginValues>(`${PLUGIN_NAMESPACE}.values`);
      if (values) {
        this.updateFrequency.set(values.updateFrequency);
        this.stats.happiness.set(values.stats.happiness);
        this.stats.energy.set(values.stats.energy);
        this.stats.hunger.set(values.stats.hunger);
        this.stats.thirst.set(values.stats.thirst);
        this.stats.nausea.set(values.stats.nausea);
        this.stats.toilet.set(values.stats.toilet);
        return;
      }
    }
    this.updateFrequency.set(defaultValues.updateFrequency);
    this.stats.happiness.set(defaultValues.stats.happiness);
    this.stats.energy.set(defaultValues.stats.energy);
    this.stats.hunger.set(defaultValues.stats.hunger);
    this.stats.thirst.set(defaultValues.stats.thirst);
    this.stats.nausea.set(defaultValues.stats.nausea);
    this.stats.toilet.set(defaultValues.stats.toilet);
  }
}
