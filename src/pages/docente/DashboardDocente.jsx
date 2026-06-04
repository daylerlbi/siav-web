import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getBackendUrl } from '../../lib/controllers/endpoints'
import Tabla from '../../components/Tabla'
import { BookOpen, Users } from 'lucide-react'
import AlertaModal from '../../components/AlertaModal'

const DashboardDocente = () => {
  const [grupos, setGrupos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [alertaOpen, setAlertaOpen] = useState(false)
  const [alertaMessage, setAlertaMessage] = useState('')
  const backendUrl = getBackendUrl()
  const navigate = useNavigate()

  useEffect(() => {
    const googleToken = localStorage.getItem('googleToken')
    if (!googleToken) return

    const payload = JSON.parse(atob(googleToken.split('.')[1]))
    const email = payload.sub

    fetch(`${backendUrl}/api/usuarios/email/${encodeURIComponent(email)}`, {
      headers: { Authorization: `Bearer ${googleToken}` }
    })
      .then(r => r.json())
      .then(usuario => {
        return fetch(`${backendUrl}/api/grupos/vinculados`)
          .then(r => r.json())
          .then(data => {
            const gruposDocente = data.filter(g => g.docenteId === usuario.id)
            setGrupos(gruposDocente.map(g => ({
              ...g,
              Codigo: g.codigoGrupo,
              Materia: g.materia,
              Cohorte: g.cohorteNombre,
              Grupo: g.grupoNombre,
              Semestre: g.semestreMateria
            })))
          })
      })
      .catch(err => {
        console.error('Error cargando grupos:', err)
        setAlertaMessage('Error al cargar los grupos')
        setAlertaOpen(true)
      })
      .finally(() => setCargando(false))
  }, [])

  const columnas = ['Codigo', 'Materia', 'Cohorte', 'Grupo']
  const filtros = ['Materia', 'Cohorte', 'Grupo']
  const acciones = [
    {
      icono: <BookOpen className='text-[25px]' />,
      tooltip: 'Ver notas',
      accion: (grupo) => navigate(`/notas/posgrado/${grupo.id}`)
    },
    {
      icono: <Users className='text-[25px]' />,
      tooltip: 'Ver estudiantes',
      accion: (grupo) => navigate(`/posgrado/grupos/ver-grupo/${grupo.id}`)
    }
  ]

  return (
    <div className='p-4 flex flex-col w-full items-center'>
      <p className='text-titulos mb-8'>Mis grupos</p>
      {!cargando && grupos.length === 0 && (
        <p className='text-gray-500 mt-8'>No tienes grupos asignados en el semestre actual.</p>
      )}
      <div className='w-full'>
        <Tabla
          informacion={grupos}
          columnas={columnas}
          acciones={acciones}
          filtros={filtros}
          cargandoContenido={cargando}
        />
      </div>
      <AlertaModal
        isOpen={alertaOpen}
        onClose={() => setAlertaOpen(false)}
        message={alertaMessage}
        type='error'
        titulo='Error'
      />
    </div>
  )
}

export default DashboardDocente
