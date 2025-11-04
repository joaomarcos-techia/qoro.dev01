
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
  type TooltipProps,
  XAxis,
  YAxis,
} from "recharts"
import type {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent"

import { cn } from "@/lib/utils"

// #region Chart Container
const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: any // Replace with a more specific type if you have one
    children: React.ComponentProps<typeof ResponsiveContainer>["children"]
  }
>(({ config, children, className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex aspect-video w-full items-center justify-center",
      className
    )}
    {...props}
  >
    <ChartStyle colors={Object.values(config).map((item: any) => item.color)} />
    <ResponsiveContainer>{children}</ResponsiveContainer>
  </div>
))
ChartContainer.displayName = "ChartContainer"
// #endregion

// #region Chart Tooltip
const ChartTooltip = RechartsTooltip

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  TooltipProps<ValueType, NameType>
>(({ active, payload, className, ...props }, ref) => {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  return (
    <div
      ref={ref}
      className={cn(
        "z-50 overflow-hidden rounded-lg border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-sm animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    >
      {/* You can optionally render payload data here if needed, or leave it empty */}
    </div>
  )
})
ChartTooltipContent.displayName = "ChartTooltipContent"
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
const BarChartLegend = RechartsTooltip
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
>(({ radius = 4, ...props }, ref) => {
  const forwardedRef = React.useRef<any>(null)
  
  React.useImperativeHandle(ref, () => forwardedRef.current)

  return (
    <Bar
      ref={forwardedRef}
      shape={
        <Rectangle radius={radius} />
      }
      {...props}
    />
  )
})
BarChartBar.displayName = "BarChartBar"

const BarChartLabel = Label
const BarChartLabelList = LabelList
// #endregion

// #region Line Chart
const LineChart = LineChartPrimitive

const LineChartLine = React.forwardRef<
  React.ComponentRef<typeof Line>,
  React.ComponentProps<typeof Line>
>((props, ref) => {
  const forwardedRef = React.useRef<any>(null)
  
  React.useImperativeHandle(ref, () => forwardedRef.current)

  return (
    <Line ref={forwardedRef} {...props} />
  )
})
LineChartLine.displayName = "LineChartLine"

const LineChartYAxis = YAxis
const LineChartXAxis = XAxis
const LineChartTooltip = ChartTooltip
const LineChartLegend = RechartsTooltip
const LineChartGrid = CartesianGrid
const LineChartContent = ChartContainer
const LineChartStyle = ChartStyle
const LineChartReferenceLine = ReferenceLine
const LineChartBrush = Bar
// #endregion

// #region Pie Chart
const PieChart = PieChartPrimitive
const PieChartTooltip = ChartTooltip
const PieChartLegend = RechartsTooltip
const PieChartContent = ChartContainer
const PieChartStyle = ChartStyle

const PieChartPie = React.forwardRef<
  React.ComponentRef<typeof Pie>,
  React.ComponentProps<typeof Pie>
>((props, ref) => {
  const forwardedRef = React.useRef<any>(null)
  
  React.useImperativeHandle(ref, () => forwardedRef.current)

  return (
    <Pie ref={forwardedRef} {...props} />
  )
})
PieChartPie.displayName = "PieChartPie"

const PieChartCell = React.forwardRef<
  React.ComponentRef<typeof Cell>,
  React.ComponentProps<typeof Cell>
>((props, ref) => {
  const forwardedRef = React.useRef<any>(null)
  
  React.useImperativeHandle(ref, () => forwardedRef.current)

  return (
    <Cell ref={forwardedRef} {...props} />
  )
})
PieChartCell.displayName = "PieChartCell"
// #endregion

// #region Radial Chart
const RadialChart = RadialBarChartPrimitive

const RadialChartBar = React.forwardRef<
  React.ComponentRef<typeof RadialBar>,
  React.ComponentProps<typeof RadialBar>
>((props, ref) => {
  const forwardedRef = React.useRef<any>(null)
  
  React.useImperativeHandle(ref, () => forwardedRef.current)

  return (
    <RadialBar ref={forwardedRef} {...props} />
  )
})
RadialChartBar.displayName = "RadialChartBar"

const RadialChartTooltip = ChartTooltip
const RadialChartLegend = RechartsTooltip
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
>((props, ref) => {
  const forwardedRef = React.useRef<any>(null)
  
  React.useImperativeHandle(ref, () => forwardedRef.current)

  return (
    <Scatter ref={forwardedRef} {...props} />
  )
})
ScatterChartScatter.displayName = "ScatterChartScatter"

const ScatterChartYAxis = YAxis
const ScatterChartXAxis = XAxis
const ScatterChartTooltip = ChartTooltip
const ScatterChartLegend = RechartsTooltip
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
