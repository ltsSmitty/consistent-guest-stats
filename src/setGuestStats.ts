import type { GuestID, GuestStat } from "./viewModels/model";

function setGuestStats(guest: Guest, stat: GuestStat, value: number) {
	const v = value > 0 && value <= 16 ? value * 16 - 1 : 0;
	guest[stat] = v;
}

export type GuestStatUpdate = { stat: GuestStat; value: number };

/**
 * Apply several stat changes with one {@link map.getEntity} (or one guest list walk) per guest.
 */
export function applyGuestStatUpdates(
	updates: GuestStatUpdate[],
	guestIds?: GuestID[],
): void {
	if (updates.length === 0) {
		return;
	}
	if (guestIds) {
		for (let i = 0; i < guestIds.length; i++) {
			const guest = map.getEntity(guestIds[i]) as Guest;
			if (!guest) continue;
			for (let u = 0; u < updates.length; u++) {
				setGuestStats(guest, updates[u].stat, updates[u].value);
			}
		}
		return;
	}
	const all = map.getAllEntities("guest");
	for (let i = 0; i < all.length; i++) {
		const guest = all[i];
		for (let u = 0; u < updates.length; u++) {
			setGuestStats(guest, updates[u].stat, updates[u].value);
		}
	}
}

export function setAllGuestStats(
	stat: GuestStat,
	value: number,
	guests?: GuestID[],
) {
	applyGuestStatUpdates([{ stat, value }], guests);
}
