import type { ColorPalette } from '@/types'

export function generateColors(str: string): ColorPalette {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h = Math.abs(hash) % 360

  return {
    bg: `hsl(${h}, 70%, 93%)`,
    border: `hsl(${h}, 60%, 55%)`,
    text: '#1e293b',
  }
}
