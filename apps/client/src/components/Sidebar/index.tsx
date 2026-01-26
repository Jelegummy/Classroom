import SidebarDesktop from './Desktop'
import SidebarMobile from './Mobile'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

const Sidebar = ({ isOpen, onToggle }: SidebarProps) => {
  return (
    <>
      <SidebarDesktop isOpen={isOpen} onToggle={onToggle} />

      <div className="drawer md:hidden">
        <input id="sidebar-drawer" type="checkbox" className="drawer-toggle" />

        <div className="drawer-content" />

        <SidebarMobile isOpen={isOpen} onClose={onToggle} />
      </div>
    </>
  )
}

export default Sidebar
