import { useState } from 'react';
import { LatLng } from 'leaflet';
import { db, type Track } from './db/database.ts'

interface Gate {
  p1: LatLng;
  p2: LatLng;
}

// PAGES
import StartMenuPage from './pages/StartMenuPage.tsx'
import SettingsPage from './pages/SettingsPage.tsx'
import TrackSelectionPage from './pages/TrackSelectionPage.tsx';
import EndpointSelectionPage from './pages/EndpointSelectionPage.tsx';
import OnBoardPage from './pages/OnboardPage.tsx';

function App() {
  // Pages logic
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTrackSelectionOpen, setIsTrackSelectionPageOpen] = useState(false);
  const [isEndpointPageOpen, setIsEndpointPageOpen] = useState(false);
  const [isOnBoardPageOpen, setIsOnBoardPageOpen] = useState(false);

  // Track logic
  const [_trackType, setTrackType] = useState<'Circuit' | 'Sprint' | null>(null);
  const [_startGate, setStartGate] = useState<Gate | null>(null);
  const [_finishGate, setFinishGate] = useState<Gate | null>(null);
  const [settingStep, setSettingStep] = useState<'start' | 'finish'>('finish');

  const handleTrackTypeSelection = (type: 'Circuit' | 'Sprint') => {
    setTrackType(type);
    setStartGate(null);
    setFinishGate(null);

    // If user selected a 'Sprint' type track then we have to set the 'start' point first and then
    // the 'finish' point. If we are instead setting a 'Circuit' type track then we only need the 
    // 'finish' point
    setSettingStep(type === 'Sprint' ? 'start' : 'finish');
    
    setIsTrackSelectionPageOpen(false);
    // Open the endpoint selection page
    setIsEndpointPageOpen(true);
  };

  const handleConfirmGate = async (p1: LatLng, p2: LatLng) => {
    const trackName = prompt("ENTER TRACK NAME:") || "New Track";

    const newTrack: Track = {
      name: trackName.toUpperCase(),
      type: _trackType!,
      finishGate: { 
        p1: { lat: p1.lat, lng: p1.lng }, 
        p2: { lat: p2.lat, lng: p2.lng } 
      },
      createdAt: Date.now()
    };

    if (settingStep === 'start') {
      newTrack.startGate = {p1, p2};
      setStartGate({ p1, p2 });
      setSettingStep('finish');
    } else {
      setFinishGate({ p1, p2 });
      setIsEndpointPageOpen(false);
      setIsOnBoardPageOpen(true);
    }

    await db.tracks.add(newTrack);
  };

  const handleSelectedTrack = async (track: Track) => {
    setIsTrackSelectionPageOpen(false);
    setIsOnBoardPageOpen(true);
  };

  return (
    <div className='relative'>
      { isStartMenuOpen && (
        <StartMenuPage 
          onOpenSettings={() => setIsSettingsOpen(true)} 
          onOpenSession={() => {
            setIsTrackSelectionPageOpen(true)
            setIsStartMenuOpen(false);
          }}/>
      )}

      { isSettingsOpen && (
        <SettingsPage onCloseSettings={() => setIsSettingsOpen(false)}/>
      )}

      { isTrackSelectionOpen && (
        <TrackSelectionPage 
          onCloseTrackSelection={() => {
            setIsStartMenuOpen(true);
            setIsTrackSelectionPageOpen(false)
          }} 
          onClickTrackType={handleTrackTypeSelection}
          onSelectSavedTrack={handleSelectedTrack}/>
      )}
      
      { isEndpointPageOpen && (
        <EndpointSelectionPage 
          onClose={() => {
            setIsTrackSelectionPageOpen(true);
            setIsEndpointPageOpen(false)
          }} 
          onConfirm={handleConfirmGate} 
          title={settingStep === 'start' ? "Set Start Line" : "Set Finish Line"}/>
      )}

      { isOnBoardPageOpen && (
        <OnBoardPage 
          onCloseOnboardPage={() => {
            setIsStartMenuOpen(true);
            setIsEndpointPageOpen(false);
            setIsOnBoardPageOpen(false);
          }}/>
      )}

    </div>
  )
}

export default App
