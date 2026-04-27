import { useState, useEffect } from 'react'
import Tabla from '../../components/Tabla'
import { Pencil } from 'lucide-react'
import Modal from '../../components/Modal'
import Boton from '../../components/Boton'
import AlertaModal from '../../components/AlertaModal'
import { RadioGroup, Radio } from '@heroui/react'
import { getBackendUrl, getMoodleToken, getMoodleUrl } from '../../lib/controllers/endpoints'

const Programas = () => {
  const [programasPosgrado, setProgramasPosgrado] = useState([])
  const [programasPregrado, setProgramasPregrado] = useState([])
  const [tiposPrograma, setTiposPrograma] = useState([])
  const [cargandoProgramas, setCargandoProgramas] = useState(true)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [programaId, setProgramaId] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [programa, setPrograma] = useState('')
  const [posgrado, setPosgrado] = useState(true)
  const [moodleId, setMoodleId] = useState('')
  const [historicoMoodleId, setHistoricoMoodleId] = useState('')
  const [semestreActual, setSemestreActual] = useState('')
  const backendUrl = getBackendUrl()
  const moodleUrl = getMoodleUrl()
  const moodleToken = getMoodleToken()

  // ✅ Detectar si es usuario Google y su rol
  const googleToken = localStorage.getItem('googleToken')
  const isGoogleUser = !!googleToken
  const googleRole = googleToken ? (() => {
    try { return JSON.parse(atob(googleToken.split('.')[1])).role || null }
    catch { return null }
  })() : null
  const isDirector = isGoogleUser && googleRole === 'Director'

  // ID del usuario director desde el token
  const directorId = googleToken ? (() => {
    try { return JSON.parse(atob(googleToken.split('.')[1])).id || null }
    catch { return null }
  })() : null

  const [isAlertOpen, setIsAlertOpen] = useState(false)
  const [alertType, setAlertType] = useState('success')
  const [alertMessage, setAlertMessage] = useState(null)

  const codigoErrors = []
  if (codigo === '') codigoErrors.push('Este campo es obligatorio')
  if (codigo && !/^\d+$/.test(codigo)) codigoErrors.push('Solo puede contener números')
  if (codigo && codigo.length < 3) codigoErrors.push('El código debe tener al menos 3 caracteres')

  const programaErrors = []
  if (programa === '') programaErrors.push('Este campo es obligatorio')

  const procesarProgramas = (data) => {
    const programasCompletos = data.map((programa) => ({
      ...programa,
      Nombre: programa.nombre,
      Código: programa.codigo,
      Id: programa.id
    }))
    setProgramasPosgrado(programasCompletos.filter((p) => p.esPosgrado === true))
    setProgramasPregrado(programasCompletos.filter((p) => p.esPosgrado === false))
    setCargandoProgramas(false)
  }

  useEffect(() => {
    setCargandoProgramas(true)

    // ✅ Si es Director, llama al endpoint filtrado por directorId
    const url = isDirector && directorId
      ? `${backendUrl}/api/programas/listar/director/${directorId}`
      : `${backendUrl}/api/programas/listar`

    fetch(url)
      .then((response) => response.json())
      .then((data) => procesarProgramas(data))

    fetch(`${backendUrl}/api/programas/tipos-programa`)
      .then((response) => response.json())
      .then((data) => setTiposPrograma(data))
  }, [])

  const cargarProgramas = async () => {
    setCargandoProgramas(true)

    const url = isDirector && directorId
      ? `${backendUrl}/api/programas/listar/director/${directorId}`
      : `${backendUrl}/api/programas/listar`

    fetch(url)
      .then((response) => response.json())
      .then((data) => procesarProgramas(data))
  }

  const prepararEdicion = (programa) => {
    setCodigo(programa.codigo)
    setPrograma(programa.nombre)
    setPosgrado(programa.esPosgrado)
    setModoEdicion(true)
    setProgramaId(programa.id)
    setMoodleId(programa.moodleId)
    setHistoricoMoodleId(programa.historicoMoodleId)
    setSemestreActual(programa.semestreActual)
    setIsOpen(true)
  }

  const crearPrograma = async (e) => {
    e.preventDefault()
    const data = { codigo, nombre: programa, esPosgrado: posgrado }
    try {
      if (tiposPrograma.length < 2) {
        setAlertType('error')
        setAlertMessage('No se pudieron cargar los tipos de programa necesarios. Intente nuevamente.')
        setIsAlertOpen(true)
        return
      }

      const parentMoodleId = posgrado ? tiposPrograma[1].moodleId : tiposPrograma[0].moodleId

      if (!parentMoodleId) {
        setAlertType('error')
        setAlertMessage('No se pudo determinar la categoría padre en Moodle. Contacte al administrador.')
        setIsAlertOpen(true)
        return
      }

      const response = await fetch(`${backendUrl}/api/programas/crear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        setAlertType('error')
        setAlertMessage(errorData.message)
        setIsAlertOpen(true)
      } else {
        const programaResponse = await response.json()

        fetch(`${moodleUrl}?wstoken=${moodleToken}&moodlewsrestformat=json&wsfunction=core_course_create_categories&categories[0][name]=${programaResponse.nombre}&categories[0][parent]=${parentMoodleId}&categories[0][description]=${programaResponse.nombre}`)
          .then((r) => r.json())
          .then((data) => {
            const programaMoodleId = data[0].id
            return fetch(`${backendUrl}/api/programas/moodle`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ backendId: programaResponse.id, moodleId: programaMoodleId })
            })
              .then((r) => r.json())
              .then(() => fetch(`${moodleUrl}?wstoken=${moodleToken}&moodlewsrestformat=json&wsfunction=core_course_create_categories&categories[0][name]=Histórico&categories[0][parent]=${programaMoodleId}&categories[0][description]=Histórico de cursos del programa ${programaResponse.nombre}`))
              .then((r) => r.json())
              .then((historicoCategoriaData) => {
                const historicoMoodleId = historicoCategoriaData[0].id
                return fetch(`${backendUrl}/api/programas/historico/moodle`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ backendId: programaResponse.id, moodleId: historicoMoodleId })
                })
              })
              .then((r) => r.json())
              .catch((error) => {
                console.error('Error en la creación o vinculación del histórico:', error)
                setAlertType('warning')
                setAlertMessage('Programa creado pero hubo un problema con la categoría Histórico')
                setIsAlertOpen(true)
              })
          })
          .catch((error) => {
            console.error('Error en la creación o vinculación de la categoría principal:', error)
            setAlertType('warning')
            setAlertMessage('Programa creado pero hubo un problema con la vinculación a Moodle')
            setIsAlertOpen(true)
          })

        setCodigo('')
        setPrograma('')
        setPosgrado(true)
        setIsOpen(false)
        setAlertType('success')
        setAlertMessage('¡Programa creado exitosamente!')
        setIsAlertOpen(true)
        cargarProgramas()
      }
    } catch (error) {
      console.error('Error:', error)
      setAlertType('error')
      setAlertMessage('Error al procesar la solicitud')
      setIsAlertOpen(true)
    }
  }

  const actualizarEnBackend = async (id, data) => {
    const response = await fetch(`${backendUrl}/api/programas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error('Error al actualizar el programa en el backend')
    return await response.json()
  }

  const actualizarEnMoodle = async (moodleId, nombrePrograma) => {
    try {
      const response = await fetch(`${moodleUrl}?wstoken=${moodleToken}&moodlewsrestformat=json&wsfunction=core_course_update_categories&categories[0][id]=${moodleId}&categories[0][name]=${nombrePrograma}&categories[0][description]=${nombrePrograma}`)
      if (!response.ok) { console.warn('Respuesta no exitosa de Moodle'); return false }
      return true
    } catch (error) {
      console.error('Error al comunicarse con Moodle:', error)
      return false
    }
  }

  const limpiarFormulario = () => {
    setCodigo('')
    setPrograma('')
    setPosgrado(true)
    setModoEdicion(false)
    setProgramaId(null)
    setIsOpen(false)
  }

  const actualizarPrograma = async (e) => {
    e.preventDefault()
    try {
      const body = {
        nombre: programa,
        codigo: codigo,
        esPosgrado: posgrado,
        moodleId: moodleId,
        historicoMoodleId: historicoMoodleId,
        semestreActual: semestreActual
      }
      await actualizarEnBackend(programaId, body)
      let moodleActualizado = true
      if (moodleId) moodleActualizado = await actualizarEnMoodle(moodleId, programa)
      limpiarFormulario()
      setAlertType('success')
      setAlertMessage(moodleActualizado ? '¡Programa actualizado exitosamente en backend y Moodle!' : '¡Programa actualizado en el backend pero hubo un problema con Moodle!')
      setIsAlertOpen(true)
      cargarProgramas()
    } catch (error) {
      console.error('Error:', error)
      setAlertType('error')
      setAlertMessage(`Error al actualizar: ${error.message}`)
      setIsAlertOpen(true)
    }
  }

  const columnas = ['Código', 'Nombre']
  const filtros = ['Nombre']
  const acciones = [
    {
      icono: <Pencil className='text-[25px]' />,
      tooltip: 'Editar',
      accion: (programa) => prepararEdicion(programa)
    }
  ]

  return (
    <div className='p-4 w-full flex flex-col items-center justify-center'>
      <div className='w-full flex items-center justify-between mb-8'>
        <p className='text-center text-titulos flex-1'>Lista de programas de posgrado</p>
        {!isGoogleUser && <Boton onClick={() => setIsOpen(true)}>Crear programa</Boton>}
      </div>
      <div className='w-full mb-8'>
        <Tabla
          informacion={programasPosgrado}
          columnas={columnas}
          filtros={filtros}
          acciones={isGoogleUser ? [] : acciones}
          elementosPorPagina={5}
          cargandoContenido={cargandoProgramas}
        />
      </div>
      <p className='text-center text-titulos mt-8'>Lista de programas de pregrado</p>
      <div className='w-full'>
        <Tabla
          informacion={programasPregrado}
          columnas={columnas}
          filtros={filtros}
          acciones={isGoogleUser ? [] : acciones}
          elementosPorPagina={5}
          cargandoContenido={cargandoProgramas}
        />
      </div>
      <Modal
        size='xl'
        isOpen={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open)
          if (!open) {
            setModoEdicion(false)
            setCodigo('')
            setPrograma('')
            setPosgrado(true)
            setProgramaId(null)
          }
        }}
        cabecera={modoEdicion ? 'Editar Programa' : 'Crear Programa'}
        cuerpo={
          <form
            className='flex flex-col gap-2'
            onSubmit={modoEdicion ? actualizarPrograma : crearPrograma}
          >
            <div className='flex flex-col gap-1 w-full py-4'>
              <label className='text-sm'>Código *</label>
              <div className='border border-gris-institucional rounded-[15px] px-3 py-2'>
                <input
                  className='w-full outline-none bg-transparent text-sm'
                  placeholder='Ingresa el código del programa'
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  required
                />
              </div>
              {codigoErrors.length > 0 && (
                <ul className='text-xs text-danger mt-1'>
                  {codigoErrors.map((error, i) => <li key={i}>{error}</li>)}
                </ul>
              )}
            </div>
            <div className='flex flex-col gap-1 w-full py-4'>
              <label className='text-sm'>Nombre *</label>
              <div className='border border-gris-institucional rounded-[15px] px-3 py-2'>
                <input
                  className='w-full outline-none bg-transparent text-sm'
                  placeholder='Ingresa el nombre del programa'
                  value={programa}
                  onChange={(e) => setPrograma(e.target.value)}
                  required
                />
              </div>
              {programaErrors.length > 0 && (
                <ul className='text-xs text-danger mt-1'>
                  {programaErrors.map((error, i) => <li key={i}>{error}</li>)}
                </ul>
              )}
            </div>
            <div className='flex flex-col gap-2 py-2'>
              <p className='text-normal'>Nivel académico</p>
              <RadioGroup
                color='danger'
                value={posgrado ? 'posgrado' : 'pregrado'}
                onValueChange={(value) => setPosgrado(value === 'posgrado')}
                orientation='horizontal'
              >
                <Radio value='posgrado'>Posgrado</Radio>
                <Radio value='pregrado'>Pregrado</Radio>
              </RadioGroup>
            </div>
            <div className='w-full flex justify-end mb-[-20px]'>
              <Boton type='submit'>
                {modoEdicion ? 'Guardar cambios' : 'Crear programa'}
              </Boton>
            </div>
          </form>
        }
      />
      <AlertaModal
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
        message={alertMessage}
        type={alertType}
        titulo={alertType === 'success' ? 'Operación exitosa' : 'Error'}
      />
    </div>
  )
}
export default Programas