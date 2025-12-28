interface DraggableHeaderProps {
  children: React.ReactNode;
}

export default function DraggableHeader({ children }: DraggableHeaderProps) {
  return (
    <div
      className="cursor-move select-none"
      data-tauri-drag-region
    >
      {children}
    </div>
  );
}
