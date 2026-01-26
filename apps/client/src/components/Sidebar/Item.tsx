import Link from 'next/link'

type SidebarItemProps = {
  title: string
  route: string
  currentRoute: string
  icon: React.ReactNode
  isOpen: boolean
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  title,
  route,
  currentRoute,
  icon,
  isOpen,
}) => {
  const active = route === currentRoute

  return (
    <Link
      href={route}
      className={`flex items-center rounded-xl p-2 transition-all ${isOpen ? 'justify-start gap-2' : 'justify-center'} ${
        active
          ? 'border-2 bg-[#1F57CF] text-white shadow-inset-sm'
          : 'bg-white text-zinc-500 hover:bg-slate-200 hover:text-[#000000]'
      } `}
    >
      {icon}
      {isOpen && <p className="text-md font-normal">{title}</p>}
    </Link>
  )
}

export default SidebarItem
