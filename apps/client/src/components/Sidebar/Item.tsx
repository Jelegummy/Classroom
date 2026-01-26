import Link from 'next/link'

type Props = {
  title: string
  route: string
  currentRoute: string
  icon: React.ReactNode
  isOpen: boolean
  onClick?: () => void
}

const SidebarItem = ({
  title,
  route,
  currentRoute,
  icon,
  isOpen,
  onClick,
}: Props) => {
  return (
    <Link
      href={route}
      onClick={onClick}
      className={`flex items-center rounded-xl p-2 transition-all ${isOpen ? 'justify-start gap-2' : 'justify-center'} ${
        route === currentRoute
          ? 'bg-[#1F57CF] text-white'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {icon}
      {isOpen && <span>{title}</span>}
    </Link>
  )
}

export default SidebarItem
