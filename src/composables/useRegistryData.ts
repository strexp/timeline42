import { ref, shallowRef } from 'vue'
import type { DataType, ChartDataTuple, RawDataItem } from '@/types'
import { generateColors } from '@/utils/colors'

export function useRegistryData() {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const allItems = shallowRef<ChartDataTuple[]>([])
  const allCategories = shallowRef<string[]>([])

  const loadData = async (type: DataType) => {
    isLoading.value = true
    error.value = null
    allItems.value = []

    try {
      const response = await fetch(`https://bgp-data.strexp.net/history/${type}.json`)
      if (!response.ok) throw new Error(`Failed to load ${type} data`)

      const rawJson: RawDataItem[] = await response.json()

      // Extract unique categories (groups)
      const groupSet = new Set<string>()
      rawJson.forEach((item) => groupSet.add(item.group))
      const sortedCategories = Array.from(groupSet).sort()

      const groupToIndex = new Map(sortedCategories.map((g, i) => [g, i]))

      const now = Date.now()

      // Transform to ECharts-optimized tuples
      const transformed: ChartDataTuple[] = rawJson.map((item) => {
        const startTs = new Date(item.start).getTime()
        const endTs = item.end ? new Date(item.end).getTime() : now
        const colors = generateColors(item.content)

        return [
          groupToIndex.get(item.group) ?? -1,
          startTs,
          endTs,
          item.content,
          colors.bg,
          colors.border,
        ]
      })

      allCategories.value = sortedCategories
      allItems.value = transformed
    } catch (err) {
      console.error(err)
      error.value = err instanceof Error ? err.message : 'Unknown error'
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading,
    error,
    allItems,
    allCategories,
    loadData,
  }
}
