import { useEffect, useState } from 'react'
import { LogOut } from 'lucide-react'
import { Tooltip } from '@heroui/react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/hooks/useAuth'

const Topbar = () => {
  const Navigate = useNavigate()
  const { authType, logout, refreshUserFromToken } = useAuth()
  const [nombre, setNombre] = useState('')
  const [fotoUrl, setFotoUrl] = useState('')

  useEffect(() => {
    const getUserInfo = () => {
      const googleToken = localStorage.getItem('googleToken')
      const adminUser = localStorage.getItem('userInfo')

      if (googleToken) {
        const user = refreshUserFromToken()
        console.log('user retornado:', user)
        console.log('picture:', user?.picture)
        if (user) {
          setNombre((user.firstName || '') + ' ' + (user.lastName || ''))
          setFotoUrl(user.picture || 'https://placehold.co/250x250/4477ba/blue?text=User')
        }
      } else if (adminUser) {
        const user = JSON.parse(adminUser)
        setNombre(user.nombre || '')
        setFotoUrl('')
      } else {
        setNombre('')
        setFotoUrl('')
      }
    }

    getUserInfo()

    window.addEventListener('storage', getUserInfo)
    window.addEventListener('googleTokenGuardado', getUserInfo)

    return () => {
      window.removeEventListener('storage', getUserInfo)
      window.removeEventListener('googleTokenGuardado', getUserInfo)
    }
  }, [])

  const logOut = () => {
    logout()
    if (authType === 'google') {
      Navigate('/login')
    } else {
      Navigate('/login-admin')
    }
  }

  return (
    <div className='min-w-full min-h-12 bg-rojo-mate flex items-center justify-end px-4'>
      <p className='text-blanco'>{nombre || ''}</p>
      <img
        src={
          fotoUrl !== ''
            ? fotoUrl
            : 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png'
        }
        alt='foto de perfil'
        className='h-[35px] mx-6 rounded-full'
        referrerPolicy='no-referrer'
      />
      <a onClick={logOut} className='cursor-pointer'>
        <Tooltip
          content='Cerrar sesión'
          closeDelay={0}
          classNames={{
            content: 'bg-gris-claro'
          }}
        >
          <LogOut className='text-blanco' />
        </Tooltip>
      </a>
    </div>
  )
}

export default Topbar