import {
  Scale,
  LabelParams,
  SpinnerParams,
  WidgetCreator,
  FlexiblePosition,
  horizontal,
  label,
  spinner,
} from "openrct2-flexui";

/**
 * A spinner with a label on the left side.
 */
export function combinedLabelSpinner(
  labelWidth: Scale,
  spinnerWidth: Scale,
  params: LabelParams & SpinnerParams,
  fallbackDisabledMessage: boolean = true
): WidgetCreator<FlexiblePosition> {
  (<FlexiblePosition>params).width = spinnerWidth;
  params.wrapMode ||= "clampThenWrap";
  if (fallbackDisabledMessage) {
    params.disabledMessage ||= "Not available";
  }

  return horizontal([
    label({
      width: labelWidth,
      disabled: params.disabled,
      text: params.text,
      tooltip: params.tooltip,
    }),
    spinner(params),
  ]);
}
