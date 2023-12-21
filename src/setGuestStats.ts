import { GuestStat } from "./viewModels/model";

function setGuestStats(guestId: number, stat: GuestStat, value: number) {
  const v = value > 0 && value <= 16 ? value * 16 - 1 : 0;

  const guest = map.getEntity(guestId) as Guest;
  guest[stat] = v;
}

export function setAllGuestStats(stat: GuestStat, value: number) {
  map.getAllEntities("guest").forEach((guest) => {
    setGuestStats(guest.id ?? 0, stat, value);
  });
}
