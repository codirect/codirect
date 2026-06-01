import React, { useEffect, useRef, useState } from 'react'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Pencil, Trash2 } from 'lucide-react'
import HorizontalSeparator from '../HorizontalSeparator'
import Button from '../Button/Button'
import './SequenceManager.css'

const SortableRow = ({ seq, index, onRename, onRemove, canDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: seq.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div ref={setNodeRef} style={style} className={`seqmgr-row ${isDragging ? 'dragging' : ''}`}>
      <div className='seqmgr-draghandle' {...attributes} {...listeners}>☰</div>
      <div className='seqmgr-name'>{seq.data.name}</div>
      <div className='seqmgr-actions'>
        <button className='seqmgr-icon-btn' onClick={() => onRename(index)} aria-label='Rename'>
          <Pencil size={16} />
        </button>
        {canDelete && (
          <button
            className='seqmgr-icon-btn danger'
            onClick={() => onRemove(index)}
            aria-label='Delete'
            title='Delete'
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  )
}

export default function SequenceManager({ sequences = [], onClose, onReorder, onRename, onRemove }) {
  const [items, setItems] = useState([])
  const idMapRef = useRef(new Map())
  const idCounterRef = useRef(0)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  useEffect(() => {
    const map = idMapRef.current
    const next = sequences.map((seq) => {
      const key = seq.name
      let id = map.get(key)
      if (!id) {
        id = `seq-${idCounterRef.current++}`
        map.set(key, id)
      }
      return { id, data: seq }
    })
    setItems(next)
  }, [sequences])

  const handleRename = (index) => {
    const current = items[index]?.data?.name ?? ''
    const nextName = window.prompt('Rename sequence', current)?.trim()
    if (!nextName || nextName === current) return

    if (items.some((s, i) => s.data.name === nextName && i !== index)) {
      alert('A sequence with this name already exists. Please choose a different name.')
      return
    }

    const next = items.map((s, i) => i === index ? { ...s, data: { ...s.data, name: nextName } } : s)
    const map = idMapRef.current
    const currentId = map.get(current)
    map.delete(current)
    if (currentId) map.set(nextName, currentId)
    setItems(next)
    if (onRename) onRename(index, nextName)
  }

  const handleRemove = (index) => {
    if (items.length <= 1) return
    const name = items[index]?.data?.name ?? 'this sequence'
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return
    idMapRef.current.delete(name)
    if (onRemove) onRemove(index)
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex(i => i.id === active.id)
    const newIndex = items.findIndex(i => i.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const next = arrayMove(items, oldIndex, newIndex)
    setItems(next)
    if (onReorder) onReorder(next.map((s) => s.data))
  }

  return (
    <div className='seqmgr-overlay'>
      <div className='panel seqmgr-panel'>
        <div className='seqmgr-header'>
          <p style={{ fontSize: '1.5rem', margin: 0 }}>Manage Sequences</p>
        </div>
        
        <HorizontalSeparator />

        <div className='seqmgr-list'>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            autoScroll={{
              layoutShiftCompensation: false,
              acceleration: 3,
            }}
          >
            <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
              {items.map((s, i) => (
                <SortableRow
                  key={s.id}
                  seq={s}
                  index={i}
                  onRename={handleRename}
                  onRemove={handleRemove}
                  canDelete={items.length > 1}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <HorizontalSeparator />

        <div className='seqmgr-footer'>
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  )
}