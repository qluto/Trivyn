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
    <div className="w-full h-full overflow-hidden">
      {isPopover ? <MenuBarPopover /> : (
        <div className="w-full h-full flex items-center justify-center overflow-hidden">
          <FloatingWindow />
        </div>
      )}
    </div>
  );
}

export default App;
