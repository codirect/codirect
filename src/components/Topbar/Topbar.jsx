import React from 'react'
import { PlusIcon } from 'lucide-react'
import ItemNavigator from '../ItemNavigator/ItemNavigator'
import PillButton from '../PillButton/PillButton'
import PillSelector from '../PillSelector/PillSelector'
import StatusPill from '../StatusPill/StatusPill'
import './Topbar.css'
import { useNavigate } from 'react-router-dom'

export default function Topbar({
  onModeChange,
  onSequenceChange,
  onCreateSequence,
  onOpenSequenceManager,
  onOpenCompanion,
  project,
  companionStatus,
  selectedSequenceIndex,
  isPlaying,
  currentMode,
}) {
  const navigate = useNavigate()

  const statusTone = companionStatus === 'Connected'
    ? 'ok'
    : companionStatus === 'Bad IP Address' || companionStatus === 'Bad Config'
      ? 'error'
      : 'checking'

  const handleLogoClick = () => {
    navigate('/projects')
  }

  const handleCompanionClick = () => {
    if (onOpenCompanion) onOpenCompanion()
  }

  return (
    <header className='topbar'>
      <div className='section'>
        <p className='logo' onClick={handleLogoClick}>
          <span className='co'>co</span>DIRECT
        </p>
        <div className='vertical-line'></div>
        <p className='project-name'>{project?.name}</p>
      </div>

      <div className='section' style={{ gap: '18px' }}>
        <div className='combine_sequence_selector' style={{ gap: '3px', display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          <ItemNavigator
            items={project && project.sequences ? project.sequences.map(sequence => sequence.name) : []}
            onItemSelect={onSequenceChange}
            width={280}
            selectedIndex={selectedSequenceIndex}
            onClick={onOpenSequenceManager}
          />
          <PillButton onClick={onCreateSequence} disabled={isPlaying || currentMode === 'Live'}>
            <PlusIcon size={19} style={{ transform: 'translateY(-1px)' }} />
          </PillButton>
        </div>
        {/* <PillSelector
          options={['Edit', 'Live']}
          onChange={onModeChange}
        /> */}
      </div>

      <div className='section'>
        <StatusPill status={statusTone} onClick={handleCompanionClick}>
          Companion
        </StatusPill>
      </div>
    </header>
  )
}