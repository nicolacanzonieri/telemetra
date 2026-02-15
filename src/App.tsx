import { use, useState } from 'react';

// PAGES
import StartMenuPage from './pages/StartMenuPage.tsx'
import SettingsPage from './pages/SettingsPage.tsx'
import TrackSelectionPage from './pages/TrackSelectionPage.tsx';
import EndpointSelectionPage from './pages/EndpointSelectionPage.tsx';

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTrackSelectionOpen, setIsTrackSelectionOpen] = useState(false);
  const [isEndpointPageOpen, setIsEndpointPageOpen] = useState(false);

  return (
    <div className='relative'>
      <StartMenuPage onOpenSettings={() => setIsSettingsOpen(true)} onOpenSession={() => setIsTrackSelectionOpen(true)}/>

      { isSettingsOpen && (
        <SettingsPage onCloseSettings={() => setIsSettingsOpen(false)}/>
      )}

      { isTrackSelectionOpen && (
        <TrackSelectionPage onCloseTrackSelection={() => setIsTrackSelectionOpen(false)} onClickTrackType={() => setIsEndpointPageOpen(true)}/>
      )}
      
      { isEndpointPageOpen && (
        <EndpointSelectionPage onClose={() => {setIsEndpointPageOpen(false)}} onConfirm={() => {setIsEndpointPageOpen(false)}}/>
      )}

    </div>
  )
}

export default App
