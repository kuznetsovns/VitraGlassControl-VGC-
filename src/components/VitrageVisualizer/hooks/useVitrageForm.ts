import { useState, useRef } from 'react'
import type { CreatedVitrage } from '../types/object.types'

export function useVitrageForm() {
  const [vitrageName, setVitrageName] = useState('')
  const [siteManager, setSiteManager] = useState('')
  const [creationDate, setCreationDate] = useState('')
  const [horizontalSegments, setHorizontalSegments] = useState('')
  const [verticalSegments, setVerticalSegments] = useState('')
  const [createdVitrage, setCreatedVitrage] = useState<CreatedVitrage | null>(null)

  const vitrageNameRef = useRef<HTMLInputElement>(null)
  const siteManagerRef = useRef<HTMLInputElement>(null)
  const creationDateRef = useRef<HTMLInputElement>(null)
  const horizontalRef = useRef<HTMLInputElement>(null)
  const verticalRef = useRef<HTMLInputElement>(null)
  const createBtnRef = useRef<HTMLButtonElement>(null)

  const resetForm = () => {
    setVitrageName('')
    setHorizontalSegments('')
    setVerticalSegments('')
    setCreatedVitrage(null)
    setSiteManager('')
    setCreationDate('')
  }

  const focusVitrageNameField = () => {
    vitrageNameRef.current?.focus()
  }

  const focusSiteManagerField = () => {
    siteManagerRef.current?.focus()
  }

  const focusCreationDateField = () => {
    creationDateRef.current?.focus()
  }

  const focusHorizontalField = () => {
    horizontalRef.current?.focus()
  }

  const focusVerticalField = () => {
    verticalRef.current?.focus()
  }

  const focusCreateButton = () => {
    createBtnRef.current?.focus()
  }

  return {
    vitrageName,
    setVitrageName,
    siteManager,
    setSiteManager,
    creationDate,
    setCreationDate,
    horizontalSegments,
    setHorizontalSegments,
    verticalSegments,
    setVerticalSegments,
    createdVitrage,
    setCreatedVitrage,
    vitrageNameRef,
    siteManagerRef,
    creationDateRef,
    horizontalRef,
    verticalRef,
    createBtnRef,
    resetForm,
    focusVitrageNameField,
    focusSiteManagerField,
    focusCreationDateField,
    focusHorizontalField,
    focusVerticalField,
    focusCreateButton
  }
}
