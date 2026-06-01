import React, { useEffect, useState } from 'react'
import Topbar from '../components/Topbar/Topbar'
import SequenceManager from '../components/SequenceManager/SequenceManager'
import CompanionPopup from '../components/CompanionPopup/CompanionPopup'
import PagePanel from '../components/PagePanel/PagePanel'
import Sidebar from '../components/Sidebar/Sidebar'
import { updateProject, getProjectByName } from '../utils/projectUpdater'
import { refreshCompanionForProject } from '../utils/companionClient'
import { promptAndCreateSequence, reorderSequences, renameSequence, removeSequence } from '../utils/sequenceUpdater'
import { useLocation } from 'react-router-dom'
import TimelinePanel from '../components/Timeline/TimelinePanel'

export default function App() {
  const [project, setProject] = useState(null)
  const location = useLocation()

  const [isPlaying, setIsPlaying] = useState(false)
  const [isResetPlayback, setIsResetPlayback] = useState(false)

  const [selectedSequenceIndex, setSelectedSequenceIndex] = useState(0)

  const [showSequenceManager, setShowSequenceManager] = useState(false)
  const [showCompanion, setShowCompanion] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)

  const handleModeChange = (selectedIndex, selectedOption) => {
    if (selectedOption === 'Live') setShowSidebar(false)
    else setShowSidebar(true)
  }

  const openSequenceManager = () => setShowSequenceManager(true)
  const closeSequenceManager = () => setShowSequenceManager(false)
  const openCompanion = () => setShowCompanion(true)
  const closeCompanion = () => setShowCompanion(false)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const projectName = params.get('project')
    const loadedProject = projectName ? getProjectByName(projectName) : null

    setProject(loadedProject)
    setSelectedSequenceIndex(0)

    const loadCompanion = async () => {
      if (!loadedProject) return
      const updated = await refreshCompanionForProject(loadedProject)
      if (updated) setProject(updated)
    }

    loadCompanion()
  }, [location.search])

  return (
    <div>
      <Topbar
        onModeChange={handleModeChange}
        onCreateSequence={() => {
          const result = promptAndCreateSequence(project)
          if (!result) return
          setProject(result.project)
          setSelectedSequenceIndex(result.selectedIndex)
        }}
        onSequenceChange={(index) => {
          setSelectedSequenceIndex(index)
          setProject(getProjectByName(project.name))
        }}
        onOpenSequenceManager={openSequenceManager}
        onOpenCompanion={openCompanion}
        selectedSequenceIndex={selectedSequenceIndex}
        project={project}
        companionStatus={project?.companion?.companionStatus}
      />

      <button onClick={() => {
        setIsPlaying((current) => !current)
        setIsResetPlayback(false)
      }} style={{ margin: '10px' }}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <button onClick={() => {
        setIsResetPlayback(true);
        setIsPlaying(false);
      }}>
        Reset
      </button>

      <div style={{ display: 'flex', height: 'calc(100vh - 50px)' }}>
        <Sidebar isVisible={showSidebar}>
          <PagePanel project={project} />
        </Sidebar>

        <TimelinePanel
          project={project}
          selectedSequenceIndex={selectedSequenceIndex}
          isSidebarVisible={showSidebar}
          isPlaying={isPlaying}
          isResetPlayback={isResetPlayback}
        />
      </div>

      {showSequenceManager && (
        <SequenceManager
          sequences={project && project.sequences ? project.sequences : []}
          onClose={closeSequenceManager}
          onReorder={(newSequences) => {
            if (!project || !project.name) return
            const updated = reorderSequences(project.name, newSequences)
            if (updated) setProject(updated)
          }}
          onRename={(index, newName) => {
            if (!project || !project.name) return
            const updated = renameSequence(project.name, index, newName)
            if (updated) setProject(updated)
          }}
          onRemove={(index) => {
            if (!project || !project.name) return
            const updated = removeSequence(project.name, index)
            if (!updated) return
            setProject(updated)
            const newLen = updated.sequences ? updated.sequences.length : 0
            if (newLen === 0) setSelectedSequenceIndex(0)
            else setSelectedSequenceIndex((current) => Math.min(current, newLen - 1))
          }}
        />
      )}

      {showCompanion && (
        <CompanionPopup
          isOverlay
          project={project}
          onClose={closeCompanion}
        />
      )}
    </div>
  )
}