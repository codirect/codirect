import { updateProject } from './projectUpdater'

export async function fetchCompanionConfig(connection) {
  if (!connection) {
    return { status: 'Unknown', config: null }
  }

  const parts = connection.split(':')
  const companionIp = parts[0]
  const companionPort = parts[1]
  const baseUrl = `http://${companionIp}:${companionPort}`

  // Step 1: health check — if this fails for any reason, IP is bad
  let healthRes
  try {
    healthRes = await fetch(`${baseUrl}/api/connections`)
  } catch {
    return { status: 'Offline', config: null }
  }
  if (!healthRes.ok) {
    return { status: 'Offline', config: null }
  }

  // Step 2: config fetch — server is reachable, but config may be wrong
  let configRes
  try {
    configRes = await fetch(`${baseUrl}/int/export/custom?connections=false&buttons=true&surfaces.known=false&surfaces.instances=false&surfaces.remote=false&triggers=false&customVariables=false&expressionVariables=false&includeSecrets=false&format=json`)
  } catch {
    return { status: 'Failed to connect', config: null }
  }
  if (!configRes.ok) {
    return { status: 'Failed to connect', config: null }
  }

  const config = await configRes.json()
  return { status: 'OK', config }
}

export async function refreshCompanionForProject(project) {
  if (!project?.name || !project?.companion?.connection) return null;

  const fetchMode = project.companion.fetchMode;

  if (fetchMode === 0) {
    try {
      const result = await fetchCompanionConfig(project.companion.connection);

      return updateProject(project.name, (current) => ({
        ...current,
        companion: {
          ...current.companion,
          companionStatus: result.status,
          companionConfig: result.config,
          lastCheckedAt: Date.now(),
        },
      }));
    } catch (err) {
      console.error("Companion fetch failed:", err);
      return null;
    }
  }

  return updateProject(project.name, (current) => ({
    ...current,
    companion: {
      ...current.companion,
      companionStatus: 'OK',
      lastCheckedAt: Date.now(),
    },
  }));
}
