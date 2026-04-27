import React, { useState, useEffect } from 'react'
import {
  Menu as LucideMenu,
  X,
  BookPlus,
  UserRoundCog,
  LibraryBig
} from 'lucide-react'
import { PiStudent } from 'react-icons/pi'
import { MdGroups } from 'react-icons/md'
import { PiProjectorScreenChart } from 'react-icons/pi'
import Menu from '../components/sidebar/Menu'
import { useSidebar } from '../context/SidebarContext'
import { getBackendUrl } from '../lib/controllers/endpoints'

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true)
  const { selectedMenu, setSelectedMenu, selectedOption, setSelectedOption } =
    useSidebar()

  const backendUrl = getBackendUrl()
  const [programas, setProgramas] = useState([])
  const [userRole, setUserRole] = useState(null)
  const [googleRole, setGoogleRole] = useState(null) // Rol dentro del token de Google (ej: 'Director')

  const detectarRol = () => {
    const userInfo = localStorage.getItem('userInfo')
    const googleToken = localStorage.getItem('googleToken')

    if (userInfo) {
      try {
        const { rol } = JSON.parse(userInfo)
        if (rol.includes('SUPERADMIN') || rol.includes('SUPER_ADMIN')) {
          return 'ROLE_SUPERADMIN'
        } else if (
          (rol.includes('ADMIN') || rol === 'ROLE_ADMIN') &&
          !rol.includes('SUPER')
        ) {
          return 'ROLE_ADMIN'
        } else {
          return rol
        }
      } catch (error) {
        console.error('Error al parsear userInfo:', error)
        return null
      }
    } else if (googleToken) {
      // Decodificar el JWT para obtener el rol interno (Director, Estudiante, etc.)
      try {
        const payload = JSON.parse(atob(googleToken.split('.')[1]))
        console.log('Payload del token Google:', payload)
        setGoogleRole(payload.role || payload.rol || null)
      } catch (e) {
        console.error('Error al decodificar googleToken:', e)
      }
      return 'ROLE_GOOGLE'
    }
    return null
  }

  useEffect(() => {
    const rol = detectarRol()
    console.log('Rol detectado al montar:', rol)
    setUserRole(rol)

    const handleStorageChange = () => {
      const nuevoRol = detectarRol()
      console.log('Cambio en localStorage detectado, nuevo rol:', nuevoRol)
      setUserRole(nuevoRol)
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('googleTokenGuardado', handleStorageChange)

    // Polling de respaldo: verifica cada 300ms durante 3 segundos
    let intentos = 0
    const interval = setInterval(() => {
      intentos++
      const rol = detectarRol()
      if (rol) {
        console.log('Rol detectado por polling:', rol)
        setUserRole(rol)
        clearInterval(interval)
      }
      if (intentos >= 10) clearInterval(interval)
    }, 300)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('googleTokenGuardado', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  const toggleMenu = (index) => {
    setSelectedMenu(selectedMenu === index ? null : index)
  }

  const handleOptionClick = (label, codigo) => {
    setSelectedOption(label)
    if (codigo) {
      localStorage.setItem('codigoPrograma', codigo)
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetch(`${backendUrl}/api/programas/listar`)
        .then((response) => response.json())
        .then((data) => {
          const programasFiltrados = data.filter(
            (programa) => programa.esPosgrado
          )
          const programasTransformados = programasFiltrados.map((programa) => ({
            label: programa.nombre,
            href: '/posgrado/grupos',
            codigo: String(programa.id)
          }))
          setProgramas(programasTransformados)
        })
    }, 500)

    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    localStorage.setItem(
      'sidebarState',
      JSON.stringify({ selectedMenu, selectedOption })
    )
  }, [selectedOption])

  const shouldShowMenu = (menuName) => {
    console.log('userRole:', userRole, '| googleRole:', googleRole, '| menuName:', menuName)

    // Director de programa (login Google con rol Director)
    if (userRole === 'ROLE_GOOGLE' && googleRole === 'Director') {
      return (
        menuName === 'Académico' ||
        menuName === 'Matrícula' 
       
      )
    }

    // Cualquier otro usuario de Google que no sea Director
    if (userRole === 'ROLE_GOOGLE') {
      return menuName === 'Proyectos'
    }

    if (!userRole) return false

    if (userRole === 'ROLE_SUPERADMIN') return true

    if (userRole === 'ROLE_ADMIN') return menuName !== 'Admin'

    return menuName === 'Proyectos'
  }

  return (
    <div
      className={`bg-rojo-claro min-h-full transition-all duration-300 min-w-0 overflow-hidden ${isOpen ? 'w-[240px] px-4' : 'w-0'}`}
    >
      <button
        className={`absolute top-1 ${isOpen ? 'left-4' : 'left-2'} p-2 bg-rojo-mate text-white rounded-md`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={20} /> : <LucideMenu size={20} />}
      </button>

      {isOpen && (
        <nav className='mt-16 space-y-2'>
          {shouldShowMenu('Académico') && (
            <Menu
              nombre='Académico'
              funcion={() => toggleMenu(1)}
              icono={<LibraryBig className='text-[25px]' />}
              opciones={[
                { label: 'Programas', href: '/academico/programas' },
                { label: 'Pénsums', href: '/academico/pensums' },
                { label: 'Cohortes', href: '/academico/cohortes' },
                { label: 'Materias', href: '/academico/materias' },
                { label: 'Grupos', href: '/academico/grupos' }
              ]}
              openMenu={selectedMenu === 1}
              selectedOption={selectedOption}
              handleOptionClick={handleOptionClick}
            />
          )}

          {shouldShowMenu('Matrícula') && (
            <Menu
              nombre='Matrícula'
              funcion={() => toggleMenu(2)}
              icono={<BookPlus className='text-[25px]' />}
              opciones={[
                { label: 'Cancelación', href: '/matricula/cancelaciones' },
                {
                  label: 'Aplazamiento de semestre',
                  href: '/matricula/aplazamiento'
                },
                { label: 'Reintegro', href: '/matricula/reintegros' },
                {
                  label: 'Contraprestaciones',
                  href: '/matricula/contraprestaciones'
                },
                { label: 'Inclusión de materias', href: '/matricula/inclusion' }
              ]}
              openMenu={selectedMenu === 2}
              selectedOption={selectedOption}
              handleOptionClick={handleOptionClick}
            />
          )}

          {shouldShowMenu('Usuarios') && (
            <Menu
              nombre='Usuarios'
              funcion={() => toggleMenu(3)}
              icono={<PiStudent className='text-[25px]' />}
              opciones={[
                { label: 'Profesores', href: '/usuarios/profesores' },
                { label: 'Estudiantes', href: '/usuarios/estudiantes' }
              ]}
              openMenu={selectedMenu === 3}
              selectedOption={selectedOption}
              handleOptionClick={handleOptionClick}
            />
          )}

          {shouldShowMenu('Grupos') && (
            <Menu
              nombre='Grupos'
              funcion={() => toggleMenu(4)}
              icono={<MdGroups className='text-[25px]' />}
              opciones={[
                {
                  label: 'Pregrado',
                  subopciones: [
                    {
                      label: 'Tecnología en analítica de datos',
                      href: '/pregrado/grupos',
                      codigo: '215'
                    }
                  ]
                },
                {
                  label: 'Posgrado',
                  subopciones: programas
                }
              ]}
              openMenu={selectedMenu === 4}
              selectedOption={selectedOption}
              handleOptionClick={handleOptionClick}
            />
          )}

          {shouldShowMenu('Proyectos') && (
            <Menu
              nombre='Proyectos'
              funcion={() => toggleMenu(5)}
              icono={<PiProjectorScreenChart className='text-[25px]' />}
              opciones={[
                { label: 'Proyectos', href: '/proyectos-admin' },
                { label: 'Grupos Investigación', href: '/grupos-admin' }
              ]}
              openMenu={selectedMenu === 5}
              selectedOption={selectedOption}
              handleOptionClick={handleOptionClick}
            />
          )}

          {shouldShowMenu('Admin') && (
            <Menu
              nombre='Admin'
              funcion={() => toggleMenu(6)}
              icono={<UserRoundCog className='text-[25px]' />}
              opciones={[
                { label: 'Administradores', href: '/admin/admins' },
                { label: 'Crear administrador', href: '/admin/crear-admin' },
                { label: 'Terminar semestre', href: '/admin/terminar-semestre' }
              ]}
              openMenu={selectedMenu === 6}
              selectedOption={selectedOption}
              handleOptionClick={handleOptionClick}
            />
          )}
        </nav>
      )}
    </div>
  )
}

export default Sidebar