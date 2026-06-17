import React, { useEffect, useState } from 'react'
import Button from '../Button/Button'
import HorizontalSeparator from '../HorizontalSeparator'
import './CompanionPopup.css'
import Expand from '../Expand/Expand'
import InputField from '../InputField/InputField'
import { updateProject } from '../../utils/projectUpdater'
import PillSelector from '../PillSelector/PillSelector'
import { CircleQuestionMarkIcon, CopyIcon, CheckIcon, UploadIcon } from 'lucide-react'

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

function CompanionPopup({ project, onClose, isOverlay = false, statusText = 'Connecting...', statusTone = 'checking' }) {
  const [companionConfig, setCompanionConfig] = React.useState(null)

  const [companionIp, setCompanionIp] = React.useState('')
  const [companionPort, setCompanionPort] = React.useState('')
  const [projectName, setProjectName] = React.useState('')
  const [hasUpdated, setHasUpdated] = React.useState(false)
  const [isReloading, setIsReloading] = React.useState(false)
  const originalConnectionRef = React.useRef('')

  const [fetchMode, setFetchMode] = React.useState(0)
  const [isCopied, setIsCopied] = useState(false)

  React.useEffect(() => {
    if (project) {
      setCompanionConfig(project?.companion?.companionConfig ? project.companion.companionConfig : null)
      setProjectName(project?.name ? project.name : '')

      const connection = project?.companion?.connection ? project.companion.connection : ''
      const [ip, port] = connection.split(':')
      setCompanionIp(ip ? ip : '')
      setCompanionPort(port ? port : '')
      originalConnectionRef.current = connection
      setHasUpdated(false)
      return
    }

    const searchParams = new URLSearchParams(window.location.search)
    const selectedNameValue = searchParams.get('project')
    const selectedName = selectedNameValue ? selectedNameValue : ''
    const storedProject = getProjectFromStorage(selectedName)

    setCompanionConfig(storedProject?.companion?.companionConfig ? storedProject.companion.companionConfig : null)
    setProjectName(storedProject?.name ? storedProject.name : selectedName)

    const connection = storedProject?.companion?.connection ? storedProject.companion.connection : ''
    const [ip, port] = connection.split(':')
    setCompanionIp(ip ? ip : '')
    setCompanionPort(port ? port : '')
    originalConnectionRef.current = connection
    setHasUpdated(false)
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

    setHasUpdated(connection !== originalConnectionRef.current)
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
    if (hasUpdated) {
      setIsReloading(true)
      window.location.reload()
      return
    }
    if (onClose) onClose()
  }

  const handleChangeFetchMode = (index) => {
    updateProject(projectName, (project) => ({
      ...project,
      companion: {
        ...(project?.companion ? project.companion : {}),
        fetchMode: index,
      },
    }))
    setFetchMode(index)
    setHasUpdated(true)
  }

  const handleUploadConfig = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.companionconfig';

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsedConfig = JSON.parse(event.target.result);

          updateProject(projectName, (project) => ({
            ...project,
            companion: {
              ...(project?.companion || {}),
              companionConfig: parsedConfig,
            },
          }));

          setHasUpdated(true);
        } catch (e) {
          window.alert("Invalid JSON: The file is not a valid Companion config.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleCopyRoomId = () => {
    if (project?.websocketRoomId) {
      navigator.clipboard.writeText(project.websocketRoomId)
        .then(() => {
          setIsCopied(true)
          setTimeout(() => setIsCopied(false), 2000)
        })
        .catch((err) => {
          console.error('Failed to copy text: ', err);
        });
    }
  }

  useEffect(() => {
    const fetchMode = project?.companion?.fetchMode;
    setFetchMode(fetchMode);
  }, [project])

  const content = (
    <div className='panel companion-panel'>
      <div className='companion-header'>
        <p style={{ fontSize: '1.5rem', margin: 0 }}>Companion</p>
        <a
          href="https://docs.codirect.live/companionstatus"
          target="_blank"
          className="docs-helper"
        >
          <CircleQuestionMarkIcon size={28} />
        </a>
      </div>

      <HorizontalSeparator />

      <div className='companion-body'>
        <div className='companion-row'>
          <p className='companion-label'>Status</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className={`companion-status-dot ${statusTone}`} />
            <p className='companion-value'>{statusText}</p>
          </div>
        </div>
        <div className='companion-row'>
          <p className='companion-label'>Build</p>
          <p className='companion-value'>{companionConfig?.companionBuild ? companionConfig.companionBuild : 'Unknown'}</p>
        </div>

        <HorizontalSeparator style={{ margin: '10px 0' }} />

        <Expand title='Companion Connection'>
          <div style={{ display: 'flex', flexDirection: 'row', gap: '10px', alignItems: 'center', margin: '6px 0 12px 0' }}>
            <InputField placeholder='IP Address' value={companionIp ? companionIp : ''} onChange={(e) => handleIpUpdate(e.target.value)} />
            <p style={{ color: '#9c9c9c', margin: 0 }}>:</p>
            <InputField placeholder='Port' value={companionPort ? companionPort : ''} onChange={(e) => handlePortUpdate(e.target.value)} />
          </div>
        </Expand>

        <Expand title='Companion Config' style={{ marginTop: '10px' }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'row', 
            gap: '12px', 
            alignItems: 'center', 
            margin: '6px 0 12px 0'
          }}>
            <PillSelector options={['Auto', 'Manual']} initialSelectedIndex={fetchMode} onChange={handleChangeFetchMode} />
            {fetchMode === 1 && (
              <Button onClick={handleUploadConfig}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 2px' }}>
                  <span>Upload Config</span>
                  <UploadIcon size={16} />
                </div>
              </Button>
            )}
          </div>
        </Expand>

        <HorizontalSeparator style={{ margin: '10px 0' }} />

        <Expand title='WebSocket'>
          <div style={{ display: 'flex', flexDirection: 'row', gap: '10px', alignItems: 'center', margin: '6px 0 12px 0' }}>
            <div style={{ 
              backgroundColor: '#2e2e2e', 
              padding: '0 12px', 
              borderRadius: '8px',
              flexGrow: 1,
              display: 'flex',
              alignItems: 'center',
              height: '38px',
              boxSizing: 'border-box'
            }}>
              <p style={{ 
                userSelect: 'text', 
                cursor: 'text', 
                margin: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {project?.websocketRoomId}
              </p>
            </div>
            <Button
              style={{ width: '45px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              onClick={handleCopyRoomId}
            >
              {isCopied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
            </Button>
          </div>
        </Expand>
      </div>

      <HorizontalSeparator />

      <div className='companion-footer'>
        <Button onClick={handleClose} disabled={isReloading}>
          {isReloading
            ? <span className='reload-dots'><span /><span /><span /></span>
            : 'Close'
          }
        </Button>
      </div>
    </div>
  )

  if (isOverlay) {
    return <div className='companion-overlay'>{content}</div>
  }

  return content
}

export default CompanionPopup