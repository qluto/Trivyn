import { useEffect } from "react";
import FloatingWindow from "./components/floating/FloatingWindow";
import MenuBarPopover from "./components/popover/MenuBarPopover";
import './i18n';

function App() {
  // Determine which view to show based on window label
  const isPopover = window.location.search.includes('popover');

  // Disable scrolling for floating window
  useEffect(() => {
    if (!isPopover) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      // For popover, allow content to fit its size
      document.documentElement.style.height = 'fit-content';
      document.body.style.height = 'fit-content';
      const root = document.getElementById('root');
      if (root) {
        root.style.height = 'fit-content';
      }
    }
  }, [isPopover]);

  return (
    <>
      {isPopover ? <MenuBarPopover /> : <FloatingWindow />}
    </>
  );
}

export default App;
