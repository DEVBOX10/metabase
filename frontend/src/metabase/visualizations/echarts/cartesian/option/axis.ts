import type { XAXisOption, YAXisOption } from "echarts/types/dist/shared";
import type { AxisBaseOptionCommon } from "echarts/types/src/coord/axisCommonTypes";

import { parseNumberValue } from "metabase/lib/number";
import { CHART_STYLE } from "metabase/visualizations/echarts/cartesian/constants/style";
import type {
  BaseCartesianChartModel,
  Extent,
  NumericAxisScaleTransforms,
  NumericXAxisModel,
  TimeSeriesXAxisModel,
  YAxisModel,
} from "metabase/visualizations/echarts/cartesian/model/types";
import type {
  ComputedVisualizationSettings,
  RenderingContext,
} from "metabase/visualizations/types";
import { isNumericBaseType } from "metabase-lib/v1/types/utils/isa";

import type { ChartMeasurements } from "../chart-measurements/types";
import { getScaledMinAndMax } from "../model/axis";
import { isNumericAxis, isTimeSeriesAxis } from "../model/guards";

import { getTicksOptions } from "./ticks";

const NORMALIZED_RANGE = { min: 0, max: 1 };

export const getAxisNameGap = (ticksWidth: number): number => {
  return ticksWidth + CHART_STYLE.axisNameMargin;
};

const getCustomAxisRange = (
  axisExtent: Extent,
  customMin: number | null,
  customMax: number | null,
  isNormalized: boolean | undefined,
) => {
  const [extentMin, extentMax] = axisExtent;

  // If this is a normalized range, respect custom min & max
  // This also accomodates non-normalized custom min & max values
  // Allows users to supply e.g. 10 for 10% min as opposed to 0.1
  if (isNormalized) {
    return {
      min: customMin != null ? customMin / 100 : undefined,
      max: customMax != null ? customMax / 100 : undefined,
    };
  }

  // if min/max are not specified or within series extents return `undefined`
  // so that ECharts compute a rounded range automatically
  const finalMin =
    customMin != null && customMin < extentMin ? customMin : undefined;
  const finalMax =
    customMax != null && customMax > extentMax ? customMax : undefined;

  return { min: finalMin, max: finalMax };
};

export const getYAxisRange = (
  axisModel: YAxisModel,
  yAxisScaleTransforms: NumericAxisScaleTransforms,
  settings: ComputedVisualizationSettings,
) => {
  const isAutoRangeEnabled = settings["graph.y_axis.auto_range"];
  if (isAutoRangeEnabled) {
    return axisModel.isNormalized ? NORMALIZED_RANGE : {};
  }

  const { customMin, customMax } = getScaledMinAndMax(
    settings,
    yAxisScaleTransforms,
  );

  return getCustomAxisRange(
    axisModel.extent,
    customMin,
    customMax,
    axisModel.isNormalized,
  );
};

export const getAxisNameDefaultOption = (
  { getColor, fontFamily, theme }: RenderingContext,
  nameGap: number,
  name: string | undefined,
  rotate?: number,
): Partial<AxisBaseOptionCommon> => ({
  name,
  nameGap,
  nameLocation: "middle",
  nameRotate: rotate,
  nameTextStyle: {
    color: getColor("text-dark"),
    fontSize: theme.cartesian.label.fontSize,
    fontWeight: CHART_STYLE.axisName.weight,
    fontFamily,
  },
});

export const getTicksDefaultOption = ({
  theme,
  getColor,
  fontFamily,
}: RenderingContext) => {
  return {
    hideOverlap: true,
    color: getColor("text-dark"),
    fontSize: theme.cartesian.label.fontSize,
    fontWeight: CHART_STYLE.axisTicks.weight,
    fontFamily,
  };
};

export const getDimensionTicksDefaultOption = (
  settings: ComputedVisualizationSettings,
  renderingContext: RenderingContext,
) => {
  return {
    ...getTicksDefaultOption(renderingContext),
    show: !!settings["graph.x_axis.axis_enabled"],
    rotate: getRotateAngle(settings),
  };
};

const getHistogramTicksOptions = (
  chartModel: BaseCartesianChartModel,
  settings: ComputedVisualizationSettings,
  chartMeasurements: ChartMeasurements,
  { theme }: RenderingContext,
) => {
  const { fontSize } = theme.cartesian.label;

  if (settings["graph.x_axis.scale"] !== "histogram") {
    return {};
  }

  const histogramDimensionWidth =
    chartMeasurements.boundaryWidth / chartModel.transformedDataset.length;
  const options = { showMinLabel: false, showMaxLabel: true };

  if (settings["graph.x_axis.axis_enabled"] === "rotate-45") {
    const topOffset = (histogramDimensionWidth + fontSize / 2) * Math.SQRT1_2;
    return {
      ...options,
      padding: [0, topOffset, 0, 0],
      margin: -histogramDimensionWidth / 2 + CHART_STYLE.axisTicksMarginX,
    };
  } else if (settings["graph.x_axis.axis_enabled"] === "rotate-90") {
    const rightOffset = histogramDimensionWidth / 2 - fontSize / 2;
    return {
      ...options,
      verticalAlign: "bottom",
      padding: [0, 0, rightOffset, 0],
    };
  } else {
    return { ...options, padding: [0, histogramDimensionWidth, 0, 0] };
  }
};

const getRotateAngle = (settings: ComputedVisualizationSettings) => {
  switch (settings["graph.x_axis.axis_enabled"]) {
    case "rotate-45":
      return 45;
    case "rotate-90":
      return 90;
    default:
      return undefined;
  }
};

const getCommonDimensionAxisOptions = (
  chartMeasurements: ChartMeasurements,
  settings: ComputedVisualizationSettings,
  renderingContext: RenderingContext,
) => {
  const nameGap = getAxisNameGap(
    chartMeasurements.ticksDimensions.xTicksHeight,
  );
  const { getColor } = renderingContext;
  return {
    ...getAxisNameDefaultOption(
      renderingContext,
      nameGap,
      settings["graph.x_axis.labels_enabled"]
        ? settings["graph.x_axis.title_text"]
        : undefined,
    ),
    mainType: "xAxis" as const,
    axisTick: {
      show: false,
    },
    splitLine: {
      show: false,
    },
    axisLine: {
      show: !!settings["graph.x_axis.axis_enabled"],
      lineStyle: {
        color: getColor("border"),
      },
    },
  };
};

export const buildDimensionAxis = (
  chartModel: BaseCartesianChartModel,
  width: number,
  settings: ComputedVisualizationSettings,
  chartMeasurements: ChartMeasurements,
  hasTimelineEvents: boolean,
  renderingContext: RenderingContext,
): XAXisOption => {
  const xAxisModel = chartModel.xAxisModel;

  if (isNumericAxis(xAxisModel)) {
    return buildNumericDimensionAxis(
      xAxisModel,
      settings,
      chartMeasurements,
      renderingContext,
    );
  }

  if (isTimeSeriesAxis(xAxisModel)) {
    return buildTimeSeriesDimensionAxis(
      xAxisModel,
      width,
      hasTimelineEvents,
      settings,
      chartMeasurements,
      renderingContext,
    );
  }

  return buildCategoricalDimensionAxis(
    chartModel,
    settings,
    chartMeasurements,
    renderingContext,
  );
};

export const buildNumericDimensionAxis = (
  xAxisModel: NumericXAxisModel,
  settings: ComputedVisualizationSettings,
  chartMeasurements: ChartMeasurements,
  renderingContext: RenderingContext,
): XAXisOption => {
  const {
    fromEChartsAxisValue,
    isPadded,
    extent,
    interval,
    ticksMaxInterval,
    formatter,
  } = xAxisModel;

  const [min, max] = extent;
  const axisPadding = interval / 2;

  return {
    ...getCommonDimensionAxisOptions(
      chartMeasurements,
      settings,
      renderingContext,
    ),
    type: "value",
    scale: true,
    axisLabel: {
      margin: CHART_STYLE.axisTicksMarginX,
      ...getDimensionTicksDefaultOption(settings, renderingContext),
      formatter: (rawValue: number) => {
        if (isPadded && (rawValue < min || rawValue > max)) {
          return "";
        }
        return ` ${formatter(fromEChartsAxisValue(rawValue))} `;
      },
    },
    ...(isPadded
      ? {
          min: () => min - axisPadding,
          max: () => max + axisPadding,
        }
      : {}),
    minInterval: interval,
    maxInterval: ticksMaxInterval,
  };
};

export const buildTimeSeriesDimensionAxis = (
  xAxisModel: TimeSeriesXAxisModel,
  width: number,
  hasTimelineEvents: boolean,
  settings: ComputedVisualizationSettings,
  chartMeasurements: ChartMeasurements,
  renderingContext: RenderingContext,
): XAXisOption => {
  const { formatter, maxInterval, minInterval, canRender, xDomainPadded } =
    getTicksOptions(xAxisModel, width);

  return {
    ...getCommonDimensionAxisOptions(
      chartMeasurements,
      settings,
      renderingContext,
    ),
    type: "time",
    axisLabel: {
      margin:
        CHART_STYLE.axisTicksMarginX +
        (hasTimelineEvents ? CHART_STYLE.timelineEvents.height : 0),
      ...getDimensionTicksDefaultOption(settings, renderingContext),
      formatter: (rawValue: number) => {
        const value = xAxisModel.fromEChartsAxisValue(rawValue);
        if (canRender(value)) {
          return ` ${formatter(value.format("YYYY-MM-DDTHH:mm:ss[Z]"))} `; // spaces force padding between ticks
        }
        return "";
      },
    },
    min: xDomainPadded[0],
    max: xDomainPadded[1],
    minInterval,
    maxInterval,
  };
};

export const buildCategoricalDimensionAxis = (
  chartModel: BaseCartesianChartModel,
  originalSettings: ComputedVisualizationSettings,
  chartMeasurements: ChartMeasurements,
  renderingContext: RenderingContext,
): XAXisOption => {
  const {
    xAxisModel: { formatter },
    dimensionModel: { column },
  } = chartModel;

  const autoAxisEnabled = chartMeasurements.axisEnabledSetting;
  const settings: ComputedVisualizationSettings = {
    ...originalSettings,
    "graph.x_axis.axis_enabled": autoAxisEnabled,
  };

  return {
    ...getCommonDimensionAxisOptions(
      chartMeasurements,
      settings,
      renderingContext,
    ),
    type: "category",
    axisLabel: {
      margin: CHART_STYLE.axisTicksMarginX,
      ...getDimensionTicksDefaultOption(settings, renderingContext),
      ...getHistogramTicksOptions(
        chartModel,
        settings,
        chartMeasurements,
        renderingContext,
      ),
      interval: () => true,
      formatter: (value: string) => {
        const numberValue = parseNumberValue(value);
        if (isNumericBaseType(column) && numberValue !== null) {
          return ` ${formatter(numberValue)} `;
        }

        return ` ${formatter(value)} `; // spaces force padding between ticks
      },
    },
  };
};

export const buildMetricAxis = (
  axisModel: YAxisModel,
  yAxisScaleTransforms: NumericAxisScaleTransforms,
  ticksWidth: number,
  settings: ComputedVisualizationSettings,
  position: "left" | "right",
  hasSplitLine: boolean,
  renderingContext: RenderingContext,
): YAXisOption => {
  const shouldFlipAxisName = position === "right";
  const nameGap = getAxisNameGap(ticksWidth);

  const range = getYAxisRange(axisModel, yAxisScaleTransforms, settings);

  return {
    show: true,
    scale: !!settings["graph.y_axis.unpin_from_zero"],
    type: "value",
    splitNumber: axisModel.splitNumber,
    ...range,
    ...getAxisNameDefaultOption(
      renderingContext,
      nameGap,
      axisModel.label,
      shouldFlipAxisName ? -90 : undefined,
    ),
    splitLine: settings["graph.y_axis.axis_enabled"]
      ? {
          lineStyle: {
            type: 5,
            opacity: hasSplitLine ? 1 : 0,
            ...renderingContext.theme.cartesian.splitLine.lineStyle,
          },
        }
      : undefined,
    position,
    axisLine: {
      show: false,
    },
    axisTick: {
      show: false,
    },
    axisLabel: {
      margin: CHART_STYLE.axisTicksMarginY,
      show: !!settings["graph.y_axis.axis_enabled"],
      ...getTicksDefaultOption(renderingContext),
      // @ts-expect-error TODO: figure out EChart types
      formatter: (rawValue) =>
        axisModel.formatter(
          yAxisScaleTransforms.fromEChartsAxisValue(rawValue),
        ),
    },
  };
};

const buildMetricsAxes = (
  chartModel: BaseCartesianChartModel,
  chartMeasurements: ChartMeasurements,
  settings: ComputedVisualizationSettings,
  renderingContext: RenderingContext,
): YAXisOption[] => {
  const axes: YAXisOption[] = [];
  const { leftAxisModel, rightAxisModel } = chartModel;

  if (leftAxisModel != null) {
    axes.push(
      buildMetricAxis(
        leftAxisModel,
        chartModel.yAxisScaleTransforms,
        chartMeasurements.ticksDimensions.yTicksWidthLeft,
        settings,
        "left",
        true,
        renderingContext,
      ),
    );
  }

  if (rightAxisModel != null) {
    const isOnlyAxis = chartModel.leftAxisModel == null;
    axes.push(
      buildMetricAxis(
        rightAxisModel,
        chartModel.yAxisScaleTransforms,
        chartMeasurements.ticksDimensions.yTicksWidthRight,
        settings,
        "right",
        isOnlyAxis,
        renderingContext,
      ),
    );
  }

  return axes;
};

export const buildAxes = (
  chartModel: BaseCartesianChartModel,
  width: number,
  chartMeasurements: ChartMeasurements,
  settings: ComputedVisualizationSettings,
  hasTimelineEvents: boolean,
  renderingContext: RenderingContext,
) => {
  return {
    xAxis: buildDimensionAxis(
      chartModel,
      width,
      settings,
      chartMeasurements,
      hasTimelineEvents,
      renderingContext,
    ),
    yAxis: buildMetricsAxes(
      chartModel,
      chartMeasurements,
      settings,
      renderingContext,
    ),
  };
};

export const createAxisVisibilityOption = ({
  show,
  splitLineVisible,
}: {
  show: boolean;
  splitLineVisible: boolean;
}) => ({
  show,
  splitLine: { lineStyle: { opacity: splitLineVisible ? 1 : 0 } },
});
