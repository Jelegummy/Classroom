import AppLayout from '@/components/Layouts/App'
import DashboardLayout from '@/components/Layouts/Dashboard'
import NavbarContent from '@/components/NavbarContent'

export default function Page() {
  return (
    <>
      <AppLayout>
        <DashboardLayout>
          <NavbarContent></NavbarContent>
          <div className="p-4">
            <div>Classroom Dashboard</div>
            <div> sdksdnlandf</div>
          </div>
        </DashboardLayout>
      </AppLayout>
    </>
  )
}
