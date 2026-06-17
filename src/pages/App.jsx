import React, { useEffect, useState, useRef, useCallback } from 'react'
import { Peer } from 'peerjs' // <-- Import browser-native PeerJS
import Topbar from '../components/Topbar/Topbar'
import SequenceManager from '../components/SequenceManager/SequenceManager'
import CompanionPopup from '../components/CompanionPopup/CompanionPopup'
import PagePanel from '../components/PagePanel/PagePanel'
import Sidebar from '../components/Sidebar/Sidebar'
import { updateProject, getProjectByName } from '../utils/projectUpdater'
import { refreshCompanionForProject } from '../utils/companionClient'
import { promptAndCreateSequence, reorderSequences, renameSequence, removeSequence } from '../utils/sequenceUpdater'
import { useLocation, useNavigate } from 'react-router-dom' // <-- Added useNavigate to handle project loading URLs
import TimelinePanel from '../components/Timeline/TimelinePanel'
import PlayControls from '../components/PlayControls/PlayControls'
import BetaBanner from '../components/BetaBanner/BetaBanner'

export default function App() {
  const [project, setProject] = useState(null)
  const location = useLocation()
  const navigate = useNavigate()

  const [isPlaying, setIsPlaying] = useState(false)
  const [isResetPlayback, setIsResetPlayback] = useState(false)
  const [playbackTime, setPlaybackTime] = useState(0)
  const [isHoldingTriggers, setIsHoldingTriggers] = useState(false)

  const [selectedMode, setSelectedMode] = useState('Edit')
  const [selectedSequenceIndex, setSelectedSequenceIndex] = useState(0)

  const [showSequenceManager, setShowSequenceManager] = useState(false)
  const [showCompanion, setShowCompanion] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)

  // PeerJS Connection State References
  const [companionStatus, setCompanionStatus] = useState('Checking...')

  // Cache complex states to refs to eliminate closure stale-data bugs inside async WebRTC event listeners
  const stateRef = useRef({ project, selectedSequenceIndex, playbackTime, isPlaying, isHoldingTriggers })
  useEffect(() => {
    stateRef.current = { project, selectedSequenceIndex, playbackTime, isPlaying, isHoldingTriggers }
  }, [project, selectedSequenceIndex, playbackTime, isPlaying, isHoldingTriggers])

  const handleModeChange = (selectedIndex, selectedOption) => {
    if (selectedOption === 'Live') setShowSidebar(false)
    else setShowSidebar(true)
    setSelectedMode(selectedOption)
  }

  const openSequenceManager = () => setShowSequenceManager(true)
  const closeSequenceManager = () => setShowSequenceManager(false)
  const openCompanion = () => setShowCompanion(true)
  const closeCompanion = () => setShowCompanion(false)
  const changeSequence = (index) => {
    setSelectedSequenceIndex(index)
    setIsPlaying(false)
    setIsResetPlayback(true)
    if (stateRef.current.project) {
      setProject(getProjectByName(stateRef.current.project.name))
    }
  }

  // --- WebSocket ---
  const wsRef = useRef(null);
  const telemetryInterval = useRef(null);
  const connect = useCallback(() => {
    setTimeout(() => {
      console.log("Attempting to connect to WebSocket...");

      const ws = new WebSocket('ws://localhost:8081');

      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Connected to Relay!');
        setCompanionStatus('OK');

        // Join the session room
        ws.send(JSON.stringify({ type: 'join', roomId: project.websocketRoomId }));

        // Start Telemetry loop
        telemetryInterval.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'telemetry',
              payload: {
                isPlaying: stateRef.current.isPlaying,
                isHoldingTriggers: stateRef.current.isHoldingTriggers,
              }
            }));
          }
        }, 300);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'action') {
            handleAction(msg.action, msg.data);
          }
        } catch (err) {
          console.error('Failed to parse remote action:', err);
        }
      };

      ws.onclose = () => {
        console.log('WS Connection closed. Retrying in 5s...');
        setCompanionStatus('Disconnected');
        if (telemetryInterval.current) clearInterval(telemetryInterval.current);

        // Auto-reconnect logic
        setTimeout(connect, 5000);
      };

      ws.onerror = (err) => {
        console.error('WS Error:', err);
        ws.close();
      };
    }, 1500);
  }, [project]);

  useEffect(() => {
    connect()

    // Cleanup on component unmount
    return () => {
      if (telemetryInterval.current) clearInterval(telemetryInterval.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  const handleAction = (action, data) => {
    const current = stateRef.current;

    switch (action) {
      case 'PLAY':
        setIsPlaying(true);
        setIsResetPlayback(false);
        break;
      case 'PAUSE':
        setIsPlaying(false);
        setIsResetPlayback(false);
        break;
      case 'RESET':
        setIsResetPlayback(true);
        setIsPlaying(false);
        break;
      case 'NEXT_SEQUENCE':
        if (current.project?.sequences && current.selectedSequenceIndex < current.project.sequences.length - 1) {
          changeSequence(current.selectedSequenceIndex + 1);
        }
        break;
      case 'PREV_SEQUENCE':
        if (current.selectedSequenceIndex > 0) {
          changeSequence(current.selectedSequenceIndex - 1);
        }
        break;
      case 'SET_SEQUENCE_INDEX':
        if (current.project?.sequences && data.index >= 0 && data.index < current.project.sequences.length) {
          changeSequence(data.index);
        }
        break;
      case 'SET_HOLD_TRIGGERS':
        console.log("hold")
        setIsHoldingTriggers(prevState => !prevState);
        break;
      default:
        console.warn('Unhandled remote action identifier:', action);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const projectName = params.get('project')
    const loadedProject = projectName ? getProjectByName(projectName) : null

    setProject(loadedProject)
    setSelectedSequenceIndex(0)

    const loadCompanion = async () => {
      if (!loadedProject) return
      setProject(prev => prev ? {
        ...prev,
        companion: { ...(prev.companion || {}), companionStatus: 'Checking...', companionConfig: null }
      } : prev)
      const updated = await refreshCompanionForProject(loadedProject)
      if (updated) setProject(updated)
    }

    loadCompanion()
  }, [location.search])

  const companionInfo = (() => {
    const httpStatus = project?.companion?.companionStatus
    if (!httpStatus || httpStatus === 'Checking...') return { text: 'Connecting...', tone: 'checking' }
    if (httpStatus === 'Offline')              return { text: 'Bad IP Address',   tone: 'error'    }
    if (httpStatus === 'Failed to connect')    return { text: 'Bad Config',       tone: 'error'    }
    if (httpStatus === 'Unknown')              return { text: 'Not Configured',   tone: 'checking' }
    if (httpStatus === 'OK') {
      if (companionStatus === 'OK')            return { text: 'Connected',        tone: 'ok'       }
      if (companionStatus === 'Disconnected')  return { text: 'Websocket Error',  tone: 'checking' }
      return                                          { text: 'Connecting...',    tone: 'checking' }
    }
    return { text: 'Unknown', tone: 'checking' }
  })()

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
        onSequenceChange={changeSequence}
        onOpenSequenceManager={openSequenceManager}
        onOpenCompanion={openCompanion}
        selectedSequenceIndex={selectedSequenceIndex}
        project={project}
        companionStatus={companionInfo.text}
        isPlaying={isPlaying}
        currentMode={selectedMode}
      />

      <BetaBanner />

      <div style={{ display: 'flex', alignItems: 'flex-start', height: 'calc(100vh - 50px)', width: '100%', overflow: 'hidden' }}>
        <Sidebar isVisible={showSidebar}>
          <PagePanel project={project} />
        </Sidebar>

        <PlayControls
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          setIsResetPlayback={setIsResetPlayback}
          time={playbackTime}
          isSidebarVisible={showSidebar}
          setHold={setIsHoldingTriggers}
          isHoldingTriggers={isHoldingTriggers}
          enableKeyboardShortcuts={!showCompanion && !showSequenceManager}
        />

        <TimelinePanel
          project={project}
          selectedSequenceIndex={selectedSequenceIndex}
          isSidebarVisible={showSidebar}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          isResetPlayback={isResetPlayback}
          setPlaybackTime={setPlaybackTime}
          isHoldingTriggers={isHoldingTriggers}
          canEdit={!isPlaying && selectedMode === 'Edit' && !showCompanion}
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
          statusText={companionInfo.text}
          statusTone={companionInfo.tone}
        />
      )}
    </div>
  )
}