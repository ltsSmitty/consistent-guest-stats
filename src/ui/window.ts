import {
  WindowTemplate,
  groupbox,
  horizontal,
  window,
  toggle,
  compute,
  label,
} from "openrct2-flexui";
import { combinedLabelSpinner } from "./utilityControls";
import { GuestStat, Model } from "../viewModels/model";
import { capitalizeFirstLetter } from "../utils";

const title = "Consistent Guest Stats";
const TOGGLE_SIZE = 14;

const UpdateFrequencyKeys: string[] = [
  "Every tick",
  "Every other tick",
  "Every five ticks",
  "Daily",
  "Every 2 days",
  "Weekly",
  "Monthly",
];

export const mainWindow = (model: Model): WindowTemplate => {
  return window({
    title,
    width: 185,
    height: 210,
    content: [
      groupbox({
        text: "Maintain stats",

        content: [
          horizontal({
            content: [
              statLabelSpinner("happiness", model),
              statToggle("happiness", model),
            ],
          }),
          horizontal({
            content: [
              statLabelSpinner("energy", model),
              statToggle("energy", model),
            ],
          }),
          horizontal({
            content: [
              statLabelSpinner("hunger", model),
              statToggle("hunger", model),
            ],
          }),
          horizontal({
            content: [
              statLabelSpinner("thirst", model),
              statToggle("thirst", model),
            ],
          }),
          horizontal({
            content: [
              statLabelSpinner("nausea", model),
              statToggle("nausea", model),
            ],
          }),
          horizontal({
            content: [
              statLabelSpinner("toilet", model),
              statToggle("toilet", model),
            ],
          }),
        ],
      }),
      groupbox({
        text: "Stat reset frequency",
        content: [
          horizontal({
            content: [frequencyLabelSpinner(model)],
          }),
        ],
      }),
      label({
        text: " plugin by ltsSmitty",
        alignment: "centred",
        disabled: true,
      }),
    ],
  });
};

const statToggle = (stat: GuestStat, model: Model) => {
  return toggle({
    height: TOGGLE_SIZE,
    width: TOGGLE_SIZE,
    isPressed: compute(model.stats[stat], (stat) => stat.enabled),
    onChange: (value) => {
      model.updateEnabled(stat, value);
    },
  });
};

const statLabelSpinner = (stat: GuestStat, model: Model) => {
  return combinedLabelSpinner(80, 60, {
    text: capitalizeFirstLetter(stat),
    minimum: 0,
    maximum: 16,
    value: compute(model.stats[stat], (stat) => stat.value),
    wrapMode: "clamp",
    onChange: (value) => {
      model.updateValue(stat, value);
    },
  });
};

const frequencyLabelSpinner = (model: Model) => {
  return combinedLabelSpinner(100, 59, {
    text: compute(
      model.updateFrequency,
      (stat) => UpdateFrequencyKeys[stat ?? 3]
    ),
    minimum: 0,
    maximum: UpdateFrequencyKeys.length - 1,
    value: 3,
    wrapMode: "clamp",
    onChange: (value) => {
      model.updateFrequencyValue(value);
    },
    // disabled: true,
  });
};
