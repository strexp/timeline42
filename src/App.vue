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
    />
  </main>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, shallowRef } from 'vue'
import ControlPanel from './components/ControlPanel.vue'
import RegistryChart from './components/RegistryChart.vue'
import { useRegistryData } from './composables/useRegistryData'
import type { DataType, ChartDataTuple } from '@/types'

// State
const dataType = ref<DataType>('aut-num')
const searchQuery = ref('')
const density = ref(30)
const resetTrigger = ref(0)
const filterShortDuration = ref(true)

const { loadData, isLoading, allItems, allCategories } = useRegistryData()

// Filtered Data
const filteredData = shallowRef<ChartDataTuple[]>([])
const filteredCategories = shallowRef<string[]>([])

// Constants
const MIN_DURATION_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

// Filtering Logic
const runFilter = () => {
  const query = searchQuery.value.trim().toLowerCase()
  const shouldFilterDuration = filterShortDuration.value

  const rawItems = allItems.value
  const rawCategories = allCategories.value

  const validItems: ChartDataTuple[] = []
  const activeCategoryIndices = new Set<number>()

  for (let i = 0; i < rawItems.length; i++) {
    const item = rawItems[i]
    // Tuple: [catIdx, start, end, label, bg, border]
    const catIdx = item[0]
    const start = item[1]
    const end = item[2]
    const categoryName = rawCategories[catIdx]

    // Check Duration
    if (shouldFilterDuration) {
      if (end - start < MIN_DURATION_MS) {
        continue
      }
    }

    // Check Search Query (Filter by Category Name)
    if (query) {
      if (!categoryName.toLowerCase().includes(query)) {
        continue
      }
    }

    // Item passed all checks
    validItems.push(item)
    activeCategoryIndices.add(catIdx)
  }

  const newCategories: string[] = []
  const oldToNewIndexMap = new Map<number, number>()

  // Iterate original categories to maintain sort order
  rawCategories.forEach((cat, oldIdx) => {
    if (activeCategoryIndices.has(oldIdx)) {
      oldToNewIndexMap.set(oldIdx, newCategories.length)
      newCategories.push(cat)
    }
  })

  const result: ChartDataTuple[] = validItems.map(item => {
    const oldIdx = item[0]
    const newIdx = oldToNewIndexMap.get(oldIdx)!
    // Return new tuple with updated index
    return [newIdx, item[1], item[2], item[3], item[4], item[5]]
  })

  filteredCategories.value = newCategories
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

watch([searchQuery, filterShortDuration], runFilter)

// Init
onMounted(async () => {
  await loadData(dataType.value)
  runFilter()
})
</script>

<style scoped>
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
