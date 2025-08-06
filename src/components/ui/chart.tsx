
"use client"

import * as React from "react"
import {
  Bar,
  BarChart as BarChartPrimitive,
  CartesianGrid,
  Cell,
  Label,
  LabelList,
  Line,
  LineChart as LineChartPrimitive,
  Pie,
  PieChart as PieChartPrimitive,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart as RadialBarChartPrimitive,
  Rectangle,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart as ScatterChartPrimitive,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts"

import { cn } from "@/lib/utils"

// #region Chart Container
const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof ResponsiveContainer>
>(({ ...props }, ref) => (
  // @ts-expect-error - ref is not a valid prop
  <ResponsiveContainer ref={ref} {...props} />
))
ChartContainer.displayName = "ChartContainer"
// #endregion

// #region Chart Tooltip
const ChartTooltip = RechartsTooltip

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    hideLabel?: boolean
    hideIndicator?: boolean
  }
>(({
  className,
  style,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-50 overflow-hidden rounded-lg border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-sm animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      style={style}
    >
      {/* You can optionally render payload data here if needed, or leave it empty */}
    </div>
  )
})
ChartTooltipContent.displayName = "ChartTooltipContent"
// #endregion

// #region Chart Legend
const ChartLegend = RechartsTooltip

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsTooltip.Content>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center !bg-transparent p-0 text-sm [&>li]:pl-1",
      className
    )}
    {...props}
  />
))
ChartLegendContent.displayName = "ChartLegendContent"
// #endregion

// #region Chart Style
const ChartStyle = React.forwardRef<
  HTMLStyleElement,
  React.ComponentProps<"style"> & {
    colors: string[]
  }
>(({ colors, ...props }, ref) => (
  <style
    ref={ref}
    dangerouslySetInnerHTML={{
      __html: `
:root {
${colors
  .map(
    (color, i) => `  --color-chart-${i + 1}: ${color.replace(
      /^(hsl\()(\d+),(\d+)%,(\d+)%\)$/,
      "$2 $3% $4%"
    )};`
  )
  .join("\n")}
}
`,
    }}
    {...props}
  />
))
ChartStyle.displayName = "ChartStyle"
// #endregion

// #region Bar Chart
const BarChart = BarChartPrimitive
const BarChartYAxis = YAxis
const BarChartXAxis = XAxis
const BarChartTooltip = ChartTooltip
const BarChartLegend = ChartLegend
const BarChartGrid = CartesianGrid
const BarChartContent = ChartContainer
const BarChartStyle = ChartStyle
const BarChartReferenceLine = ReferenceLine
const BarChartBrush = Bar

const BarChartBar = React.forwardRef<
  React.ComponentRef<typeof Bar>,
  React.ComponentProps<typeof Bar> & {
    radius?: number | [number, number, number, number]
  }
>(({ radius = 4, ...props }, ref) => (
  // @ts-expect-error - ref is not a valid prop
  <Bar
    ref={ref}
    shape={
      // @ts-expect-error - radius is a valid prop
      <Rectangle radius={radius} />
    }
    {...props}
  />
))
BarChartBar.displayName = "BarChartBar"

const BarChartLabel = Label
const BarChartLabelList = LabelList
// #endregion

// #region Line Chart
const LineChart = LineChartPrimitive
const LineChartLine = React.forwardRef<
  React.ComponentRef<typeof Line>,
  React.ComponentProps<typeof Line>
>((props, ref) => (
  // @ts-expect-error - ref is not a valid prop
  <Line ref={ref} {...props} />
))
LineChartLine.displayName = "LineChartLine"

const LineChartYAxis = YAxis
const LineChartXAxis = XAxis
const LineChartTooltip = ChartTooltip
const LineChartLegend = ChartLegend
const LineChartGrid = CartesianGrid
const LineChartContent = ChartContainer
const LineChartStyle = ChartStyle
const LineChartReferenceLine = ReferenceLine
const LineChartBrush = Bar
// #endregion

// #region Pie Chart
const PieChart = PieChartPrimitive
const PieChartTooltip = ChartTooltip
const PieChartLegend = ChartLegend
const PieChartContent = ChartContainer
const PieChartStyle = ChartStyle

const PieChartPie = React.forwardRef<
  React.ComponentRef<typeof Pie>,
  React.ComponentProps<typeof Pie>
>((props, ref) => (
  // @ts-expect-error - ref is not a valid prop
  <Pie ref={ref} {...props} />
))
PieChartPie.displayName = "PieChartPie"

const PieChartCell = React.forwardRef<
  React.ComponentRef<typeof Cell>,
  React.ComponentProps<typeof Cell>
>((props, ref) => (
  // @ts-expect-error - ref is not a valid prop
  <Cell ref={ref} {...props} />
))
PieChartCell.displayName = "PieChartCell"
// #endregion

// #region Radial Chart
const RadialChart = RadialBarChartPrimitive
const RadialChartBar = React.forwardRef<
  React.ComponentRef<typeof RadialBar>,
  React.ComponentProps<typeof RadialBar>
>((props, ref) => (
  // @ts-expect-error - ref is not a valid prop
  <RadialBar ref={ref} {...props} />
))
RadialChartBar.displayName = "RadialChartBar"

const RadialChartTooltip = ChartTooltip
const RadialChartLegend = ChartLegend
const RadialChartContent = ChartContainer
const RadialChartStyle = ChartStyle
const RadialChartGrid = PolarGrid
const RadialChartAngleAxis = PolarAngleAxis
const RadialChartRadiusAxis = PolarRadiusAxis
// #endregion

// #region Scatter Chart
const ScatterChart = ScatterChartPrimitive
const ScatterChartScatter = React.forwardRef<
  React.ComponentRef<typeof Scatter>,
  React.ComponentProps<typeof Scatter>
>((props, ref) => (
  // @ts-expect-error - ref is not a valid prop
  <Scatter ref={ref} {...props} />
))
ScatterChartScatter.displayName = "ScatterChartScatter"

const ScatterChartYAxis = YAxis
const ScatterChartXAxis = XAxis
const ScatterChartTooltip = ChartTooltip
const ScatterChartLegend = ChartLegend
const ScatterChartGrid = CartesianGrid
const ScatterChartContent = ChartContainer
const ScatterChartStyle = ChartStyle
const ScatterChartReferenceLine = ReferenceLine
const ScatterChartBrush = Bar
// #endregion

export {
  // General
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  // Bar Chart
  BarChart,
  BarChartBar,
  BarChartYAxis,
  BarChartXAxis,
  BarChartTooltip,
  BarChartLegend,
  BarChartGrid,
  BarChartContent,
  BarChartStyle,
  BarChartReferenceLine,
  BarChartBrush,
  BarChartLabel,
  BarChartLabelList,
  // Line Chart
  LineChart,
  LineChartLine,
  LineChartYAxis,
  LineChartXAxis,
  LineChartTooltip,
  LineChartLegend,
  LineChartGrid,
  LineChartContent,
  LineChartStyle,
  LineChartReferenceLine,
  LineChartBrush,
  // Pie Chart
  PieChart,
  PieChartPie,
  PieChartCell,
  PieChartTooltip,
  PieChartLegend,
  PieChartContent,
  PieChartStyle,
  // Radial Chart
  RadialChart,
  RadialChartBar,
  RadialChartTooltip,
  RadialChartLegend,
  RadialChartContent,
  RadialChartStyle,
  RadialChartGrid,
  RadialChartAngleAxis,
  RadialChartRadiusAxis,
  // Scatter Chart
  ScatterChart,
  ScatterChartScatter,
  ScatterChartYAxis,
  ScatterChartXAxis,
  ScatterChartTooltip,
  ScatterChartLegend,
  ScatterChartGrid,
  ScatterChartContent,
  ScatterChartStyle,
  ScatterChartReferenceLine,
  ScatterChartBrush,
}
