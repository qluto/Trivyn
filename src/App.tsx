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
    }
  }, [isPopover]);

  return (
    <>
      {isPopover ? <MenuBarPopover /> : <FloatingWindow />}
    </>
  );
}

export default App;
