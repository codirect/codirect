import { updateProject } from './projectUpdater'

export async function fetchCompanionConfig(connection) {
  if (!connection) {
    return { status: 'Unknown', config: null }
  }

  const parts = connection.split(':')
  const companionIp = parts[0]
  const companionPort = parts[1]
  const baseUrl = `http://${companionIp}:${companionPort}`

  try {
    const healthRes = await fetch(`${baseUrl}/api/connections`)
    if (!healthRes.ok) {
      return { status: 'Offline', config: null }
    }

    const configRes = await fetch(`${baseUrl}/int/export/custom?connections=false&buttons=true&surfaces.known=false&surfaces.instances=false&surfaces.remote=false&triggers=false&customVariables=false&expressionVariables=false&includeSecrets=false&format=json`)
    if (!configRes.ok) {
      return { status: 'Failed to connect', config: null }
    }

    const config = await configRes.json()
    return { status: 'OK', config }
  } catch (error) {
    return { status: 'Failed to connect', config: null }
  }
}

export async function refreshCompanionForProject(project) {
  if (!project || !project.name) return null
  if (!project.companion || !project.companion.connection) return null

  const checkingUpdate = updateProject(project.name, (current) => ({
    ...current,
    companion: {
      ...(current.companion ? current.companion : {}),
      companionStatus: 'Checking...',
      companionConfig: null,
    },
  }))

  const result = await fetchCompanionConfig(project.companion.connection)
  const updated = updateProject(project.name, (current) => ({
    ...current,
    companion: {
      ...(current.companion ? current.companion : {}),
      companionStatus: result.status,
      companionConfig: result.config,
      lastCheckedAt: Date.now(),
    },
  }))

  if (updated) return updated
  if (checkingUpdate) return checkingUpdate
  return null
}
