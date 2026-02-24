import { getAnnounce } from '@/services/announce'
import { useQueries } from '@tanstack/react-query'
import { MoreVertical, FileText } from 'lucide-react'
import Image from 'next/image'

export default function MainTasks({ announcesId }: { announcesId: string[] }) {
  const queries = useQueries({
    queries: announcesId.map(id => ({
      queryKey: ['getAnnounce', id],
      queryFn: () => getAnnounce(id),
      enabled: !!id,
    })),
  })

  const announces = queries
    .map(q => q.data)
    .filter(Boolean)
    .flat()
    .sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      {announces.length ? (
        announces.map((a: any) => (
          <div key={a.id} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={a.creator?.avatar ?? '/catIcon.jpg'}
                  className="h-10 w-10 rounded-full"
                />
                <div>
                  <p className="text-sm font-semibold">{a.creator?.name}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <MoreVertical className="text-gray-500" />
            </div>

            {a.title && (
              <h3 className="mb-1 text-lg font-semibold">{a.title}</h3>
            )}

            <p className="mb-3 text-gray-800">{a.message}</p>

            {a.filePdf && (
              <a
                href={a.filePdf}
                target="_blank"
                className="flex w-fit items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
              >
                <FileText size={16} />
                <span>PDF</span>
              </a>
            )}
            {/* fix */}
          </div>
        ))
      ) : (
        <p className="text-center text-gray-400">ไม่มีประกาศในขณะนี้</p>
      )}
    </div>
  )
}

//TODO: fix pdf file and connected backend (not well defined) || Just mock data
