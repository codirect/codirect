import React from 'react'
import './ProjectButton.css'
import { Pencil, Trash2 } from 'lucide-react'

function ProjectButton({ name, onClick, onRename, onDelete }) {
  return (
    <div className='project-button-row'>
      <button type='button' className='project-button-main' onClick={onClick}>
        <span className='project-button-name'>{name}</span>
      </button>
      <div className='project-button-actions'>
        <button
          type='button'
          className='project-button-icon'
          onClick={(event) => {
            event.stopPropagation()
            if (onRename) onRename()
          }}
          aria-label='Rename project'
        >
          <Pencil size={16} />
        </button>
        <button
          type='button'
          className='project-button-icon danger'
          onClick={(event) => {
            event.stopPropagation()
            if (onDelete) onDelete()
          }}
          aria-label='Delete project'
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}

export default ProjectButton
