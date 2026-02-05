<template>
  <div class="panel">
    <div class="group">
      <div class="select-wrapper">
        <select
          :value="dataType"
          @change="(e) => $emit('update:dataType', (e.target as HTMLSelectElement).value as any)"
        >
          <option v-for="opt in options" :key="opt" :value="opt">{{ opt }}</option>
        </select>
        <svg
          class="select-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clip-rule="evenodd"
          />
        </svg>
      </div>

      <div class="search-wrapper">
        <svg class="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Filter objects..."
          :value="searchQuery"
          @input="onSearchInput"
        />
      </div>

      <label class="checkbox-wrapper" title="Hide items shorter than 10 days">
        <input
          type="checkbox"
          :checked="filterShortDuration"
          @change="(e) => $emit('update:filterShortDuration', (e.target as HTMLInputElement).checked)"
        />
        <span class="checkbox-label">Hide &lt; 30d</span>
      </label>
    </div>

    <div class="group">
      <div class="density-control">
        <span class="label">Density</span>
        <input
          type="range"
          min="10"
          max="60"
          step="5"
          :value="density"
          @input="(e) => $emit('update:density', parseInt((e.target as HTMLInputElement).value))"
          class="range-input"
        />
        <span class="value">{{ density }}</span>
      </div>

      <div class="divider"></div>

      <button class="btn-reset" @click="$emit('reset')" title="Reset View">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        Reset
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DataType } from '@/types'

defineProps<{
  dataType: DataType
  searchQuery: string
  density: number
  filterShortDuration: boolean
}>()

const emit = defineEmits<{
  (e: 'update:dataType', value: DataType): void
  (e: 'update:searchQuery', value: string): void
  (e: 'update:density', value: number): void
  (e: 'update:filterShortDuration', value: boolean): void
  (e: 'reset'): void
}>()

const options: DataType[] = ['aut-num', 'dns', 'mntner', 'registry', 'organisation']
let debounceTimer: number | null = null

const onSearchInput = (e: Event) => {
  const val = (e.target as HTMLInputElement).value
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = window.setTimeout(() => {
    emit('update:searchQuery', val)
  }, 300)
}
</script>

<style scoped>
.panel {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: space-between;
  align-items: center;
}

.group {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Custom Select */
.select-wrapper {
  position: relative;
}
select {
  appearance: none;
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 8px 32px 8px 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
  cursor: pointer;
  transition: all 0.2s;
  font-family: var(--font-mono);
}
select:hover {
  border-color: var(--border-hover);
  background: var(--bg-hover);
}
select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}
.select-icon {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: var(--text-muted);
  pointer-events: none;
}

/* Search Input */
.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.search-icon {
  position: absolute;
  left: 10px;
  width: 16px;
  height: 16px;
  color: var(--text-muted);
}
input[type='text'] {
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 8px 12px 8px 34px;
  font-size: 14px;
  outline: none;
  width: 200px;
  transition: all 0.2s;
}
input[type='text']:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

/* Checkbox Style */
.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
  background: white;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  transition: all 0.2s;
}
.checkbox-wrapper:hover {
  background: var(--bg-hover);
  border-color: var(--border-hover);
}
.checkbox-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-main);
}
input[type='checkbox'] {
  accent-color: var(--primary);
  width: 14px;
  height: 14px;
  cursor: pointer;
}

/* Slider */
.density-control {
  display: flex;
  align-items: center;
  gap: 10px;
  background: white;
  padding: 6px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}
.label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-muted);
}
.range-input {
  width: 100px;
  accent-color: var(--primary);
  cursor: pointer;
}
.value {
  font-size: 13px;
  font-family: var(--font-mono);
  color: var(--text-main);
  width: 24px;
  text-align: right;
}

.divider {
  width: 1px;
  height: 24px;
  background: var(--border);
}

/* Buttons */
.btn-reset {
  display: flex;
  align-items: center;
  gap: 6px;
  background: white;
  border: 1px solid var(--border);
  color: var(--text-main);
  padding: 8px 12px;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-reset:hover {
  background: var(--bg-hover);
  border-color: var(--border-hover);
}
.btn-reset:active {
  transform: translateY(1px);
}
</style>
