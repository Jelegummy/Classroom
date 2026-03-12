import AppLayout from '@/components/Layouts/App'
import DashboardLayout from '@/components/Layouts/Dashboard'
import CreateUser from '@/features/admin/components/create-user'
import DeleteUser from '@/features/admin/components/delete-user'
import { getAllUsers } from '@/services/user'
import { useQuery } from '@tanstack/react-query'

export default function ManagementUser() {
  const { data: users, isLoading } = useQuery({
    queryKey: ['getAllUsers'],
    queryFn: () => getAllUsers(),
    refetchOnWindowFocus: false,
    refetchInterval: 1000,
  })

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'badge-error text-white'
      case 'TEACHER':
        return 'badge-info text-white'
      case 'STUDENT':
      default:
        return 'badge-ghost'
    }
  }

  return (
    <AppLayout>
      <DashboardLayout>
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                จัดการผู้ใช้งาน
              </h2>
              <p className="text-sm text-gray-500">
                รายชื่อและข้อมูลผู้ใช้งานทั้งหมดในระบบ
              </p>
            </div>
            <div>
              <CreateUser />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="table w-full">
              <thead className="bg-primary text-sm text-white">
                <tr>
                  <th className="font-semibold">ชื่อ - นามสกุล</th>
                  <th className="font-semibold">อีเมล</th>
                  <th className="font-semibold">บทบาท</th>
                  <th className="text-right font-semibold">จัดการ</th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                      <span className="loading loading-spinner loading-md"></span>
                    </td>
                  </tr>
                ) : users && users.length > 0 ? (
                  users.map(user => (
                    <tr key={user.id} className="hover">
                      <td>
                        <div className="font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                      </td>
                      <td className="text-gray-600">{user.email}</td>
                      <td>
                        <div
                          className={`badge badge-sm font-medium ${getRoleBadgeColor(user.role)}`}
                        >
                          {user.role}
                        </div>
                      </td>
                      <td className="text-right">
                        <DeleteUser userId={user.id} email={user.email} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                      ไม่พบข้อมูลผู้ใช้งาน
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </DashboardLayout>
    </AppLayout>
  )
}
