import React from 'react'
import Button from '../components/Button/Button';
import HorizontalSeparator from '../components/HorizontalSeparator';
import { useNavigate } from 'react-router-dom';
import ProjectButton from '../components/ProjectButton/ProjectButton';
import { readProjects, writeProjects } from '../utils/projectUpdater';
import { FaDiscord, FaGithub, FaInstagram } from 'react-icons/fa'
import TOS from '../components/TOS/TOS';

function Projects() {
  const [projects, setProjects] = React.useState([]);
  const navigate = useNavigate();

  React.useEffect(() => {
    setProjects(readProjects())
  }, []);

  const handleProjectClick = (project) => {
    navigate(`/app?project=${encodeURIComponent(project.name)}`)
  }

  const handleRenameProject = (project) => {
    const nextNameRaw = window.prompt('Rename project', project.name)
    const nextName = nextNameRaw ? nextNameRaw.trim() : ''
    if (!nextName || nextName === project.name) return

    const currentProjects = readProjects()
    if (currentProjects.some((entry) => entry.name === nextName)) {
      alert('A project with this name already exists. Please choose a different name.')
      return
    }

    const nextProjects = currentProjects.map((entry) => (
      entry.name === project.name ? { ...entry, name: nextName } : entry
    ))
    writeProjects(nextProjects)
    setProjects(nextProjects)
  }

  const handleDeleteProject = (project) => {
    const confirmDelete = window.confirm(`Delete ${project.name}? This cannot be undone.`)
    if (!confirmDelete) return
    const currentProjects = readProjects()
    const nextProjects = currentProjects.filter((entry) => entry.name !== project.name)
    writeProjects(nextProjects)
    setProjects(nextProjects)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className='panel' style={{
        display: 'flex',
        flexDirection: 'row',
        padding: '0',
        overflow: 'hidden',
        width: '38vw',
        minHeight: '60vh'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '25px',
          width: '70%'
        }}>
          <p style={{ fontSize: '32px', marginBottom: '20px' }}>Recent Projects</p>
          {projects.length === 0 && <p style={{ fontSize: '18px', color: '#666' }}>No projects found.</p>}
          {projects.map((project, index) => (
            <div
              key={index}
              style={{
                marginBottom: '10px',
                '--delay': `${index * 75}ms`
              }}
              className="staggered-item"
            >
              <ProjectButton
                name={project.name}
                onClick={() => handleProjectClick(project)}
                onRename={() => handleRenameProject(project)}
                onDelete={() => handleDeleteProject(project)}
              />
            </div>
          ))}

          <div style={{ flex: 1 }}></div>
          <HorizontalSeparator style={{ marginLeft: '-25px', marginRight: '-25px', width: 'calc(100% + 50px)' }} />

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transform: 'translateY(12px)',
          }}>
            <button
              type='button'
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                fontSize: '15px',
                fontWeight: '500',
                color: '#c9c9c9',
                textDecoration: 'underline',
                cursor: 'pointer',
              }}
              onClick={() => {

              }}
            >
              Make a donation
            </button>

            <div style={{ display: 'flex', gap: '12px', color: '#cfcfcf' }}>
              <FaGithub size={18} style={{ cursor: 'pointer' }} />
              <FaDiscord size={18} style={{ cursor: 'pointer' }} />
              <FaInstagram size={18} style={{ cursor: 'pointer' }} />
            </div>
          </div>
        </div>

        <div style={{ width: '1px', backgroundColor: '#333333', height: 'auto' }}></div>

        <div style={{
          width: '50%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <p style={{ fontSize: '36px', fontWeight: '600' }}>
            <span style={{ color: '#C71212', fontWeight: '500' }}>co</span>DIRECT
          </p>

          <Button style={{ width: '210px', height: '36px', fontSize: '17px', marginTop: '15px' }} onClick={() => {
            navigate('/new-project')
          }}>
            Create new project
          </Button>
        </div>
      </div>

      <TOS />
    </div>
  )
}

export default Projects