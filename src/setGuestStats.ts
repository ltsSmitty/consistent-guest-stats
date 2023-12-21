import { GuestID, GuestStat } from "./viewModels/model";

function setGuestStats(guest: Guest, stat: GuestStat, value: number) {
  const v = value > 0 && value <= 16 ? value * 16 - 1 : 0;
  guest[stat] = v;
}

export function setAllGuestStats(
  stat: GuestStat,
  value: number,
  guests?: GuestID[]
) {
  const g: Guest[] = [];

  if (guests) {
    console.log(`Updating stats for ${guests.length} guests`);

    guests.forEach((guestId) => {
      const guest = map.getEntity(guestId) as Guest;
      if (!guest) {
        console.log(`Guest ${guestId} not found`);
      } else {
        g.push(guest);
      }
    });
  } else {
    g.push(...map.getAllEntities("guest"));
  }

  g.forEach((guest) => {
    if (!guest) {
      console.log(`Hmm, guest not found`);
    } else {
      setGuestStats(guest ?? 0, stat, value);
    }
  });
}
