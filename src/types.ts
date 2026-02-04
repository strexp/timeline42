export interface RawDataItem {
  id: string
  group: string
  content: string
  start: string
  end: string
  title: string
}

// [categoryIndex, startTimestamp, endTimestamp, label, bgColor, borderColor]
export type ChartDataTuple = [number, number, number, string, string, string]

export interface ColorPalette {
  bg: string
  border: string
  text: string
}

export interface DateRange {
  start: number
  end: number
}

export type DataType = 'aut-num' | 'dns' | 'mntner' | 'registry' | 'organisation'
