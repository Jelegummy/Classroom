import { RankingProps } from '../types'

export default function RankingStudent({ points, names, roles }: RankingProps) {
  const combined = points
    .map((pt, i) => ({
      point: pt,
      name: names[i] ?? 'Unknown',
      role: roles[i] ?? 'STUDENT',
    }))
    .filter(user => user.role !== 'TEACHER')
    .sort((a, b) => b.point - a.point)

  const top3 = combined.slice(0, 3)
  const rest = combined.slice(3)

  const podiumOrder = [1, 0, 2]

  return (
    <div className="mx-auto mt-2 max-w-4xl space-y-6 p-4 md:mt-5 md:space-y-8 md:p-6">
      <div className="flex items-end justify-center gap-2 md:gap-6">
        {podiumOrder.map(i => {
          const user = top3[i]
          if (!user) return null

          const isFirst = i === 0

          return (
            <div
              key={i}
              className={`flex w-[30%] flex-col items-center rounded-lg border p-2 text-center shadow transition-transform duration-300 md:w-56 md:rounded-xl md:p-6 ${
                isFirst
                  ? '-translate-y-4 border-orange-400 bg-orange-50 hover:-translate-y-6 md:-translate-y-8 md:hover:-translate-y-10'
                  : '-translate-y-1 border-gray-200 bg-white hover:-translate-y-2 md:-translate-y-2 md:hover:-translate-y-4'
              } `}
            >
              {isFirst && (
                <div className="mb-1 text-sm md:mb-2 md:text-2xl">👑</div>
              )}

              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                  `${user?.name || ''}`.trim() || 'User',
                )}&background=random`}
                alt="Profile"
                className="mb-1 h-8 w-8 rounded-full bg-gray-200 object-cover md:mb-3 md:h-14 md:w-14"
              />

              <p
                className={`text-xs font-bold md:text-lg ${
                  isFirst ? 'text-orange-500' : 'text-blue-500'
                }`}
              >
                {user.point} Pt
              </p>

              <p className="line-clamp-1 w-full text-[10px] font-semibold md:text-base">
                {user.name}
              </p>
            </div>
          )
        })}
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        {rest.map((user, index) => (
          <div
            key={index}
            className="flex items-center justify-between border-b p-3 last:border-none md:p-4"
          >
            <div className="flex items-center gap-3 md:gap-4">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-xs md:h-8 md:w-8 md:text-sm">
                {index + 4}
              </span>

              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                  `${user?.name || ''}`.trim() || 'User',
                )}&background=random`}
                alt="Profile"
                className="h-8 w-8 rounded-full bg-gray-200 object-cover md:h-10 md:w-10"
              />

              <div>
                <p className="text-sm font-medium md:text-base">{user.name}</p>
              </div>
            </div>

            <p className="text-sm font-semibold md:text-base">
              {user.point} Pt
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
