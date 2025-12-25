import FloatingWindow from "./components/floating/FloatingWindow";
import MenuBarPopover from "./components/popover/MenuBarPopover";

function App() {
  // Determine which view to show based on window label
  const isPopover = window.location.search.includes('popover');

  return (
    <div className="w-screen h-screen flex items-center justify-center">
      {isPopover ? <MenuBarPopover /> : <FloatingWindow />}
    </div>
  );
}

export default App;
