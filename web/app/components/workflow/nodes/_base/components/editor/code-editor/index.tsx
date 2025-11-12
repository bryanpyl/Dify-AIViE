'use client'
import type { FC } from 'react'
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
  useMemo,
} from 'react'
import Editor, { loader } from '@monaco-editor/react'
import Base from '../base'
import cn from '@/utils/classnames'
import { CodeLanguage } from '@/app/components/workflow/nodes/code/types'
import { getFilesInLogs } from '@/app/components/base/file-uploader/utils'
import { Theme } from '@/types/app'
import useTheme from '@/hooks/use-theme'
import './style.css'
import { noop } from 'lodash-es'
import { basePath } from '@/utils/var'

// // load file from local instead of cdn https://github.com/suren-atoyan/monaco-react/issues/482
// loader.config({ paths: { vs: `${basePath}/vs` } })

// Prism imports
import Prism from 'prismjs'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-json'
import 'prismjs/themes/prism.css'

const CODE_EDITOR_LINE_HEIGHT = 18
const DEBOUNCE_MS = 50

export type Props = {
  nodeId?: string
  value?: string | object
  placeholder?: React.JSX.Element | string
  onChange?: (value: string) => void
  title?: string | React.JSX.Element
  language: CodeLanguage
  headerRight?: React.JSX.Element
  readOnly?: boolean
  isJSONStringifyBeauty?: boolean
  height?: number
  isInNode?: boolean
  onMount?: (editor: any) => void
  noWrapper?: boolean
  isExpand?: boolean
  showFileList?: boolean
  onGenerated?: (value: string) => void
  showCodeGenerator?: boolean
  className?: string
  tip?: React.JSX.Element
  footer?: React.ReactNode
}

// Map internal CodeLanguage to Prism language identifiers
export const languageMap: Record<CodeLanguage, string> = {
  [CodeLanguage.javascript]: 'javascript',
  [CodeLanguage.python3]: 'python',
  [CodeLanguage.json]: 'json',
}

const CodeEditor: FC<Props> = ({
  nodeId,
  value = '',
  placeholder = '',
  onChange = () => {},
  title = '',
  headerRight,
  language,
  readOnly,
  isJSONStringifyBeauty,
  height,
  isInNode,
  onMount,
  noWrapper,
  isExpand,
  showFileList,
  onGenerated,
  showCodeGenerator = false,
  className,
  tip,
  footer,
}) => {
  const { theme } = useTheme() 
  const [isFocus, setIsFocus] = useState(false)
  const editorRef = useRef<HTMLTextAreaElement | null>(null)
  const mirrorRef = useRef<HTMLDivElement | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement | null>(null)
  const highlightRef = useRef<HTMLDivElement | null>(null)
  const [wrappedLineNumbers, setWrappedLineNumbers] = useState<(string | number)[]>([])

  const outPutValue = (() => {
    if (!isJSONStringifyBeauty) return value as string
    try {
      return JSON.stringify(value as object, null, 2)
    } catch {
      return value as string
    }
  })()

  const fileList = typeof value === 'object' ? getFilesInLogs(value) : []

  const computeWrappedLines = useCallback(() => {
    const mirror = mirrorRef.current
    if (!mirror) return

    mirror.innerHTML = ''
    const lines = outPutValue.split('\n')
    const lineHeight = CODE_EDITOR_LINE_HEIGHT
    const result: (string | number)[] = []

    lines.forEach((line, i) => {
      const span = document.createElement('span')
      span.textContent = line || '\u200b'
      mirror.appendChild(span)
      const wrappedLines = Math.max(1, Math.round(span.offsetHeight / lineHeight))
      for (let j = 0; j < wrappedLines; j++) {
        result.push(j === 0 ? i + 1 : '')
      }
      mirror.appendChild(document.createElement('br'))
    })

    setWrappedLineNumbers(result)
  }, [outPutValue])

  // debounce wrapper
  const debouncedRecalc = useRef<number | null>(null)
  const scheduleRecalc = useCallback(() => {
    if (debouncedRecalc.current !== null) {
      window.clearTimeout(debouncedRecalc.current)
    }
    debouncedRecalc.current = window.setTimeout(() => {
      computeWrappedLines()
      resizeTextarea()
      debouncedRecalc.current = null
    }, DEBOUNCE_MS)
  }, [computeWrappedLines])

  // const resizeTextarea = () => {
  //   const textarea = editorRef.current
  //   const mirror = mirrorRef.current
  //   if (textarea && mirror) {
  //     textarea.style.height = 'auto'
  //     mirror.textContent = textarea.value || '\u200b'
  //     textarea.style.height = `${mirror.offsetHeight}px`
  //   }
  // }

  const resizeTextarea = () => {
    const textarea = editorRef.current
    const mirror = mirrorRef.current
    if (textarea && mirror) {
      textarea.style.height = 'auto'
      // Ensure blank lines and trailing newlines are counted
      mirror.textContent = (textarea.value || '') + '\u200b'
      textarea.style.height = `${mirror.offsetHeight}px`
    }
  }

  const syncHighlight = useCallback(() => {
    const highlight = highlightRef.current
    if (!highlight) return
    const prismLang = languageMap[language] || 'javascript'
    const grammar = Prism.languages[prismLang] || Prism.languages.javascript
    const safe = outPutValue || ''
    const html = Prism.highlight(safe, grammar, prismLang).replace(/\n$/g, '\n\u200b')
    highlight.innerHTML = html
  }, [outPutValue, language])

  const syncScroll = useCallback(() => {
    const textarea = editorRef.current
    const highlight = highlightRef.current
    if (textarea && highlight) {
      highlight.scrollTop = textarea.scrollTop
      highlight.scrollLeft = textarea.scrollLeft
    }
  }, [])

  useEffect(() => {
    onMount?.(editorRef.current)
  }, [onMount])

  useEffect(() => {
    scheduleRecalc()
    syncHighlight()
    syncScroll()
  }, [outPutValue, scheduleRecalc, syncHighlight, syncScroll])

  useLayoutEffect(() => {
    if (!scrollAreaRef.current) return
    const observer = new ResizeObserver(() => {
      scheduleRecalc()
    })
    observer.observe(scrollAreaRef.current)
    if (editorRef.current) observer.observe(editorRef.current)
    return () => {
      observer.disconnect()
      if (debouncedRecalc.current !== null) {
        window.clearTimeout(debouncedRecalc.current)
      }
    }
  }, [scheduleRecalc])

  useEffect(() => {
    syncHighlight()
  }, [syncHighlight])

  useEffect(() => {
    const textarea = editorRef.current
    if (!textarea) return
    const handler = () => {
      syncScroll()
    }
    textarea.addEventListener('scroll', handler)
    return () => {
      textarea.removeEventListener('scroll', handler)
    }
  }, [syncScroll])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newValue =
        textarea.value.slice(0, start) + '  ' + textarea.value.slice(end)
      textarea.value = newValue
      textarea.selectionStart = textarea.selectionEnd = start + 2
      onChange(newValue)
    }

    if (e.key === 'Enter') {
      requestAnimationFrame(() => {
        resizeTextarea()
        computeWrappedLines()
      })
    }
  }

  const appTheme = useMemo(() => {
    if (theme === Theme.light)
      return 'light'
    return 'vs-dark'
  }, [theme])

  const renderLineNumbers = () => {
    return wrappedLineNumbers.map((n, i) => (
      <div key={i} className="line-number">
        {n}
      </div>
    ))
  }

  const main = (
    <div className="code-editor-container">
      <div className="code-scroll-area" ref={scrollAreaRef}>
        <div className="line-numbers">{renderLineNumbers()}</div>
        <div className="editor-wrapper">
          <div
            className="code-highlight-overlay"
            ref={highlightRef}
            aria-hidden="true"
          />
          <textarea
            ref={editorRef}
            value={outPutValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocus(true)}
            onBlur={() => setIsFocus(false)}
            readOnly={readOnly}
            spellCheck={false}
            className="code-textarea"
            placeholder={typeof placeholder === 'string' ? placeholder : ''}
            style={{
              lineHeight: `${CODE_EDITOR_LINE_HEIGHT}px`,
              background: 'transparent',
              color: 'transparent', // hide raw text so highlight shows through
              caretColor: '#1e1e1e', // keep caret visible
              position: 'relative',
            }}
          />
          <div
            ref={mirrorRef}
            className="code-mirror-measure"
            aria-hidden="true"
          />
        </div>
      </div>
      {!outPutValue && !isFocus && typeof placeholder === 'string' && (
        <div className="placeholder-text">{placeholder}</div>
      )}
    </div>
  )

  return (
    <div className={cn(isExpand && 'h-full', className)}>
      {noWrapper
        ? <div className='no-wrapper relative'>
          {main}
        </div>
        : (
          <Base
            nodeId={nodeId}
            className='relative overflow-hidden'
            title={title}
            value={outPutValue}
            headerRight={headerRight}
            isFocus={isFocus && !readOnly}
            minHeight={height || 200}
            isInNode={isInNode}
            onGenerated={onGenerated}
            codeLanguages={language}
            fileList={fileList as any}
            showFileList={showFileList}
            showCodeGenerator={showCodeGenerator}
            tip={tip}
            footer={footer}
          >
            {main}
          </Base>
        )}
    </div>
  )
}
export default React.memo(CodeEditor)
