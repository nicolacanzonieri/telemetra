import { useState } from 'react';
import { LatLng } from 'leaflet';

interface Gate {
  p1: LatLng;
  p2: LatLng;
}

// PAGES
import StartMenuPage from './pages/StartMenuPage.tsx'
import SettingsPage from './pages/SettingsPage.tsx'
import TrackSelectionPage from './pages/TrackSelectionPage.tsx';
import EndpointSelectionPage from './pages/EndpointSelectionPage.tsx';

function App() {
  // Pages logic
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTrackSelectionOpen, setIsTrackSelectionOpen] = useState(false);
  const [isEndpointPageOpen, setIsEndpointPageOpen] = useState(false);

  // Track logic
  const [trackType, setTrackType] = useState<'Circuit' | 'Sprint' | null>(null);
  const [startGate, setStartGate] = useState<Gate | null>(null);
  const [finishGate, setFinishGate] = useState<Gate | null>(null);
  const [settingStep, setSettingStep] = useState<'start' | 'finish'>('finish');

  const handleTrackTypeSelection = (type: 'Circuit' | 'Sprint') => {
    setTrackType(type);
    setStartGate(null);
    setFinishGate(null);

    // If user selected a 'Sprint' type track then we have to set the 'start' point first and then
    // the 'finish' point. If we are instead setting a 'Circuit' type track then we only need the 
    // 'finish' point
    setSettingStep(type === 'Sprint' ? 'start' : 'finish');
    
    // Open the endpoint selection page
    setIsEndpointPageOpen(true);
  };

  const handleConfirmGate = (p1: LatLng, p2: LatLng) => {
    if (settingStep === 'start') {
      setStartGate({ p1, p2 });
      setSettingStep('finish');
    } else {
      setFinishGate({ p1, p2 });
      setIsEndpointPageOpen(false);
    }
  };

  return (
    <div className='relative'>
      <StartMenuPage onOpenSettings={() => setIsSettingsOpen(true)} onOpenSession={() => setIsTrackSelectionOpen(true)}/>

      { isSettingsOpen && (
        <SettingsPage onCloseSettings={() => setIsSettingsOpen(false)}/>
      )}

      { isTrackSelectionOpen && (
        <TrackSelectionPage onCloseTrackSelection={() => setIsTrackSelectionOpen(false)} onClickTrackType={handleTrackTypeSelection}/>
      )}
      
      { isEndpointPageOpen && (
        <EndpointSelectionPage onClose={() => {setIsEndpointPageOpen(false)}} onConfirm={handleConfirmGate} title={settingStep === 'start' ? "Set Start Line" : "Set Finish Line"}/>
      )}

    </div>
  )
}

export default App
