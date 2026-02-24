'use client'
import { RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Quill, { Delta, EmitterSource, Range } from 'quill'
import 'quill/dist/quill.snow.css' // Import Quill styles
import { Button } from './components/ui/button'
import { ChevronDown } from 'lucide-react'
import { cn } from './lib/utils'

interface EditorProps {
  readOnly: boolean
  defaultValue: string
  deltasRef: Delta | null
  onTextChange?: (
    delta: Delta,
    oldContent: Delta,
    source: EmitterSource,
  ) => void
  onSelectionChange?: (
    range: Range,
    oldRange: Range,
    source: EmitterSource,
  ) => void
  onChange: (value: string) => void
  ref: RefObject<Quill | undefined | null>
}

const Editor = ({
  readOnly,
  defaultValue,
  deltasRef,
  onTextChange,
  onSelectionChange,
  onChange,
  ref,
}: EditorProps) => {
  const [state, setState] = useState({ isExpanded: false })

  const containerRef = useRef<HTMLDivElement | null>(null)
  const defaultValueRef = useRef(defaultValue)
  const onTextChangeRef = useRef(onTextChange)
  const onSelectionChangeRef = useRef(onSelectionChange)

  useLayoutEffect(() => {
    onTextChangeRef.current = onTextChange
    onSelectionChangeRef.current = onSelectionChange
  })

  useEffect(() => {
    ref.current?.enable(!readOnly)
  }, [ref, readOnly])

  useEffect(() => {
    const container = containerRef.current
    const editorContainer = container?.appendChild(
      container.ownerDocument.createElement('div'),
    )

    if (!editorContainer) return

    const quill = new Quill(editorContainer, {
      theme: 'snow',
      modules: {
        toolbar: true,
      },
    })

    ref.current = quill

    if (defaultValueRef.current) {
      quill.setContents(new Delta().insert(defaultValueRef.current))
    }

    if (deltasRef) {
      quill.setContents(new Delta(deltasRef))
    }

    quill.on(Quill.events.TEXT_CHANGE, (...args) => {
      onChange(quill.getText().replace(/\r?\n/g, ''))
      deltasRef = quill.getContents()
      onTextChangeRef.current?.(...args)
    })

    quill.on(Quill.events.SELECTION_CHANGE, (...args) => {
      onSelectionChangeRef.current?.(...args)
    })

    return () => {
      ref.current = null
      if (container) container.innerHTML = ''
      quill.off(Quill.events.TEXT_CHANGE)
      quill.off(Quill.events.SELECTION_CHANGE)
    }
  }, [deltasRef, onChange, ref])

  return (
    <div className='relative'>
      <div
        ref={containerRef}
        className={cn(
          '[&_.ql-formats_button]:hover:bg-accent! [&_.ql-formats_button]:dark:hover:bg-accent/50! flex max-h-40 flex-col rounded-lg border text-black *:border-0 dark:text-zinc-200 [&_.ql-container]:flex-1 [&_.ql-container]:overflow-auto [&_.ql-container]:rounded-b-lg [&_.ql-editor>*]:break-all [&_.ql-formats_button]:rounded [&_.ql-toolbar]:rounded-t-lg [&_.ql-toolbar]:border-b [&_.ql-tooltip]:left-[calc(50%/2)]!',
          state.isExpanded && 'h-80 max-h-none',
        )}
      ></div>
      <Button
        type='button'
        size='icon'
        variant='ghost'
        className='absolute top-3 right-3 size-6'
        onClick={() => setState({ ...state, isExpanded: !state.isExpanded })}
      >
        <ChevronDown className={cn(state.isExpanded && 'rotate-180')} />
      </Button>
    </div>
  )
}

export default Editor
