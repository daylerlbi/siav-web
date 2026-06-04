import Sidebar from './Sidebar'
import { Outlet } from 'react-router-dom'
import { SidebarProvider } from '../context/SidebarContext'
import { useLocation } from 'react-router-dom'
import Topbar from '../components/Topbar'
import ProjectSidebar from './temp/ProjectSidebar'
import HelpButton from '../components/HelpButton'
const Layout = () => {
  const location = useLocation()
  const getEsDocente = () => {
    try {
      const token = localStorage.getItem('googleToken')
      if (!token) return false
      const payload = JSON.parse(atob(token.split('.')[1]))
      return (payload.role || '').toLowerCase() === 'docente'
    } catch { return false }
  }
  const esDocente = getEsDocente()
  const projectRoutes = [
    "/listado-informes",
    "/listado-proyectos",
    "/listado-sustentaciones",
    "/estado-proyecto",
    "/seguimiento",
    "/informes",
  ]
  const isProjectRoute = !esDocente && (
    location.pathname.startsWith("/listado-proyectos") ||
    location.pathname.startsWith("/listado-informes") ||
    location.pathname.startsWith("/listado-sustentaciones") ||
    projectRoutes.includes(location.pathname)
  )
  return (
    <SidebarProvider>
      <div className='min-h-screen min-w-fit flex flex-col'>
        {
          isProjectRoute ? <ProjectSidebar /> :
            <>
              <Topbar />
              <div className='w-full flex flex-row flex-grow'>
                <div className='flex-shrink-0'>
                  <Sidebar />
                </div>
                <div className='flex-1 p-6'>
                  <Outlet />
                </div>
              </div>
            </>
        }
        <HelpButton />
      </div>
    </SidebarProvider>
  )
}
export default Layout
