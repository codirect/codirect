import React from 'react'
import Button from '../Button/Button'
import HorizontalSeparator from '../HorizontalSeparator'
import './CompanionPopup.css'
import Expand from '../Expand/Expand'
import InputField from '../InputField/InputField'
import { updateProject } from '../../utils/projectUpdater'

const readProjectsFromStorage = () => {
  const rawProjects = localStorage.getItem('projects')

  if (!rawProjects) {
    return []
  }

  try {
    const parsedProjects = JSON.parse(rawProjects)
    return Array.isArray(parsedProjects) ? parsedProjects : []
  } catch (error) {
    return []
  }
}

const getProjectFromStorage = (projectName) => {
  const projects = readProjectsFromStorage()
  const match = projects.find((entry) => entry.name === projectName)
  return match ? match : null
}

function CompanionPopup({ project, onClose, isOverlay = false }) {
  const [companionStatus, setCompanionStatus] = React.useState('Checking...')
  const [companionConfig, setCompanionConfig] = React.useState(null)

  const [companionIp, setCompanionIp] = React.useState('')
  const [companionPort, setCompanionPort] = React.useState('')
  const [projectName, setProjectName] = React.useState('')
  const [hasUpdatedConnection, setHasUpdatedConnection] = React.useState(false)
  const originalConnectionRef = React.useRef('')

  React.useEffect(() => {
    if (project) {
      setCompanionStatus(project?.companion?.companionStatus ? project.companion.companionStatus : 'Unknown')
      setCompanionConfig(project?.companion?.companionConfig ? project.companion.companionConfig : null)
      setProjectName(project?.name ? project.name : '')

      const connection = project?.companion?.connection ? project.companion.connection : ''
      const [ip, port] = connection.split(':')
      setCompanionIp(ip ? ip : '')
      setCompanionPort(port ? port : '')
      originalConnectionRef.current = connection
      setHasUpdatedConnection(false)
      return
    }

    const searchParams = new URLSearchParams(window.location.search)
    const selectedNameValue = searchParams.get('project')
    const selectedName = selectedNameValue ? selectedNameValue : ''
    const storedProject = getProjectFromStorage(selectedName)

    setCompanionStatus(storedProject?.companion?.companionStatus ? storedProject.companion.companionStatus : 'Unknown')
    setCompanionConfig(storedProject?.companion?.companionConfig ? storedProject.companion.companionConfig : null)
    setProjectName(storedProject?.name ? storedProject.name : selectedName)

    const connection = storedProject?.companion?.connection ? storedProject.companion.connection : ''
    const [ip, port] = connection.split(':')
    setCompanionIp(ip ? ip : '')
    setCompanionPort(port ? port : '')
    originalConnectionRef.current = connection
    setHasUpdatedConnection(false)
  }, [project])

  const persistCompanionConnection = (nextIp, nextPort) => {
    if (!projectName) return
    const trimmedIp = nextIp.trim()
    const trimmedPort = nextPort.trim()
    const connection = trimmedIp && trimmedPort ? `${trimmedIp}:${trimmedPort}` : `${trimmedIp}${trimmedPort ? `:${trimmedPort}` : ''}`

    updateProject(projectName, (project) => ({
      ...project,
      companion: {
        ...(project?.companion ? project.companion : {}),
        connection,
      },
    }))

    setHasUpdatedConnection(connection !== originalConnectionRef.current)
  }

  const handleIpUpdate = (newIp) => {
    setCompanionIp(newIp)
    persistCompanionConnection(newIp, companionPort)
  }

  const handlePortUpdate = (newPort) => {
    setCompanionPort(newPort)
    persistCompanionConnection(companionIp, newPort)
  }

  const handleClose = () => {
    if (onClose) onClose()
    if (hasUpdatedConnection) window.location.reload()
  }

  const content = (
    <div className='panel companion-panel'>
      <div className='companion-header'>
        <p style={{ fontSize: '1.5rem', margin: 0 }}>Companion</p>
      </div>

      <HorizontalSeparator />

      <div className='companion-body'>
        <div className='companion-row'>
          <p className='companion-label'>Status</p>
          <p className='companion-value'>{companionStatus}</p>
        </div>
        <div className='companion-row'>
          <p className='companion-label'>Build</p>
          <p className='companion-value'>{companionConfig?.companionBuild ? companionConfig.companionBuild : 'Unknown'}</p>
        </div>

        <HorizontalSeparator style={{ margin: '10px 0' }} />

        <Expand title='Companion Connection'>
          <div style={{ display: 'flex', flexDirection: 'row', gap: '10px', alignItems: 'center' }}>
            <InputField placeholder='IP Address' value={companionIp ? companionIp : ''} onChange={(e) => handleIpUpdate(e.target.value)} />
            <p style={{ color: '#9c9c9c' }}>:</p>
            <InputField placeholder='Port' value={companionPort ? companionPort : ''} onChange={(e) => handlePortUpdate(e.target.value)} />
          </div>
        </Expand>
      </div>

      <HorizontalSeparator />

      <div className='companion-footer'>
        <Button onClick={handleClose}>Close</Button>
      </div>
    </div>
  )

  if (isOverlay) {
    return <div className='companion-overlay'>{content}</div>
  }

  return content
}

export default CompanionPopup