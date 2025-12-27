import Link from 'next/link'

type SidebarItemProps = {
  title: string
  route: string
  currentRoute: string
  icon: React.ReactNode
} & React.HTMLProps<HTMLButtonElement>

const SidebarItem: React.FC<SidebarItemProps> = ({
  title,
  route,
  currentRoute,
  icon,
}) => {
  return (
    <Link
      href={route}
      className={`flex flex-row items-center justify-start gap-2 rounded-xl p-2 ${route === currentRoute ? 'border-2 bg-[#6b92df] text-white shadow-inset-sm' : 'bg-white text-zinc-500'} transition-all hover:bg-slate-200 hover:text-[#6b92df]`}
    >
      {icon}
      <p className="text-md font-normal">{title}</p>
    </Link>
  )
}

export default SidebarItem
