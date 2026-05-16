import React from 'react'
import { Form, Input, Divider, DatePicker, Autocomplete, AutocompleteItem } from '@heroui/react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Boton from '../../components/Boton'
import { today, getLocalTimeZone } from '@internationalized/date'
import AlertaModal from '../../components/AlertaModal'
import { getBackendUrl } from '../../lib/controllers/endpoints'

const CrearContraprestacion = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const [estudianteId, setEstudianteId] = useState(null)
  const [tipoContraprestacionId, setTipoContraprestacionId] = useState(null)
  const [actividades, setActividades] = useState('')
  const [fechaInicio, setFechaInicio] = useState(null)
  const [fechaFin, setFechaFin] = useState(null)
  const [porcentaje, setPorcentaje] = useState('')

  const [estudiantes, setEstudiantes] = useState([])
  const [tiposContraprestacion, setTiposContraprestacion] = useState([])

  const [alertaModalOpen, setAlertaModalOpen] = useState(false)
  const [alertaMessage, setAlertaMessage] = useState('')
  const [alertaType, setAlertaType] = useState('success')
  const [alertaTitulo, setAlertaTitulo] = useState('')

  const backendUrl = getBackendUrl()

  const googleToken = localStorage.getItem('googleToken')
  const estudianteIdLocal = localStorage.getItem('estudianteId')
  const isEstudiante = (() => {
    try {
      if (!googleToken) return false
      const payload = JSON.parse(atob(googleToken.split('.')[1]))
      return (payload.role || '').toLowerCase() === 'estudiante'
    } catch { return false }
  })()

  const extraerMensajeError = async (response) => {
    try {
      const data = await response.json()
      return data.message || data.mensaje || data.error || data.reason || 'Error en la operación'
    } catch { return 'Error en la comunicación con el servidor' }
  }

  const showAlerta = (mensaje, tipo, titulo) => {
    setAlertaMessage(mensaje); setAlertaType(tipo)
    setAlertaTitulo(titulo || (tipo === 'success' ? 'Operación exitosa' : 'Error'))
    setAlertaModalOpen(true)
  }

  const minDateInicio = today(getLocalTimeZone()).subtract({ years: 1 })
  const maxDateFin = today(getLocalTimeZone()).add({ years: 1 })

  useEffect(() => {
    if (isEstudiante && estudianteIdLocal) {
      setEstudianteId(parseInt(estudianteIdLocal))
    }

    fetch(`${backendUrl}/contraprestaciones/tipos`)
      .then(async r => { if (!r.ok) throw new Error(await extraerMensajeError(r)); return r.json() })
      .then(data => setTiposContraprestacion(data))
      .catch(err => showAlerta(err.message, 'error', 'Error al cargar tipos'))

    if (!isEstudiante) {
      fetch(`${backendUrl}/estudiantes/listar/estado/1`)
        .then(async r => { if (!r.ok) throw new Error(await extraerMensajeError(r)); return r.json() })
        .then(data => setEstudiantes(data))
        .catch(err => showAlerta(err.message, 'error', 'Error al cargar estudiantes'))
    }
  }, [backendUrl])

  const limpiarCampos = () => {
    if (!isEstudiante) setEstudianteId(null)
    setTipoContraprestacionId(null); setActividades(''); setFechaInicio(null); setFechaFin(null); setPorcentaje('')
  }

  const onSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    if (!estudianteId || !tipoContraprestacionId || !actividades || !fechaInicio) {
      showAlerta('Por favor complete todos los campos requeridos', 'error', 'Campos incompletos')
      setLoading(false); return
    }
    crearContraprestacion()
  }

  const crearContraprestacion = async () => {
    const formattedFechaInicio = fechaInicio ? fechaInicio.toDate(getLocalTimeZone()).toISOString().split('T')[0] : null
    const formattedFechaFin = fechaFin ? fechaFin.toDate(getLocalTimeZone()).toISOString().split('T')[0] : null
    const contraprestacionDTO = { estudianteId, tipoContraprestacionId, actividades, fechaInicio: formattedFechaInicio, fechaFin: formattedFechaFin }
    try {
      const response = await fetch(`${backendUrl}/contraprestaciones/crear`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contraprestacionDTO)
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        let errorMessage = 'Error al crear la contraprestación'
        if (data?.message) errorMessage = data.message
        else if (data?.mensaje) errorMessage = data.mensaje
        else if (data?.reason) errorMessage = data.reason
        else if (response.status === 400) errorMessage = 'Los datos proporcionados son inválidos'
        else if (response.status === 404) errorMessage = 'No se encontró el estudiante o tipo de contraprestación especificado'
        else if (response.status === 409) errorMessage = 'Ya existe una contraprestación para este estudiante en el semestre actual'
        throw new Error(errorMessage)
      }
      showAlerta(data?.message || 'Contraprestación creada con éxito', 'success', 'Contraprestación creada')
      limpiarCampos()
      setTimeout(() => { navigate('/matricula/contraprestaciones') }, 2000)
    } catch (err) { showAlerta(err.message, 'error', 'Error al crear contraprestación') }
    finally { setLoading(false) }
  }

  return (
    <div className='flex flex-col w-full items-center p-4'>
      <div className='w-full flex flex-row justify-between'>
        <button className='w-[40px] h-[30px] text-[30px] bg-rojo-mate flex items-center justify-center rounded-md border border-rojo-mate text-white hover:bg-rojo-oscuro ease-in-out transition-all duration-300' onClick={() => navigate('/matricula/contraprestaciones')}>
          <ArrowLeft />
        </button>
        <p className='text-center text-titulos'>Creación de Contraprestación</p>
        <div className='w-[40px]'></div>
      </div>

      <Form className='w-full my-8 flex flex-col' onSubmit={onSubmit}>
        {!isEstudiante && (
          <>
            <p className='text-normal'>Información del estudiante</p>
            <Divider className='mb-4' />
            <div className='w-full flex flex-col'>
              <div className='w-full flex flex-row mb-4'>
                <div className='w-1/4 h-[40px] flex items-center'>
                  <label className='font-medium'>Estudiante</label>
                </div>
                <div className='w-1/2'>
                  <Autocomplete variant='bordered' className='w-full' defaultItems={estudiantes} selectedKey={estudianteId?.toString()} label='' size='md' placeholder='Selecciona el estudiante' labelPlacement='outside' isRequired
                    onSelectionChange={(id) => { if (id) setEstudianteId(parseInt(id)); else setEstudianteId(null) }}>
                    {(estudiante) => (
                      <AutocompleteItem key={estudiante.id.toString()}>
                        {`${estudiante.nombre || ''} ${estudiante.nombre2 || ''} ${estudiante.apellido || ''} ${estudiante.apellido2 || ''} - ${estudiante.codigo || ''}`}
                      </AutocompleteItem>
                    )}
                  </Autocomplete>
                </div>
              </div>
            </div>
          </>
        )}

        <p className='text-normal mt-8'>Información de la contraprestación</p>
        <Divider className='mb-4' />
        <div className='w-full flex flex-col'>
          <div className='w-full flex flex-row mb-4'>
            <div className='w-1/2 flex flex-row'>
              <div className='w-1/2 h-[40px] flex items-center'>
                <label className='font-medium'>Tipo de Contraprestación</label>
              </div>
              <div className='w-1/2 pr-2'>
                <Autocomplete variant='bordered' className='w-full' defaultItems={tiposContraprestacion} selectedKey={tipoContraprestacionId?.toString()} label='' size='md' placeholder='Selecciona el tipo' labelPlacement='outside' isRequired
                  onSelectionChange={(id) => {
                    if (id) { const tipo = tiposContraprestacion.find(t => t.id.toString() === id); setTipoContraprestacionId(parseInt(id)); setPorcentaje(`${tipo.porcentaje}`) }
                    else { setTipoContraprestacionId(null); setPorcentaje('') }
                  }}>
                  {(tipo) => <AutocompleteItem key={tipo.id.toString()}>{tipo.nombre}</AutocompleteItem>}
                </Autocomplete>
              </div>
            </div>
            <div className='w-1/2 flex flex-row'>
              <div className='w-1/3 h-[40px] flex items-center pl-2'>
                <label className='font-medium'>Fecha de inicio</label>
              </div>
              <div className='w-2/3'>
                <DatePicker classNames={{ inputWrapper: 'border border-gris-institucional rounded-[15px] w-full max-h-[40px]' }} className='w-full' labelPlacement='outside' type='date' isRequired firstDayOfWeek='mon' showMonthAndYearPickers calendarProps={{ color: 'danger', classNames: { cellButton: 'data-[selected=true]:bg-rojo-institucional data-[selected=true]:data-[hover=true]:-bg-rojo-institucional' } }} minValue={minDateInicio} value={fechaInicio || undefined} onChange={(value) => setFechaInicio(value)} />
              </div>
            </div>
          </div>

          <div className='w-full flex flex-row mb-4'>
            <div className='w-1/2 flex flex-row'>
              <div className='w-1/2 h-[40px] flex items-center'>
                <label className='font-medium'>Porcentaje</label>
              </div>
              <div className='w-1/2 pr-2'>
                <Input classNames={{ inputWrapper: 'border border-gris-institucional rounded-[15px] w-full max-h-[40px]' }} type='text' value={porcentaje} readOnly />
              </div>
            </div>
            <div className='w-1/2 flex flex-row'>
              <div className='w-1/3 h-[40px] flex items-center pl-2'>
                <label className='font-medium'>Fecha de finalización</label>
              </div>
              <div className='w-2/3'>
                <DatePicker classNames={{ inputWrapper: 'border border-gris-institucional rounded-[15px] w-full max-h-[40px]' }} className='w-full' labelPlacement='outside' type='date' firstDayOfWeek='mon' showMonthAndYearPickers calendarProps={{ color: 'danger', classNames: { cellButton: 'data-[selected=true]:bg-rojo-institucional data-[selected=true]:data-[hover=true]:-bg-rojo-institucional' } }} minValue={fechaInicio || minDateInicio} maxValue={maxDateFin} value={fechaFin || undefined} onChange={(value) => setFechaFin(value)} />
              </div>
            </div>
          </div>
        </div>

        <p className='text-normal mt-8'>Actividades a realizar</p>
        <Divider className='mb-4' />
        <div className='w-full flex flex-col'>
          <div className='w-full flex flex-row'>
            <div className='w-1/4 flex items-start mt-3'>
              <label className='font-medium'>Descripción</label>
            </div>
            <div className='w-1/2'>
              <textarea className='w-full p-3 border border-gris-institucional rounded-[15px] min-h-[100px] resize-none' name='actividades' value={actividades} onChange={(e) => setActividades(e.target.value)} placeholder='Describa las actividades que realizará el estudiante' required />
            </div>
          </div>
        </div>

        <div className='mt-8 w-full flex justify-end'>
          <Boton type='submit' disabled={loading}>{loading ? 'Creando...' : 'Crear contraprestación'}</Boton>
        </div>
      </Form>

      <AlertaModal isOpen={alertaModalOpen} onClose={() => setAlertaModalOpen(false)} message={alertaMessage} type={alertaType} titulo={alertaTitulo} />
    </div>
  )
}

export default CrearContraprestacion