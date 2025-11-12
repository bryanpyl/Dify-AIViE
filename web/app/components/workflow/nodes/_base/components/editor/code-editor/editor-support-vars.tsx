'use client'
import type { FC } from 'react'
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useBoolean } from 'ahooks'
import { useTranslation } from 'react-i18next'
import type { Props as EditorProps } from '.'
import Editor from '.'
import cn from '@/utils/classnames'
import VarReferenceVars from '@/app/components/workflow/nodes/_base/components/variable/var-reference-vars'
import type { NodeOutPutVar, Variable } from '@/app/components/workflow/types'

const TO_WINDOW_OFFSET = 8

type Props = {
  availableVars: NodeOutPutVar[]
  varList: Variable[]
  onAddVar?: (payload: Variable) => void
} & EditorProps

const CodeEditor: FC<Props> = ({
  availableVars,
  varList,
  onAddVar,
  ...editorProps
}) => {
  const { t } = useTranslation()

  const isLeftBraceRef = useRef(false)

  const editorRef = useRef<HTMLTextAreaElement>(null)
  const debounceRef = useRef<number | null>(null)

  const popupRef = useRef<HTMLDivElement>(null)
  const [isShowVarPicker, {
    setTrue: showVarPicker,
    setFalse: hideVarPicker,
  }] = useBoolean(false)

  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 })

  // Listen for cursor position changes
   const handleCursorPositionChange = useCallback(() => {
    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Debounce the heavy calculation
    debounceRef.current = window.setTimeout(() => {
      const textarea = editorRef.current
      if (!textarea) return

      const { selectionStart, value } = textarea
      const charBefore = value[selectionStart - 1]
      
      if (['/', '{'].includes(charBefore)) {
        isLeftBraceRef.current = charBefore === '{'
        
        // Only calculate position if we're showing the picker
        if (!isShowVarPicker) {
          // Simple position calculation
          const textareaRect = textarea.getBoundingClientRect()
          const textBeforeCursor = value.slice(0, selectionStart)
          const lines = textBeforeCursor.split('\n')
          const currentLineLength = lines[lines.length - 1].length
          
          const lineHeight = 18
          const charWidth = 8
          
          const popupX = Math.min(
            textareaRect.left + (currentLineLength * charWidth),
            window.innerWidth - 250 // Approximate popup width
          )
          const popupY = Math.min(
            textareaRect.top + ((lines.length - 1) * lineHeight) + 20,
            window.innerHeight - 200 // Approximate popup height
          )

          // Single state update
          setPopupPosition({ x: popupX, y: popupY })
          showVarPicker()
        }
      } else {
        hideVarPicker()
      }
    }, 100) // 100ms debounce
  }, [isShowVarPicker, showVarPicker, hideVarPicker])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  // Handle when the textarea is mounted
  const onEditorMounted = useCallback((textarea: HTMLTextAreaElement) => {
    editorRef.current = textarea
    
    if (!textarea) return

    // Only listen to keyup to reduce event frequency
    const handleKeyUp = (e: KeyboardEvent) => {
      // Only trigger on specific keys that might add trigger characters
      if (e.key === '/' || e.key === '{' || e.key === 'Backspace' || e.key === 'Delete') {
        handleCursorPositionChange()
      }
    }

    textarea.addEventListener('keyup', handleKeyUp)

    // Cleanup function
    return () => {
      textarea.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleCursorPositionChange])

  const getUniqVarName = useCallback((varName: string): string => {
    if (varList.find(v => v.variable === varName)) {
      const match = varName.match(/_(\d+)$/)
      const index = match ? parseInt(match[1]!) + 1 : 1
      return getUniqVarName(`${varName.replace(/_(\d+)$/, '')}_${index}`)
    }
    return varName
  }, [varList])

  const getVarName = useCallback((varValue: string[]) => {
    const existVar = varList.find(v => 
      Array.isArray(v.value_selector) && 
      v.value_selector.join('@@@') === varValue.join('@@@')
    )
    if (existVar) {
      return {
        name: existVar.variable,
        isExist: true,
      }
    }
    const varName = varValue.slice(-1)[0]
    return {
      name: getUniqVarName(varName),
      isExist: false,
    }
  }, [varList, getUniqVarName])

  const handleSelectVar = useCallback((varValue: string[]) => {
    const { name, isExist } = getVarName(varValue)
    
    if (!isExist && onAddVar) {
      const newVar: Variable = {
        variable: name,
        value_selector: varValue,
      }
      onAddVar(newVar)
    }

    const textarea = editorRef.current
    if (!textarea) return

    const { selectionStart, selectionEnd, value } = textarea
    
    // Remove the trigger character and insert variable
    const textBefore = value.slice(0, selectionStart - 1)
    const textAfter = value.slice(selectionEnd)
    const insertText = `{{ ${name} }${!isLeftBraceRef.current ? '}' : ''}`
    
    const newValue = textBefore + insertText + textAfter
    const newCursorPosition = textBefore.length + insertText.length

    // Update textarea
    textarea.value = newValue
    textarea.selectionStart = newCursorPosition
    textarea.selectionEnd = newCursorPosition

    // Trigger updates
    editorProps.onChange?.(newValue)
    
    // Single input event dispatch
    textarea.dispatchEvent(new Event('input', { bubbles: true }))

    hideVarPicker()
    textarea.focus()
  }, [getVarName, onAddVar, editorProps.onChange, hideVarPicker])


  return (
    <div className={cn(editorProps.isExpand && 'h-full')}>
      <Editor
        {...editorProps}
        onMount={onEditorMounted}
        placeholder={t('workflow.common.jinjaEditorPlaceholder')!}
      />
      {isShowVarPicker && (
        <div
          ref={popupRef}
          className='w-[228px] space-y-1 rounded-lg border border-components-panel-border bg-components-panel-bg p-1 shadow-lg'
          style={{
            position: 'fixed',
            top: popupPosition.y,
            left: popupPosition.x,
            zIndex: 100,
          }}
        >
          <VarReferenceVars
            hideSearch
            vars={availableVars}
            onChange={handleSelectVar}
            isSupportFileVar={false}
          />
        </div>
      )}
    </div>
  )
}
export default React.memo(CodeEditor)
