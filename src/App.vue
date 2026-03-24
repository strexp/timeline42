<template>
  <header class="app-header">
    <div class="brand">
      <div class="meta">
        <h1>DN42 Registry Explorer</h1>
        <span class="badge" v-if="!isLoading">
          {{ filteredCategories.length }} / {{ allCategories.length }} Objects
        </span>
      </div>
    </div>

    <ControlPanel
      v-model:dataType="dataType"
      v-model:searchQuery="searchQuery"
      v-model:density="density"
      v-model:filterShortDuration="filterShortDuration"
      @reset="onReset"
    />
  </header>

  <main class="app-content">
    <RegistryChart
      :data="filteredData"
      :categories="filteredCategories"
      :is-loading="isLoading"
      :density="density"
      :reset-trigger="resetTrigger"
      :data-type="dataType"
      :online-isps="onlineIsps"
    />
  </main>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, shallowRef } from 'vue'
import ControlPanel from './components/ControlPanel.vue'
import RegistryChart from './components/RegistryChart.vue'
import { useRegistryData } from './composables/useRegistryData'
import type { DataType, ChartDataTuple } from '@/types'

// Constants
const SHORT_DURATION_MS = 30 * 24 * 60 * 60 * 1000 // 30 Days

// State
const dataType = ref<DataType>('aut-num')
const searchQuery = ref('')
const density = ref(30)
const resetTrigger = ref(0)
const filterShortDuration = ref(true)

const { loadData, isLoading, allItems, allCategories, onlineIsps } = useRegistryData()

// Filtered Data
const filteredData = shallowRef<ChartDataTuple[]>([])
const filteredCategories = shallowRef<string[]>([])

// Filtering Logic
const runFilter = () => {
  const query = searchQuery.value.trim().toLowerCase()
  const shouldFilterShort = filterShortDuration.value
  const items = allItems.value

  const categoriesWithLongItems = new Set<number>()

  if (shouldFilterShort) {
    const len = items.length
    for (let i = 0; i < len; i++) {
      const item = items[i]
      if (!item) continue
      // item[1] is start, item[2] is end
      if (item[2] - item[1] >= SHORT_DURATION_MS) {
        categoriesWithLongItems.add(item[0])
      }
    }
  }

  const matchedCategoryIndices = new Set<number>()
  const matchingCategories: string[] = []

  allCategories.value.forEach((cat, index) => {
    const matchesSearch = !query || cat.toLowerCase().includes(query)
    const matchesDuration = !shouldFilterShort || categoriesWithLongItems.has(index)

    if (matchesSearch && matchesDuration) {
      matchedCategoryIndices.add(index)
      matchingCategories.push(cat)
    }
  })

  filteredCategories.value = matchingCategories

  const indexMap = new Map<number, number>()
  let newIdx = 0
  allCategories.value.forEach((_, oldIdx) => {
    if (matchedCategoryIndices.has(oldIdx)) {
      indexMap.set(oldIdx, newIdx++)
    }
  })

  const result: ChartDataTuple[] = []
  const len = items.length

  for (let i = 0; i < len; i++) {
    const item = items[i]
    if (!item) continue
    const oldCatIdx = item[0]

    if (matchedCategoryIndices.has(oldCatIdx)) {
      const duration = item[2] - item[1]
      const isShort = duration < SHORT_DURATION_MS

      let bg = item[4]
      let border = item[5]

      if (shouldFilterShort && isShort) {
        bg = 'rgba(226, 232, 240, 0.4)' // very light grey
        border = '#cbd5e1' // muted border
      }

      result.push([indexMap.get(oldCatIdx)!, item[1], item[2], item[3], bg, border])
    }
  }

  filteredData.value = result
}

// Event Handlers
const onReset = () => {
  searchQuery.value = ''
  density.value = 30
  filterShortDuration.value = true
  resetTrigger.value++
}

// Watchers
watch(dataType, async (newType) => {
  await loadData(newType)
  runFilter()
})

// Watch all filter inputs
watch([searchQuery, filterShortDuration], runFilter)

// Init
onMounted(async () => {
  await loadData(dataType.value)
  runFilter()
})
</script>

<style scoped>
/* (Existing styles remain unchanged) */
.app-header {
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
  padding: 12px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex-shrink: 0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
  z-index: 20;
}

@media (min-width: 768px) {
  .app-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.meta h1 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
}

.badge {
  font-size: 11px;
  color: var(--text-muted);
  background: var(--bg-body);
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
  margin-top: 2px;
  display: inline-block;
}

.app-content {
  flex: 1;
  padding: 16px;
  overflow: hidden; /* Chart handles internal scroll */
  display: flex;
  flex-direction: column;
}
</style>
