import {
  WindowTemplate,
  box,
  groupbox,
  horizontal,
  window,
  label,
  toggle,
  compute,
} from "openrct2-flexui";
import { combinedLabelSpinner } from "./utilityControls";
import { GuestStat, Model } from "../viewModels/model";
import { capitalizeFirstLetter } from "../utils";

const title = "Consistent Guest Stats";
const LINE_HEIGHT = 20;
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
    width: 300,
    height: 200,
    content: [
      groupbox({
        text: "Maintain stats",
        content: [
          // horizontal({
          //   padding: { top: 10 },
          //   content: [
          //     label({ text: "Guest stat" }),
          //     label({ text: "Enabled", padding: { left: 50 } }),
          //   ],
          // }),
          horizontal({
            content: [
              combinedLabelSpinner(100, 100, {
                text: "Happiness",
                minimum: 0,
                maximum: 16,
                value: 16,
                wrapMode: "clamp",
              }),
              toggle({
                height: TOGGLE_SIZE,
                width: TOGGLE_SIZE,
              }),
            ],
          }),
          horizontal({
            content: [
              statLabelSpinner("energy", model),
              statToggle("energy", model),
            ],
          }),
        ],
        // horizontal({}),
      }),
    ],
  });
};

const statToggle = (stat: GuestStat, model: Model) => {
  return toggle({
    height: TOGGLE_SIZE,
    width: TOGGLE_SIZE,
    onChange: (value) => {
      model.updateEnabled(stat, value);
    },
  });
};

const statLabelSpinner = (stat: GuestStat, model: Model) => {
  return combinedLabelSpinner(100, 100, {
    text: capitalizeFirstLetter(stat),
    minimum: 0,
    maximum: 16,
    value: 16,
    wrapMode: "clamp",
    onChange: (value) => {
      model.updateValue(stat, value);
    },
  });
};

const frequencyLabelSpinner = (model: Model) => {
  return combinedLabelSpinner(100, 100, {
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
  });
};
