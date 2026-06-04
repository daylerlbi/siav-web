import { useState, useEffect } from 'react'
import Tabla from '../../../components/Tabla'
import { Eye, CircleFadingPlus, NotebookPen } from 'lucide-react'
import Boton from '../../../components/Boton'
import Modal from '../../../components/Modal'
import { addToast, ToastProvider } from '@heroui/react'
import { useNavigate } from 'react-router-dom'
import { getBackendUrl, getMoodleToken, getMoodleUrl } from '../../../lib/controllers/endpoints'

const GruposPosgrado = () => {
  const [programa, setPrograma] = useState('')
  const [grupos, setGrupos] = useState([])
  const [informacion, setInformacion] = useState([])
  const [cargandoGrupos, setCargandoGrupos] = useState(true)
  const Navigate = useNavigate()
  const [grupoNombre, setGrupoNombre] = useState('')
  const backendUrl = getBackendUrl()
  const moodleUrl = getMoodleUrl()
  const moodleToken = getMoodleToken()
  const [isOpenGrupo, setIsOpenGrupo] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null)
  const [isCreatingAll, setIsCreatingAll] = useState(false)
  const [isCreatingIndividual, setIsCreatingIndividual] = useState(false)
  const [progresoGrupos, setProgresoGrupos] = useState({ actual: 0, total: 0 })

  useEffect(() => {
    setPrograma(localStorage.getItem('codigoPrograma'))
  }, [])

  useEffect(() => {
    if (programa !== '' && programa !== undefined && programa !== null) {
      setCargandoGrupos(true)
      fetch(`${backendUrl}/api/grupos/vinculados`)
        .then((response) => response.json())
        .then((data) => {
          // Filtrar por programaId que coincida con el programa seleccionado
          const gruposFiltrados = data.filter(
            (g) => String(g.programaId) === String(programa)
          )
          setGrupos(gruposFiltrados)
          const info = gruposFiltrados.map((grupo) => ({
            ...grupo,
            Código: grupo.codigoGrupo,
            Nombre: grupo.grupoNombre,
            Cohorte: grupo.cohorteNombre,
            Profesor: grupo.docenteNombre
          }))
          setInformacion(info)
        })
        .catch((error) => console.error('Error al cargar grupos:', error))
        .finally(() => setCargandoGrupos(false))
    }
  }, [programa])

  const mostrarNotificacion = () => {
    addToast({
      title: isOpenGrupo ? 'Grupo actualizado' : 'Grupos actualizados',
      description: isOpenGrupo
        ? `El grupo ${grupoNombre} ha sido actualizado correctamente`
        : 'Los grupos han sido actualizados correctamente',
      color: 'success',
      timeout: '3000',
      shouldShowTimeoutProgress: true
    })
  }

  const crearGrupoMoodle = async (grupo) => {
    const programaData = await fetch(`${backendUrl}/api/programas/${grupo.programaId}`)
      .then((r) => r.json())

    if (!grupo.moodleId) {
      const moodleResponse = await fetch(
        `${moodleUrl}/?wstoken=${moodleToken}` +
        `&moodlewsrestformat=json` +
        `&wsfunction=core_course_create_courses` +
        `&courses[0][fullname]=${grupo.Nombre}` +
        `&courses[0][categoryid]=${programaData.moodleId}` +
        `&courses[0][shortname]=${grupo.codigoGrupo}`
      )
      const moodleData = await moodleResponse.json()
      const moodleId = moodleData[0].id

      await fetch(`${backendUrl}/api/grupos/moodle/${grupo.id}?moodleId=${moodleId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      await matricularUsuarios(grupo.id, moodleId)
    } else {
      await matricularUsuarios(grupo.id, grupo.moodleId)
    }
  }

  const obtenerUsuariosMatriculados = async (moodleId) => {
    try {
      const response = await fetch(
        `${moodleUrl}/?wstoken=${moodleToken}&moodlewsrestformat=json&wsfunction=core_enrol_get_enrolled_users&courseid=${moodleId}`
      )
      const data = await response.json()
      return data || []
    } catch { return [] }
  }

  const matricularProfesor = async (docenteId, moodleId, usuariosMatriculados) => {
    try {
      const profesor = await fetch(`${backendUrl}/api/usuarios/${docenteId}`).then(r => r.json())
      if (profesor.moodleId) {
        const yaMatriculado = usuariosMatriculados.some(u => u.id === parseInt(profesor.moodleId))
        if (!yaMatriculado) {
          await fetch(
            `${moodleUrl}/?wstoken=${moodleToken}&moodlewsrestformat=json&wsfunction=enrol_manual_enrol_users` +
            `&enrolments[0][roleid]=3&enrolments[0][userid]=${profesor.moodleId}&enrolments[0][courseid]=${moodleId}`
          )
        }
      }
    } catch (error) { console.error('Error matriculando profesor:', error) }
  }

  const matricularUsuarios = async (grupoId, moodleId) => {
    try {
      const usuariosMatriculados = await obtenerUsuariosMatriculados(moodleId)
      const dataEstudiantes = await fetch(`${backendUrl}/api/estudiantes/matriculados/grupo-cohorte/${grupoId}`).then(r => r.json())
      const estudiantes = dataEstudiantes.estudiantes || []

      const grupo = grupos.find((g) => g.id === grupoId)
      if (grupo?.docenteId) {
        await matricularProfesor(grupo.docenteId, moodleId, usuariosMatriculados)
      }

      await Promise.all(
        estudiantes.map(async (estudiante) => {
          if (estudiante.moodleId) {
            const yaMatriculado = usuariosMatriculados.some(u => u.id === parseInt(estudiante.moodleId))
            if (!yaMatriculado) {
              await fetch(
                `${moodleUrl}/?wstoken=${moodleToken}&moodlewsrestformat=json&wsfunction=enrol_manual_enrol_users` +
                `&enrolments[0][roleid]=5&enrolments[0][userid]=${estudiante.moodleId}&enrolments[0][courseid]=${moodleId}`
              )
            }
          }
        })
      )
    } catch (error) { console.error('Error en matriculación:', error) }
  }

  const crearGrupoIndividual = async (grupo) => {
    const programaData = await fetch(`${backendUrl}/api/programas/${grupo.programaId}`).then(r => r.json())

    if (!grupo.moodleId) {
      const moodleData = await fetch(
        `${moodleUrl}/?wstoken=${moodleToken}&moodlewsrestformat=json&wsfunction=core_course_create_courses` +
        `&courses[0][fullname]=${grupo.Nombre}&courses[0][categoryid]=${programaData.moodleId}&courses[0][shortname]=${grupo.codigoGrupo}`
      ).then(r => r.json())

      const moodleId = moodleData[0].id
      await fetch(`${backendUrl}/api/grupos/moodle/${grupo.id}?moodleId=${moodleId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      await matricularUsuarios(grupo.id, moodleId)
    } else {
      await matricularUsuarios(grupo.id, grupo.moodleId)
    }
  }

  const crearTodosLosGrupos = async () => {
    try {
      setIsCreatingAll(true)
      setProgresoGrupos({ actual: 0, total: grupos.length })
      let exitosos = 0, errores = 0

      for (let i = 0; i < grupos.length; i++) {
        setProgresoGrupos({ actual: i + 1, total: grupos.length })
        try {
          await crearGrupoIndividual(grupos[i])
          exitosos++
        } catch { errores++ }
      }

      addToast({
        title: errores === 0 ? 'Proceso completado' : 'Proceso completado con errores',
        description: errores === 0
          ? `${exitosos} grupos creados/actualizados exitosamente`
          : `${exitosos} grupos exitosos, ${errores} con errores`,
        color: errores === 0 ? 'success' : 'warning',
        timeout: '5000',
        shouldShowTimeoutProgress: true
      })
      setIsOpen(false)
    } catch {
      addToast({ title: 'Error', description: 'Error en el proceso masivo', color: 'danger', timeout: '3000', shouldShowTimeoutProgress: true })
    } finally {
      setIsCreatingAll(false)
      setProgresoGrupos({ actual: 0, total: 0 })
    }
  }

  const verGrupo = (grupo) => Navigate('/posgrado/grupos/ver-grupo/' + grupo.id)

  const crearGrupo = (grupo) => {
    setGrupoNombre(grupo.Nombre)
    setGrupoSeleccionado(grupo)
    setIsOpenGrupo(true)
  }

  const crearGrupoEspecifico = async () => {
    try {
      setIsCreatingIndividual(true)
      await crearGrupoMoodle(grupoSeleccionado)
      mostrarNotificacion()
      setIsOpenGrupo(false)
    } catch {
      addToast({ title: 'Error', description: 'Error al crear el grupo', color: 'danger', timeout: '3000', shouldShowTimeoutProgress: true })
    } finally {
      setIsCreatingIndividual(false)
    }
  }

  const verNotas = (grupo) => {
    localStorage.setItem('grupo', JSON.stringify(grupo.Nombre))
    Navigate('notas/' + grupo.id)
  }

  const columnas = ['Código', 'Nombre', 'Cohorte', 'Profesor']
  const filtros = ['Código', 'Nombre', 'Cohorte']
  const acciones = [
    { icono: <Eye className='text-[25px]' />, tooltip: 'Ver', accion: verGrupo },
    { icono: <CircleFadingPlus className='text-[25px]' />, tooltip: 'Crear/actualizar grupo', accion: crearGrupo },
    { icono: <NotebookPen className='text-[25px]' />, tooltip: 'Ver notas', accion: verNotas }
  ]

  return (
    <div className='p-4 flex flex-col items-center w-full'>
      <p className='text-titulos'>Lista de grupos</p>
      <div className='w-full my-8'>
        <Tabla
          informacion={informacion}
          columnas={columnas}
          acciones={acciones}
          filtros={filtros}
          cargandoContenido={cargandoGrupos}
        />
      </div>
      <div className='w-full flex justify-end mt-4'>
        <Boton onClick={() => setIsOpen(true)} disabled={isCreatingAll}>
          {isCreatingAll ? 'Creando grupos...' : 'Crear grupos'}
        </Boton>
      </div>

      <Modal
        isOpen={isOpen}
        onOpenChange={(open) => { if (!isCreatingAll) setIsOpen(open) }}
        cabecera='Crear Grupos'
        cuerpo={
          <div>
            <p>¿Estás seguro de crear/actualizar todos los grupos?</p>
            {isCreatingAll && (
              <p className='text-sm text-gray-600 mt-2'>
                Procesando grupos ({progresoGrupos.actual}/{progresoGrupos.total}), por favor espere...
              </p>
            )}
          </div>
        }
        footer={
          <Boton onClick={crearTodosLosGrupos} disabled={isCreatingAll}>
            {isCreatingAll ? 'Creando...' : 'Aceptar'}
          </Boton>
        }
      />

      <Modal
        isOpen={isOpenGrupo}
        onOpenChange={(open) => { if (!isCreatingIndividual) setIsOpenGrupo(open) }}
        cabecera='Crear Grupo'
        cuerpo={
          <div>
            <p>{'¿Estás seguro de crear/actualizar el grupo ' + grupoNombre + '?'}</p>
            {isCreatingIndividual && (
              <p className='text-sm text-gray-600 mt-2'>Creando grupo, por favor espere...</p>
            )}
          </div>
        }
        footer={
          <Boton onClick={crearGrupoEspecifico} disabled={isCreatingIndividual}>
            {isCreatingIndividual ? 'Creando...' : 'Aceptar'}
          </Boton>
        }
      />

      <ToastProvider placement='top-right' toastOffset={10} maxVisibleToasts={1} />
    </div>
  )
}

export default GruposPosgrado