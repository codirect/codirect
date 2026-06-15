import { CircleQuestionMarkIcon } from 'lucide-react'
import React from 'react'
import HorizontalSeparator from '../components/HorizontalSeparator'
import InputField from '../components/InputField/InputField'
import Button from '../components/Button/Button'
import { useNavigate } from 'react-router-dom'
import TOS from '../components/TOS/TOS'

function NewProject() {
  const [projectName, setProjectName] = React.useState('')

  const router = useNavigate()

  const [companionIP, setCompanionIP] = React.useState('')
  const [companionPort, setCompanionPort] = React.useState('')

  const readProjects = () => {
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

  const handleCreateProject = () => {
    if (!projectName) {
      alert('Please enter a project name')
      return
    }
    if (!companionIP || !companionPort) {
      alert('Please enter companion connection details')
      return
    }

    const projects = readProjects()

    if (projects.some(project => project.name === projectName)) {
      alert('A project with this name already exists. Please choose a different name.')
      return
    }

    const newProject = {
      date: Date.now(),
      name: projectName,
      websocketRoomId: crypto.randomUUID(),
      companion: {
        connection: `${companionIP}:${companionPort}`,
        fetchMode: 0, //auto by default
      },
      sequences: [
        {
          name: 'Sequence 1',
          items: [],
        },
      ],
      tracks: [
        { name: 'Camera' }, { name: 'Graphics' }, { name: 'Lighting' },
        { name: 'Video' }, { name: 'Audio' }, { name: 'Other' },
      ],
    }

    projects.push(newProject)
    localStorage.setItem('projects', JSON.stringify(projects))

    router('/app?project=' + encodeURIComponent(projectName))
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className='panel'>
        <div style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center', gap: '100px', padding: '20px' }}>
          <p style={{ fontSize: '32px' }}>Create new <span style={{ color: '#C71212' }}>project</span></p>
          <CircleQuestionMarkIcon size={28} color='#888888' />
        </div>

        <HorizontalSeparator />

        <div style={{ padding: '20px', gap: '10px', display: 'flex', flexDirection: 'column' }}>
          <p style={{ fontSize: '21px' }}>Project name</p>
          <InputField type="text" placeholder="Enter project name" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
        </div>

        <HorizontalSeparator />

        <div style={{ padding: '20px', gap: '10px', display: 'flex', flexDirection: 'column' }}>
          <p style={{ fontSize: '21px' }}>Companion Connection</p>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <InputField type="text" placeholder="IP Address" value={companionIP} onChange={(e) => setCompanionIP(e.target.value)} />
            <p style={{ color: '#888888' }}>:</p>
            <InputField type="text" placeholder="Port" value={companionPort} onChange={(e) => setCompanionPort(e.target.value)} />
          </div>
        </div>

        <HorizontalSeparator />

        <div style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
          <Button style={{ padding: '12px 24px', width: '100%' }} onClick={handleCreateProject}>
            Create Project
          </Button>
        </div>
      </div>
      
      <TOS />
    </div>
  )
}

export default NewProject