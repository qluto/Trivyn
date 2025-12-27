import FloatingWindow from "./components/floating/FloatingWindow";
import MenuBarPopover from "./components/popover/MenuBarPopover";
import './i18n';

function App() {
  // Determine which view to show based on window label
  const isPopover = window.location.search.includes('popover');

  return (
    <div className="w-screen h-screen">
      {isPopover ? <MenuBarPopover /> : (
        <div className="w-full h-full flex items-center justify-center">
          <FloatingWindow />
        </div>
      )}
    </div>
  );
}

export default App;
