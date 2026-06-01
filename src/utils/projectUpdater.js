// Utility for reading and updating the projects array in localStorage
export function readProjects() {
  const raw = localStorage.getItem('projects')
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    return []
  }
}

export function writeProjects(projects) {
  localStorage.setItem('projects', JSON.stringify(projects))
}

// Update a single project by name using an updater function. 
// The updater receives the existing project and should return the updated project object.
// Returns the updated project or null if not found.
export function updateProject(projectName, updater) {
  if (!projectName) return null
  const projects = readProjects()
  let found = false

  const updated = projects.map(p => {
    if (p.name !== projectName) return p
    found = true
    try {
      const next = updater(p)
      return next
    } catch (e) {
      // on error, keep original
      return p
    }
  })

  if (!found) return null
  writeProjects(updated)
  return updated.find(p => p.name === projectName) || null
}

export function getProjectByName(projectName) {
  if (!projectName) return null
  return readProjects().find(p => p.name === projectName) || null
}
