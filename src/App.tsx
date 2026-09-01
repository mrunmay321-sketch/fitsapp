import { useState } from 'react';
import { WardrobeProvider } from './context/WardrobeContext';
import MobileFrame, { type Tab } from './components/MobileFrame';
import HomeDashboard from './screens/HomeDashboard';
import DigitalCloset from './screens/DigitalCloset';
import BuyRecommendations from './screens/BuyRecommendations';
import StoreScanner from './screens/StoreScanner';
import BodyMatrix from './screens/BodyMatrix';
import Settings from './screens/Settings';

function App() {
  const [tab, setTab] = useState<Tab>('home');

  return (
    <WardrobeProvider>
      <MobileFrame active={tab} onNavigate={setTab}>
        {tab === 'home' && <HomeDashboard />}
        {tab === 'closet' && <DigitalCloset />}
        {tab === 'buy' && <BuyRecommendations />}
        {tab === 'scanner' && <StoreScanner />}
        {tab === 'body' && <BodyMatrix />}
        {tab === 'settings' && <Settings />}
      </MobileFrame>
    </WardrobeProvider>
  );
}

export default App;
