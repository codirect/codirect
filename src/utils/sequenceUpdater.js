import { updateProject } from './projectUpdater'

export function reorderSequences(projectName, newSequences) {
  if (!projectName) return null
  return updateProject(projectName, (project) => ({
    ...project,
    sequences: newSequences,
  }))
}

export function createSequence(projectName, sequenceName) {
  if (!projectName) return null
  if (!sequenceName) return null
  return updateProject(projectName, (project) => {
    const nextSequences = project.sequences ? [...project.sequences] : []
    nextSequences.push({ name: sequenceName, items: [] })
    return {
      ...project,
      sequences: nextSequences,
    }
  })
}

export function promptAndCreateSequence(project) {
  if (!project || !project.name) return null
  const currentCount = project.sequences ? project.sequences.length : 0
  const defaultSequenceName = `Sequence ${currentCount + 1}`
  const rawName = window.prompt('Enter sequence name', defaultSequenceName)
  const nextName = rawName ? rawName.trim() : ''

  if (!nextName) return null

  if (project.sequences && project.sequences.some((sequence) => sequence.name === nextName)) {
    alert('A sequence with this name already exists. Please choose a different name.')
    return null
  }

  const updated = createSequence(project.name, nextName)
  if (!updated) return null

  const nextLen = updated.sequences ? updated.sequences.length : 1
  return {
    project: updated,
    selectedIndex: nextLen - 1,
  }
}

export function renameSequence(projectName, index, newName) {
  if (!projectName) return null
  return updateProject(projectName, (project) => {
    const nextSequences = project.sequences
      ? project.sequences.map((seq, i) => (i === index ? { ...seq, name: newName } : seq))
      : []

    return {
      ...project,
      sequences: nextSequences,
    }
  })
}

export function removeSequence(projectName, index) {
  if (!projectName) return null
  return updateProject(projectName, (project) => {
    const nextSequences = project.sequences ? [...project.sequences] : []
    nextSequences.splice(index, 1)
    return {
      ...project,
      sequences: nextSequences,
    }
  })
}
