<template>
  <div class="chart-container">
    <div v-if="isLoading" class="overlay loading">
      <div class="spinner"></div>
      <span>Crunching data...</span>
    </div>

    <div v-else-if="!data.length" class="overlay empty">
      <p>No registry objects found matching your criteria.</p>
    </div>

    <VChart class="chart-instance" ref="chartRef" :option="option" autoresize />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, type Ref } from 'vue'
import { use } from 'echarts/core'
import { CustomChart } from 'echarts/charts'
import { TooltipComponent, GridComponent, DataZoomComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import * as echarts from 'echarts/core'
import VChart from 'vue-echarts'
import type { ChartDataTuple } from '@/types'
import type { EChartsCoreOption } from 'echarts'
import type {
  CustomSeriesRenderItemAPI,
  CustomSeriesRenderItemParams,
} from 'echarts/types/dist/shared'

use([CanvasRenderer, CustomChart, TooltipComponent, GridComponent, DataZoomComponent])

const props = defineProps<{
  data: ChartDataTuple[]
  categories: string[]
  isLoading: boolean
  density: number
  resetTrigger: number
}>()

const chartRef = ref<InstanceType<typeof VChart> | null>(null)

const renderGanttItem = (params: CustomSeriesRenderItemParams, api: CustomSeriesRenderItemAPI) => {
  if (!api.coord || !api.size || !api.value) return null

  const categoryIndex = api.value(0)
  const start = api.coord([api.value(1), categoryIndex])
  const end = api.coord([api.value(2), categoryIndex])

  // Calculate dimensions
  const width = Math.max(2, end[0] - start[0]) // Ensure minimal visibility
  const rowHeight = api.size([0, 1])[1]
  const barHeight = rowHeight * 0.7 // 70% of row height

  const x = start[0]
  const y = start[1] - barHeight / 2

  const label = api.value(3) as string
  const bg = api.value(4) as string
  const border = api.value(5) as string

  // Clip rendering to view port
  const rectShape = echarts.graphic.clipRectByRect(
    { x, y, width, height: barHeight },
    {
      x: params.coordSys.x,
      y: params.coordSys.y,
      width: params.coordSys.width,
      height: params.coordSys.height,
    },
  )

  if (!rectShape) return null

  // Only show text if width permits
  const showText = width > 30

  return {
    type: 'group',
    children: [
      // Main Bar
      {
        type: 'rect',
        ignore: !rectShape,
        shape: rectShape,
        style: {
          fill: bg,
          stroke: border,
          lineWidth: 1,
          rx: 4,
          ry: 4,
        },
        transition: ['shape', 'style'],
      },
      // Left Status Indicator
      {
        type: 'rect',
        ignore: !rectShape,
        shape: {
          x: rectShape.x,
          y: rectShape.y,
          width: Math.min(4, rectShape.width),
          height: rectShape.height,
        },
        style: {
          fill: border,
          rx: [4, 0, 0, 4], // TopLeft, TopRight, BottomRight, BottomLeft
        },
      },
      // Label
      {
        type: 'text',
        ignore: !showText,
        style: {
          text: label,
          x: rectShape.x + 8,
          y: rectShape.y + rectShape.height / 2,
          fill: '#334155',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          fontWeight: 600,
          verticalAlign: 'middle',
          align: 'left',
          width: rectShape.width - 10,
          overflow: 'truncate',
        },
      },
    ],
  }
}

const option = computed(() => {
  // Determine end index for Y-Axis zoom based on density
  const viewEnd = Math.min(props.categories.length, props.density)

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      enterable: true,
      confine: true,
      className: 'ec-tooltip',
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      borderColor: '#334155',
      padding: 12,
      textStyle: { color: '#f8fafc' },
      formatter: (params: Ref<ChartDataTuple>) => {
        const val = params.value as ChartDataTuple
        const name = props.categories[val[0]]
        const start = new Date(val[1]).toISOString().split('T')[0]
        const end = new Date(val[2]).toISOString().split('T')[0]
        const days = Math.floor((val[2] - val[1]) / 86400000)
        const color = val[5]

        return `
          <div class="ec-tooltip-container">
            <div class="ec-tooltip-header">
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color}"></span>
              <span>${name}</span>
            </div>
            <div style="margin-bottom:8px; color:#93c5fd; font-weight:600;">${val[3]}</div>
            <div class="ec-tooltip-row"><span>Start</span> <span class="ec-tooltip-val">${start}</span></div>
            <div class="ec-tooltip-row"><span>End</span> <span class="ec-tooltip-val">${end}</span></div>
            <div class="ec-tooltip-row" style="margin-top:4px; border-top:1px dashed #334155; padding-top:4px">
              <span>Duration</span> <span class="ec-tooltip-val">${days} days</span>
            </div>
          </div>
        `
      },
    },
    grid: {
      top: 40,
      bottom: 30,
      left: 120,
      right: 30,
      containLabel: false,
    },
    dataZoom: [
      {
        type: 'slider',
        xAxisIndex: 0,
        height: 24,
        bottom: 0,
        borderColor: 'transparent',
        backgroundColor: '#e2e8f0',
        fillerColor: 'rgba(37, 99, 235, 0.2)',
        handleStyle: { color: '#2563eb', shadowBlur: 0 },
        moveHandleStyle: { color: '#2563eb' },
        textStyle: { color: '#64748b' },
        brushSelect: false,
        filterMode: 'weakFilter',
      },
      {
        type: 'inside',
        xAxisIndex: 0,
        zoomOnMouseWheel: 'shift',
        moveOnMouseWheel: false,
        filterMode: 'weakFilter',
      },
      {
        type: 'slider',
        id: 'y-slider',
        yAxisIndex: 0,
        width: 16,
        right: 0,
        top: 40,
        bottom: 30,
        startValue: 0,
        endValue: viewEnd,
        zoomLock: true, // Lock the window size (density)
        showDetail: false,
        brushSelect: false,
        backgroundColor: '#f1f5f9',
        fillerColor: '#cbd5e1',
        handleSize: 0,
        borderColor: 'transparent',
        borderRadius: 8,
      },
      {
        type: 'inside',
        yAxisIndex: 0,
        zoomOnMouseWheel: false,
        moveOnMouseWheel: true,
        moveOnMouseMove: true,
      },
    ],
    xAxis: {
      type: 'time',
      position: 'top',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: {
        show: true,
        lineStyle: { color: '#e2e8f0', type: 'dashed' },
      },
      axisLabel: { color: '#64748b', fontSize: 11, margin: 12 },
    },
    yAxis: {
      type: 'category',
      data: props.categories,
      inverse: true,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: {
        show: true,
        lineStyle: { color: '#f1f5f9' },
      },
      axisLabel: {
        color: '#475569',
        width: 130,
        overflow: 'truncate',
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        align: 'right',
        padding: [0, 10, 0, 0],
      },
    },
    series: [
      {
        type: 'custom',
        renderItem: renderGanttItem,
        itemStyle: { opacity: 0.95 },
        encode: { x: [1, 2], y: 0 },
        data: props.data,
        animation: false,
        large: true, // Enable optimization for large data
        largeThreshold: 2000,
      },
    ],
  } as EChartsCoreOption
})

// Sync Density Slider with Chart DataZoom
watch(
  () => props.density,
  (newVal) => {
    if (chartRef.value) {
      chartRef.value.dispatchAction({
        type: 'dataZoom',
        batch: [
          {
            dataZoomIndex: 2, // y-slider index
            startValue: 0,
            endValue: newVal,
          },
        ],
      })
    }
  },
)

// Watch for reset trigger
watch(
  () => props.resetTrigger,
  () => {
    if (chartRef.value) {
      chartRef.value.dispatchAction({
        type: 'dataZoom',
        batch: [
          { yAxisIndex: 0, start: 0, end: 100 },
          { xAxisIndex: 0, start: 0, endValue: 25 },
        ],
      })
    }
  },
)
</script>

<style scoped>
.chart-container {
  flex: 1;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0; /* Critical for flex child scrolling */
}

.chart-instance {
  width: 100%;
  height: 100%;
}

.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(2px);
  color: var(--text-muted);
}

.loading {
  color: var(--primary);
  font-weight: 500;
  gap: 12px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty {
  font-size: 14px;
  color: var(--text-light);
}
</style>
