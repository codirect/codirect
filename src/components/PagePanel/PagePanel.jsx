import React from 'react'
import ItemNavigator from '../ItemNavigator/ItemNavigator'
import './PagePanel.css'
import PillSelector from '../PillSelector/PillSelector'
import CompanionControl from '../CompanionControl/CompanionControl'
import { Grid2X2Icon, ListIcon } from 'lucide-react'
import { updateProject } from '../../utils/projectUpdater'
import { getStyleForIndex } from '../../utils/colorIndex'

function PagePanel({ project }) {
  const [companionPages, setCompanionPages] = React.useState({})
  const [selectedPageControls, setSelectedPageControls] = React.useState([])
  const [layout, setLayout] = React.useState('list')
  const [activePageIndex, setActivePageIndex] = React.useState(0);

  const parseControls = React.useCallback((pageData, pageIndex) => {
    const controlsCols = pageData?.controls || {}
    const parsed = []

    Object.entries(controlsCols).forEach(([col, columns]) => {
      Object.entries(columns).forEach(([row, control]) => {
        if (control.type === 'button') {
          parsed.push({
            name: control.style?.text || 'Untitled',
            type: control.type || 'button',
            row: parseInt(row, 10),
            col: parseInt(col, 10),
            pageIndex: pageIndex
          })
        }
      })
    })

    return parsed
  }, [])

  const handleLayoutChange = (index) => {
    if (!project || !project.name) return
    updateProject(project.name, (proj) => {
      const layout = index === 0 ? 'list' : 'grid'
      const updated = { ...proj, prefs: { ...proj.prefs, layout: layout } }
      return updated
    })

    setLayout(index === 0 ? 'list' : 'grid')
  }

  const handlePageSelect = React.useCallback((index, [pageId, pageInfo]) => {
    const pageData = companionPages[pageId]
    setSelectedPageControls(parseControls(pageData, pageInfo.pageIndex))
  }, [companionPages, parseControls])

  const handleControlDragStart = React.useCallback((control) => (event) => {
    const payload = {
      type: 'companion-control',
      color: getStyleForIndex(control.index).backgroundColor,
      row: control.row,
      col: control.col,
      pageIndex: control.pageIndex
    }

    event.dataTransfer.setData('application/json', JSON.stringify(payload))
    event.dataTransfer.effectAllowed = 'copy'
    const img = new Image()
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    event.dataTransfer.setDragImage(img, 0, 0)
  }, [])

  React.useEffect(() => {
    const pages = project?.companion?.companionConfig?.pages || {}
    setCompanionPages(pages)

    const firstPageId = Object.keys(pages)[0] || null
    if (firstPageId) {
      setSelectedPageControls(parseControls(pages[firstPageId], 0))
    }

    const layout = project?.prefs?.layout || 'list'
    setLayout(layout)

    setActivePageIndex(0)
  }, [project, parseControls])

  const pageEntries = Object.entries(companionPages)
  const pageLabels = pageEntries.map(([id, data]) => data.name || `Page ${id}`)
  const pageIds = pageEntries.map(([id]) => id)

  const isGrid = layout === 'grid'

  return (
    <div className='page-panel'>
      <div className='toolbar'>
        <ItemNavigator
          width='180px'
          items={pageLabels}
          selectedIndex={activePageIndex}
          onItemSelect={(index) => {
            setActivePageIndex(index);
            handlePageSelect(index, [pageIds[index], { pageIndex: index }]);
          }}
        />
        <PillSelector options={[
          <ListIcon size={16} />
          ,
          <Grid2X2Icon size={16} />
        ]} onChange={handleLayoutChange} initialSelectedIndex={isGrid ? 1 : 0} />
      </div>

      <div className={isGrid ? 'grid' : 'list'}>
        {selectedPageControls.length > 0 ? (
          selectedPageControls.map((control, index) => (
            <CompanionControl
              key={index}
              index={index}
              name={control.name}
              variant={isGrid ? 'card' : 'list'}
              draggable
              onDragStart={handleControlDragStart({ ...control, index })}
            />
          ))
        ) : (
          <p style={{ color: '#888', fontStyle: 'italic' }}>No controls found.</p>
        )}
      </div>
    </div>
  )
}

export default PagePanel