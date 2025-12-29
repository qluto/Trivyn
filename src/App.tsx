import { useEffect } from "react";
import FloatingWindow from "./components/floating/FloatingWindow";
import MenuBarPopover from "./components/popover/MenuBarPopover";
import './i18n';

function App() {
  // Determine which view to show based on window label
  const isPopover = window.location.search.includes('popover');

  // Ensure containers fill window completely
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.width = '100%';
    document.documentElement.style.height = '100%';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    const root = document.getElementById('root');
    if (root) {
      root.style.width = '100%';
      root.style.height = '100%';
    }
  }, []);

  return (
    <>
      {isPopover ? <MenuBarPopover /> : <FloatingWindow />}
    </>
  );
}

export default App;
