import { store, type WritableStore } from "openrct2-flexui";
import {
	applyGuestStatUpdates,
	type GuestStatUpdate,
	setAllGuestStats,
} from "../setGuestStats";

const PLUGIN_NAMESPACE = "CONSISTENT_GUEST_STATS";

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
	EveryFortyTicks,
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

const GUEST_STATS: GuestStat[] = [
	"happiness",
	"energy",
	"hunger",
	"thirst",
	"nausea",
	"toilet",
];

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
		this.rebuildGuestListsFromMap();

		context.subscribe("guest.generation", (e) => {
			this.registerNewGuest(e.id);
		});

		// Remote plugins cannot use `map.changed` (intransient only). `map.change` runs before the new
		// map is in place, so resync on the following tick once loading has finished.
		context.subscribe("map.change", () => {
			this.needsGuestListResync = true;
		});
	}

	/** Set when the map is about to change; cleared after {@link rebuildGuestListsFromMap} on the next tick. */
	private needsGuestListResync = false;

	/** In-game year we last ran {@link compactGuestIndex}; refreshed on full map rebuild. */
	private lastGuestCompactYear = 0;

	tick = 0;

	guests: GuestID[] = [];
	everyOtherGuests: GuestID[][] = new Array(2);
	everyFifthGuests: GuestID[][] = new Array(5);
	everyFortiethGuests: GuestID[][] = new Array(40);
	everySeventhGuests: GuestID[][] = new Array(7);
	everyTwentyEighthGuests: GuestID[][] = new Array(28);

	initArrays = () => {
		for (let i = 0; i < 2; i++) {
			this.everyOtherGuests[i] = [];
		}
		for (let i = 0; i < 5; i++) {
			this.everyFifthGuests[i] = [];
		}
		for (let i = 0; i < 40; i++) {
			this.everyFortiethGuests[i] = [];
		}
		for (let i = 0; i < 7; i++) {
			this.everySeventhGuests[i] = [];
		}
		for (let i = 0; i < 28; i++) {
			this.everyTwentyEighthGuests[i] = [];
		}
	};

	private anyStatEnabled(): boolean {
		return GUEST_STATS.some((stat) => this.stats[stat].get().enabled);
	}

	/**
	 * Full resync from the map (startup, after load, or deferred from `map.change`).
	 * New guests should use the `guest.generation` hook via {@link registerNewGuest}.
	 */
	private rebuildGuestListsFromMap = () => {
		this.initArrays();
		this.guests = [];
		for (const guest of map.getAllEntities("guest")) {
			const id = guest.id ?? 0;
			if (!id) continue;
			this.guests.push(id);
			this.distributeGuestToBuckets(id);
		}
		this.needsGuestListResync = false;
		this.lastGuestCompactYear = date.year;
	};

	private distributeGuestToBuckets(id: GuestID): void {
		this.everyOtherGuests[id % 2].push(id);
		this.everyFifthGuests[id % 5].push(id);
		this.everyFortiethGuests[id % 40].push(id);
		this.everySeventhGuests[id % 7].push(id);
		this.everyTwentyEighthGuests[id % 28].push(id);
	}

	private registerNewGuest(id: GuestID): void {
		if (!id) return;
		this.guests.push(id);
		this.distributeGuestToBuckets(id);
	}

	/**
	 * There is no `guest.left` script hook in OpenRCT2 — only `guest.generation`.
	 * Called at most once per in-game year to drop departed guests and rebuild bucket lists.
	 */
	private compactGuestIndex(): void {
		const alive: GuestID[] = [];
		const seen: { [id: number]: true } = Object.create(null);
		let dropped = 0;
		for (let i = 0; i < this.guests.length; i++) {
			const id = this.guests[i];
			if (!id) {
				dropped++;
				continue;
			}
			if (seen[id]) {
				dropped++;
				continue;
			}
			const entity = map.getEntity(id);
			if (!entity || entity.type !== "guest") {
				dropped++;
				continue;
			}
			seen[id] = true;
			alive.push(id);
		}
		if (dropped === 0 && alive.length === this.guests.length) {
			return;
		}
		this.initArrays();
		this.guests = alive;
		for (let i = 0; i < alive.length; i++) {
			this.distributeGuestToBuckets(alive[i]);
		}
	}

	updateGuestStats = (guestIds: GuestID[]) => {
		if (!this.anyStatEnabled()) {
			return;
		}
		const updates: GuestStatUpdate[] = [];
		for (let s = 0; s < GUEST_STATS.length; s++) {
			const stat = GUEST_STATS[s];
			if (!this.stats[stat].get().enabled) continue;
			updates.push({ stat, value: this.stats[stat].get().value });
		}
		if (updates.length === 0) {
			return;
		}
		console.log(
			`Updating ${updates.length} stat(s) for ${guestIds.length} guest id(s) (one pass)`,
		);
		applyGuestStatUpdates(updates, guestIds);
	};

	daySubcription = context.subscribe("interval.day", () => {
		if (date.year !== this.lastGuestCompactYear) {
			this.compactGuestIndex();
			this.lastGuestCompactYear = date.year;
		}
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
		if (this.needsGuestListResync) {
			this.rebuildGuestListsFromMap();
		}
		if (this.updateFrequency.get() === UpdateFrequency.EveryTick) {
			this.updateGuestStats(this.guests);
		} else if (this.updateFrequency.get() === UpdateFrequency.EveryOtherTick) {
			const thisSlice = this.everyOtherGuests[this.tick % 2];
			console.log(`tick group ${this.tick % 2}, ${thisSlice.length}`);
			this.updateGuestStats(thisSlice);
		} else if (this.updateFrequency.get() === UpdateFrequency.EveryFiveTicks) {
			const thisSlice = this.everyFifthGuests[this.tick % 5];
			console.log(`tick group ${this.tick % 5}`);
			this.updateGuestStats(thisSlice);
		} else if (this.updateFrequency.get() === UpdateFrequency.EveryFortyTicks) {
			const thisSlice = this.everyFortiethGuests[this.tick % 40];
			console.log(`tick group ${this.tick % 40}`);
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
			const values = context
				.getParkStorage()
				.get<PluginValues>(`${PLUGIN_NAMESPACE}.values`);
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
