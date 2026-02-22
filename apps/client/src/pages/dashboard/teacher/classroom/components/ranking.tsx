type RankingProps = {
  points: number[]
  names: string[]
  roles: string[]
}

export default function Ranking({ points, names, roles }: RankingProps) {
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
    <div className="mx-auto mt-5 max-w-4xl space-y-8 p-6">
      <div className="flex items-end justify-center gap-6">
        {podiumOrder.map(i => {
          const user = top3[i]
          if (!user) return null

          const isFirst = i === 0

          return (
            <div
              key={i}
              className={`flex w-56 flex-col items-center rounded-xl border p-6 text-center shadow transition-transform duration-300 ${
                isFirst
                  ? '-translate-y-8 border-orange-400 bg-orange-50 hover:-translate-y-10'
                  : '-translate-y-2 border-gray-200 bg-white hover:-translate-y-4'
              } `}
            >
              {isFirst && <div className="mb-2 text-2xl">👑</div>}

              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                  `${user?.name || ''}`.trim() || 'User',
                )}&background=random`}
                alt="Profile"
                className="mb-3 h-14 w-14 rounded-full bg-gray-200 object-cover"
              />

              <p
                className={`text-lg font-bold ${
                  isFirst ? 'text-orange-500' : 'text-blue-500'
                }`}
              >
                {user.point} Pt
              </p>

              <p className="font-semibold">{user.name}</p>
            </div>
          )
        })}
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        {rest.map((user, index) => (
          <div
            key={index}
            className="flex items-center justify-between border-b p-4 last:border-none"
          >
            <div className="flex items-center gap-4">
              <span className="flex h-8 w-8 items-center justify-center rounded bg-gray-100 text-sm">
                {index + 4}
              </span>

              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                  `${user?.name || ''}`.trim() || 'User',
                )}&background=random`}
                alt="Profile"
                className="h-10 w-10 rounded-full bg-gray-200 object-cover"
              />

              <div>
                <p className="font-medium">{user.name}</p>
              </div>
            </div>

            <p className="font-semibold">{user.point} Pt</p>
          </div>
        ))}
      </div>
    </div>
  )
}
