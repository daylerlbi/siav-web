import { useState, useEffect } from 'react'
import Tabla from '../../components/Tabla'
import Boton from '../../components/Boton'
import { Pencil } from 'lucide-react'
import Modal from '../../components/Modal'
import AlertaModal from '../../components/AlertaModal'
import { Autocomplete, AutocompleteItem } from '@heroui/react'
import { getBackendUrl, getMoodleToken, getMoodleUrl } from '../../lib/controllers/endpoints'

const Pensum = () => {
  const [pensums, setPensums] = useState([])
  const [programas, setProgramas] = useState([])
  const [informacion, setInformacion] = useState([])
  const [cargandoPensums, setCargandoPensums] = useState(true)
  const backendUrl = getBackendUrl()

  const isEstudiante = (() => {
    try {
      const token = localStorage.getItem('googleToken')
      if (!token) return false
      const payload = JSON.parse(atob(token.split('.')[1]))
      return (payload.role || '').toLowerCase() === 'estudiante'
    } catch { return false }
  })()
  const isGoogleUser = isEstudiante

  const [isOpen, setIsOpen] = useState(false)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [pensumId, setPensumId] = useState(null)
  const [nombrePensum, setNombrePensum] = useState('')
  const [programaId, setProgramaId] = useState('')
  const [cantidadSemestres, setCantidadSemestres] = useState('')
  const [isAlertOpen, setIsAlertOpen] = useState(false)
  const [alertType, setAlertType] = useState('success')
  const [alertMessage, setAlertMessage] = useState('')
  const [alertTitulo, setAlertTitulo] = useState('')
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const nombrePensumErrors = []
  if (nombrePensum === '') nombrePensumErrors.push('Este campo es obligatorio')

  const programaIdErrors = []
  if (programaId === '') programaIdErrors.push('Este campo es obligatorio')

  const cantidadSemestresErrors = []
  if (cantidadSemestres === '') {
    cantidadSemestresErrors.push('Este campo es obligatorio')
  } else {
    const semestres = parseInt(cantidadSemestres)
    if (isNaN(semestres)) {
      cantidadSemestresErrors.push('Debe ser un número')
    } else if (semestres < 1 || semestres > 10) {
      cantidadSemestresErrors.push('Debe estar entre 1 y 10')
    }
  }

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    setCargandoPensums(true)
    try {
      const pensumResponse = await fetch(`${backendUrl}/api/pensums/listar`)
      const pensumData = await pensumResponse.json()
      setPensums(pensumData)
      const programaResponse = await fetch(`${backendUrl}/api/programas/listar`)
      const programaData = await programaResponse.json()
      setProgramas(programaData)
    } catch (error) {
      mostrarAlerta('Error al cargar los datos', 'error', 'Error de conexión')
    } finally {
      setCargandoPensums(false)
    }
  }

  const mostrarAlerta = (mensaje, tipo, titulo) => {
    setAlertMessage(mensaje)
    setAlertType(tipo)
    setAlertTitulo(titulo || (tipo === 'success' ? 'Operación exitosa' : 'Error'))
    setIsAlertOpen(true)
  }

  useEffect(() => {
    if (pensums.length > 0 && programas.length > 0) {
      const pensumsConProgramas = pensums.map((pensum) => {
        const programa = programas.find((p) => p.id === pensum.programaId)
        return {
          ...pensum,
          Id: pensum.id,
          Nombre: pensum.nombre,
          'Nombre del programa académico': programa ? programa.nombre : 'No disponible',
          'Cantidad de semestres': pensum.cantidadSemestres || 'No especificado',
          programaNombre: programa ? programa.nombre : 'No disponible'
        }
      })
      setInformacion(pensumsConProgramas)
    }
  }, [pensums, programas])

  const prepararEdicion = (pensum) => {
    setNombrePensum(pensum.nombre)
    setProgramaId(pensum.programaId ? pensum.programaId.toString() : '')
    setCantidadSemestres(pensum.cantidadSemestres ? pensum.cantidadSemestres.toString() : '')
    setPensumId(pensum.id)
    setModoEdicion(true)
    setIsOpen(true)
  }

  const confirmarCreacionPensum = (e) => {
    e.preventDefault()
    if (nombrePensumErrors.length > 0 || programaIdErrors.length > 0 || cantidadSemestresErrors.length > 0) {
      mostrarAlerta('Por favor complete correctamente todos los campos', 'error', 'Error de validación')
      return
    }
    setIsConfirmOpen(true)
  }

  const crearPensumEnBackend = async (data) => {
    const response = await fetch(`${backendUrl}/api/pensums/crear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.mensaje || result.message || 'Error al crear el pensum')
    }
    return await response.json()
  }

  const obtenerSemestresPrograma = async (programaId) => {
    const response = await fetch(`${backendUrl}/api/programas/${programaId}/semestres`)
    if (!response.ok) throw new Error('Error al obtener los semestres del programa')
    return await response.json()
  }

  const crearCategoriaSemestreEnMoodle = async (semestre, programaData) => {
    const moodleUrl = getMoodleUrl()
    const moodleToken = getMoodleToken()
    const response = await fetch(
      `${moodleUrl}?wstoken=${moodleToken}&moodlewsrestformat=json&wsfunction=core_course_create_categories&categories[0][name]=${semestre.nombre}&categories[0][parent]=${programaData.moodleId}&categories[0][description]=Semestre ${semestre.numero} del programa ${programaData.nombre}`
    )
    if (!response.ok) throw new Error(`Error al crear la categoría para el semestre ${semestre.nombre}`)
    const data = await response.json()
    if (!data || data.length === 0 || !data[0].id) throw new Error('Respuesta de Moodle inválida')
    return data[0].id
  }

  const actualizarMoodleIdSemestre = async (semestreId, moodleId) => {
    const response = await fetch(`${backendUrl}/api/pensums/semestre/moodle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ backendId: semestreId, moodleId: moodleId.toString() })
    })
    if (!response.ok) throw new Error(`Error al actualizar moodleId del semestre ${semestreId}`)
    return await response.json()
  }

  const procesarSemestresPrograma = async (programaId) => {
    try {
      const programaData = await obtenerSemestresPrograma(programaId)
      if (!programaData.moodleId) return false
      const semestresParaProcesar = programaData.semestres
        .filter((s) => s.moodleId === null)
        .sort((a, b) => a.numero - b.numero)
      let todosProcesadosCorrectamente = true
      for (const semestre of semestresParaProcesar) {
        try {
          const moodleId = await crearCategoriaSemestreEnMoodle(semestre, programaData)
          await actualizarMoodleIdSemestre(semestre.id, moodleId)
        } catch (error) {
          todosProcesadosCorrectamente = false
        }
      }
      return todosProcesadosCorrectamente
    } catch (error) {
      return false
    }
  }

  const crearPensum = async () => {
    const data = {
      nombre: nombrePensum,
      programaId: parseInt(programaId),
      cantidadSemestres: parseInt(cantidadSemestres)
    }
    try {
      const resultadoPensum = await crearPensumEnBackend(data)
      await procesarSemestresPrograma(data.programaId)
      limpiarFormulario()
      setIsOpen(false)
      setIsConfirmOpen(false)
      mostrarAlerta(`Pensum "${resultadoPensum.nombre}" creado correctamente`, 'success', 'Pensum creado')
      cargarDatos()
    } catch (error) {
      mostrarAlerta(error.message || 'Error al procesar la solicitud', 'error', 'Error del servidor')
    }
  }

  const actualizarPensum = async (e) => {
    e.preventDefault()
    if (nombrePensumErrors.length > 0 || programaIdErrors.length > 0 || cantidadSemestresErrors.length > 0) {
      mostrarAlerta('Por favor complete correctamente todos los campos', 'error', 'Error de validación')
      return
    }
    const data = {
      id: pensumId,
      nombre: nombrePensum,
      programaId: parseInt(programaId),
      cantidadSemestres: parseInt(cantidadSemestres)
    }
    try {
      const response = await fetch(`${backendUrl}/api/pensums/${pensumId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const result = await response.json()
      if (!response.ok) {
        mostrarAlerta(result.mensaje || result.message || 'Error al actualizar el pensum', 'error', 'Error al actualizar')
      } else {
        limpiarFormulario()
        setIsOpen(false)
        mostrarAlerta(result.mensaje || result.message || 'Pensum actualizado correctamente', 'success', 'Pensum actualizado')
        cargarDatos()
      }
    } catch (error) {
      mostrarAlerta('Error al procesar la solicitud', 'error', 'Error del servidor')
    }
  }

  const limpiarFormulario = () => {
    setNombrePensum('')
    setProgramaId('')
    setCantidadSemestres('')
    setPensumId(null)
    setModoEdicion(false)
  }

  const columnas = ['Id', 'Nombre', 'Nombre del programa académico', 'Cantidad de semestres']
  const filtros = ['Nombre', 'Nombre del programa académico']
  const acciones = isGoogleUser
    ? []
    : [{ icono: <Pencil className='text-[25px]' />, tooltip: 'Editar', accion: (pensum) => prepararEdicion(pensum) }]

  return (
    <div className='w-full p-4 flex flex-col items-center justify-center'>
      <div className='w-full flex items-center justify-between mb-8'>
        <p className='text-center text-titulos flex-1'>Lista de pénsums</p>
        {!isGoogleUser && (
          <Boton onClick={() => { limpiarFormulario(); setIsOpen(true) }}>Crear pensum</Boton>
        )}
      </div>
      <div className='w-full my-8'>
        <Tabla
          informacion={informacion}
          columnas={columnas}
          filtros={filtros}
          acciones={acciones}
          elementosPorPagina={10}
          cargandoContenido={cargandoPensums}
        />
      </div>

      <Modal
        size='xl'
        isOpen={isOpen}
        onOpenChange={(open) => { setIsOpen(open); if (!open) limpiarFormulario() }}
        cabecera={modoEdicion ? 'Editar Pensum' : 'Crear Pensum'}
        cuerpo={
          <form className='flex flex-col gap-4' onSubmit={modoEdicion ? actualizarPensum : confirmarCreacionPensum}>
            <div className='flex flex-col gap-1 w-full py-4'>
              <label className='text-sm'>Nombre *</label>
              <div className='border border-gris-institucional rounded-[15px] px-3 py-2'>
                <input className='w-full outline-none bg-transparent text-sm' placeholder='Ingresa el nombre del pensum' value={nombrePensum} onChange={(e) => setNombrePensum(e.target.value)} required />
              </div>
              {nombrePensumErrors.length > 0 && <ul className='text-xs text-danger mt-1'>{nombrePensumErrors.map((error, i) => <li key={i}>{error}</li>)}</ul>}
            </div>

            <div className='w-full py-4'>
              <Autocomplete variant='bordered' className='w-full' defaultItems={programas} selectedKey={programaId} isReadOnly={modoEdicion} label='Programa académico' size='md' placeholder='Selecciona el programa académico' labelPlacement='outside' isRequired onSelectionChange={(id) => setProgramaId(id || '')} isInvalid={programaIdErrors.length > 0} errorMessage={() => <ul className='text-xs text-danger mt-1'>{programaIdErrors.map((error, i) => <li key={i}>{error}</li>)}</ul>}>
                {(programa) => <AutocompleteItem key={programa.id.toString()}>{programa.nombre}</AutocompleteItem>}
              </Autocomplete>
            </div>

            <div className='flex flex-col gap-1 w-full py-4'>
              <label className='text-sm'>Cantidad de semestres *</label>
              <div className='border border-gris-institucional rounded-[15px] px-3 py-2'>
                <input className='w-full outline-none bg-transparent text-sm' placeholder='Ingresa la cantidad de semestres (1-10)' type='number' min={1} max={10} readOnly={modoEdicion} value={cantidadSemestres}
                  onChange={(e) => {
                    const numValue = parseInt(e.target.value)
                    if (e.target.value === '') { setCantidadSemestres('') }
                    else if (!isNaN(numValue) && numValue >= 1 && numValue <= 10) { setCantidadSemestres(numValue.toString()) }
                  }} required />
              </div>
              {cantidadSemestresErrors.length > 0 && <ul className='text-xs text-danger mt-1'>{cantidadSemestresErrors.map((error, i) => <li key={i}>{error}</li>)}</ul>}
              <p className='text-xs text-gray-500 mt-1'>El número debe estar entre 1 y 10</p>
            </div>

            <div className='w-full flex justify-end mb-[-20px]'>
              <Boton type='submit'>{modoEdicion ? 'Guardar cambios' : 'Crear pensum'}</Boton>
            </div>
          </form>
        }
      />

      <Modal
        size='md'
        isOpen={isConfirmOpen}
        onOpenChange={(open) => setIsConfirmOpen(open)}
        cabecera='Confirmar creación de pensum'
        cuerpo={
          <div className='flex flex-col'>
            <p>¿Está seguro de crear el pensum con <strong>{cantidadSemestres} semestres</strong>?</p>
            <p className='text-danger font-bold'>Advertencia: Una vez creado, la cantidad de semestres NO podrá ser modificada.</p>
            <div className='flex justify-end space-x-3 mt-4 mb-[-20px]'>
              <Boton onClick={() => crearPensum()}>Confirmar</Boton>
            </div>
          </div>
        }
      />

      <AlertaModal isOpen={isAlertOpen} onClose={() => setIsAlertOpen(false)} message={alertMessage} type={alertType} titulo={alertTitulo} />
    </div>
  )
}
export default Pensum