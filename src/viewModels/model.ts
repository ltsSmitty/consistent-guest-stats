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

export type GuestID = number;

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

  constructor() {
    this.initArrays();
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

  daySubcription = context.subscribe("interval.day", () => {
    if (date.day % 2 == 0) {
      this.initArrays();
    }

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

    if (this.updateFrequency.get() === UpdateFrequency.Daily) {
      this.updateGuestStats(this.guests);
    } else if (this.updateFrequency.get() === UpdateFrequency.Every2Days) {
      this.updateGuestStats(this.everyOtherGuests[date.day % 2]);
    } else if (this.updateFrequency.get() === UpdateFrequency.Weekly) {
      this.updateGuestStats(this.everySeventhGuests[date.day % 7]);
    } else if (this.updateFrequency.get() === UpdateFrequency.Monthly) {
      this.updateGuestStats(this.everyTwentyEighthGuests[date.day % 28]);
    }

    // update the last biggest guest id
    this.lastBiggestGuestId = this.guests[this.guests.length - 1] ?? 0;
  });

  tickSubcription = context.subscribe("interval.tick", () => {
    if (this.updateFrequency.get() === UpdateFrequency.EveryTick) {
      this.updateGuestStats(this.guests);
    } else if (this.updateFrequency.get() === UpdateFrequency.EveryOtherTick) {
      this.updateGuestStats(this.everyOtherGuests[this.tick % 2]);
    } else if (this.updateFrequency.get() === UpdateFrequency.EveryFiveTicks) {
      this.updateGuestStats(this.everyFifthGuests[this.tick % 5]);
    }
    this.tick++;
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
