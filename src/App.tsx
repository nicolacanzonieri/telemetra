import { useState } from 'react';

// PAGES
import StartMenuPage from './pages/StartMenuPage.tsx'
import SettingsPage from './pages/SettingsPage.tsx'
import TrackSelectionPage from './pages/TrackSelectionPage.tsx';


function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTrackSelectionOpen, setIsTrackSelectionOpen] = useState(false);

  return (
    <div className='relative'>
      <StartMenuPage onOpenSettings={() => setIsSettingsOpen(true)} onOpenSession={() => setIsTrackSelectionOpen(true)}/>

      { isSettingsOpen && (
        <SettingsPage onCloseSettings={() => setIsSettingsOpen(false)}/>
      )}

      { isTrackSelectionOpen && (
        <TrackSelectionPage onCloseTrackSelection={() => setIsTrackSelectionOpen(false)}/>
      )}
      
    </div>
  )
}

export default App
