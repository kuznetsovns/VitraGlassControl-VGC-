import { useState } from 'react'

export function useSegmentSelection() {
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null)
  const [selectedSegments, setSelectedSegments] = useState<Set<number>>(new Set())

  const selectSegment = (segmentId: number, isMultiSelect: boolean = false) => {
    if (isMultiSelect) {
      // Режим множественного выбора для объединения
      setSelectedSegments(prev => {
        const newSet = new Set(prev)
        if (newSet.has(segmentId)) {
          newSet.delete(segmentId)
        } else {
          newSet.add(segmentId)
        }
        return newSet
      })
      setSelectedSegment(null) // Отменяем выбор единичного сегмента
    } else {
      // Обычный режим редактирования
      setSelectedSegment(segmentId === selectedSegment ? null : segmentId)
      setSelectedSegments(new Set()) // Сбрасываем множественный выбор
    }
  }

  const clearSelection = () => {
    setSelectedSegment(null)
    setSelectedSegments(new Set())
  }

  const isSegmentSelected = (segmentId: number): boolean => {
    return selectedSegment === segmentId
  }

  const isSegmentMultiSelected = (segmentId: number): boolean => {
    return selectedSegments.has(segmentId)
  }

  const getSelectionCount = (): number => {
    return selectedSegments.size
  }

  return {
    selectedSegment,
    setSelectedSegment,
    selectedSegments,
    setSelectedSegments,
    selectSegment,
    clearSelection,
    isSegmentSelected,
    isSegmentMultiSelected,
    getSelectionCount
  }
}
