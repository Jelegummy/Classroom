import SidebarDesktop from './Desktop'
import SidebarMobile from './Mobile'

const Sidebar = () => {
  return (
    <div className="drawer h-screen w-0 rounded-r-lg md:min-w-[240px]">
      <input
        id="sidebar-drawer"
        type="checkbox"
        className="drawer-toggle"
        title="hello"
      />
      <SidebarDesktop />
      <SidebarMobile />
    </div>
  )
}

export default Sidebar
