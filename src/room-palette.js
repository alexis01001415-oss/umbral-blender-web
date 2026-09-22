/** Shared display names and sRGB colors for the interactive room's textile finishes. */
export const ROOM_FINISHES = Object.freeze({
  linen: Object.freeze({ name: "Lino", color: "#d6c7af" }),
  sand: Object.freeze({ name: "Arena", color: "#ac8b65" }),
  coffee: Object.freeze({ name: "Café", color: "#523822" }),
  espresso: Object.freeze({ name: "Espresso", color: "#261405" }),
  carbon: Object.freeze({
    name: "Carbón",
    color: "#22211f",
    authoredAlbedo: true,
  }),
  black: Object.freeze({ name: "Negro", color: "#0d0c0b" }),
  clay: Object.freeze({ name: "Arcilla", color: "#977357" }),
});

export const DEFAULT_ROOM_FINISH = "carbon";

export function getRoomFinish(name) {
  return ROOM_FINISHES[
    Object.hasOwn(ROOM_FINISHES, name) ? name : DEFAULT_ROOM_FINISH
  ];
}
