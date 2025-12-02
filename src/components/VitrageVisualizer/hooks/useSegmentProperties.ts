import { useState } from 'react'
import type { SegmentProperties } from '../types/segment.types'
import { updateSegmentProperty } from '../utils/segmentPropertyHandling'

export function useSegmentProperties() {
  const [segmentProperties, setSegmentProperties] = useState<SegmentProperties>({})

  const updateProperty = (
    segmentId: number,
    property: 'type' | 'width' | 'height' | 'formula' | 'label',
    value: string,
    cols: number,
    rows: number
  ) => {
    setSegmentProperties(prev => {
      return updateSegmentProperty(segmentId, property, value, prev, cols, rows)
    })
  }

  const getProperty = (segmentId: number, property: keyof SegmentProperties[number]): string => {
    const segment = segmentProperties[segmentId]
    return (segment?.[property] as string) || ''
  }

  const setProperties = (properties: SegmentProperties) => {
    setSegmentProperties(properties)
  }

  const clearProperties = () => {
    setSegmentProperties({})
  }

  const hasProperties = (segmentId: number): boolean => {
    return segmentId in segmentProperties
  }

  const getSegmentType = (segmentId: number): string => {
    return segmentProperties[segmentId]?.type || 'Пустой'
  }

  const getSegmentLabel = (segmentId: number): string => {
    return segmentProperties[segmentId]?.label || ''
  }

  const getSegmentWidth = (segmentId: number): string => {
    return segmentProperties[segmentId]?.width || ''
  }

  const getSegmentHeight = (segmentId: number): string => {
    return segmentProperties[segmentId]?.height || ''
  }

  const getSegmentFormula = (segmentId: number): string => {
    return segmentProperties[segmentId]?.formula || ''
  }

  return {
    segmentProperties,
    setSegmentProperties: setProperties,
    updateProperty,
    getProperty,
    clearProperties,
    hasProperties,
    getSegmentType,
    getSegmentLabel,
    getSegmentWidth,
    getSegmentHeight,
    getSegmentFormula
  }
}
