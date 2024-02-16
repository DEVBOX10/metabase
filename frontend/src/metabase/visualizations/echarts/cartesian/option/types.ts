import type { RegisteredSeriesOption } from "echarts";

export interface Padding {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

export interface TicksDimensions {
  yTicksWidthLeft: number;
  yTicksWidthRight: number;
  xTicksHeight: number;
}

export interface ChartBoundsCoords {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

export interface ChartMeasurements {
  padding: Padding;
  ticksDimensions: TicksDimensions;
  bounds: ChartBoundsCoords;
}

export type EChartsSeriesOption =
  | RegisteredSeriesOption["line"]
  | RegisteredSeriesOption["bar"]
  | RegisteredSeriesOption["scatter"];
