import React, { useRef } from 'react'
import { Form, Divider, DatePicker, Autocomplete, AutocompleteItem } from '@heroui/react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, FileText, X } from 'lucide-react'
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
  const [fechaEntrega, setFechaEntrega] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileName, setFileName] = useState('')
  const [fileError, setFileError] = useState(null)
  const fileInputRef = useRef(null)

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

  const minDate = today(getLocalTimeZone()).subtract({ years: 1 })
  const maxDate = today(getLocalTimeZone()).add({ years: 1 })

  useEffect(() => {
    if (isEstudiante && estudianteIdLocal) {
      setEstudianteId(parseInt(estudianteIdLocal))
    }

    fetch(`${backendUrl}/api/contraprestaciones/tipos`)
      .then(async r => { if (!r.ok) throw new Error(await extraerMensajeError(r)); return r.json() })
      .then(data => setTiposContraprestacion(data))
      .catch(err => showAlerta(err.message, 'error', 'Error al cargar tipos'))

    if (!isEstudiante) {
      fetch(`${backendUrl}/api/estudiantes/listar/estado/1`)
        .then(async r => { if (!r.ok) throw new Error(await extraerMensajeError(r)); return r.json() })
        .then(data => setEstudiantes(data))
        .catch(err => showAlerta(err.message, 'error', 'Error al cargar estudiantes'))
    }
  }, [backendUrl])

  const limpiarCampos = () => {
    if (!isEstudiante) setEstudianteId(null)
    setTipoContraprestacionId(null); setActividades(''); setFechaEntrega(null)
    setSelectedFile(null); setFileName(''); setFileError(null)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]; if (!file) return; setFileError(null)
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!validTypes.includes(file.type)) { setFileError('Solo se permiten archivos PDF o DOCX'); setSelectedFile(null); setFileName(''); return }
    if (file.size > 10 * 1024 * 1024) { setFileError('El archivo no debe exceder los 10MB'); setSelectedFile(null); setFileName(''); return }
    setSelectedFile(file); setFileName(file.name)
  }

  const onSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    if (!estudianteId || !tipoContraprestacionId || !actividades || !fechaEntrega) {
      showAlerta('Por favor complete todos los campos requeridos', 'error', 'Campos incompletos')
      setLoading(false); return
    }
    await crearContraprestacion()
  }

  const crearContraprestacion = async () => {
    const formattedFecha = fechaEntrega ? fechaEntrega.toDate(getLocalTimeZone()).toISOString().split('T')[0] : null
    const contraprestacionDTO = {
      estudianteId, tipoContraprestacionId, actividades,
      fechaInicio: formattedFecha, fechaFin: formattedFecha
    }

    try {
      const formData = new FormData()
      formData.append('datos', JSON.stringify(contraprestacionDTO))
      if (selectedFile) formData.append('archivo', selectedFile)

      const response = await fetch(`${backendUrl}/api/contraprestaciones/crear`, {
        method: 'POST',
        body: formData
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
                    if (id) setTipoContraprestacionId(parseInt(id))
                    else setTipoContraprestacionId(null)
                  }}>
                  {(tipo) => <AutocompleteItem key={tipo.id.toString()}>{tipo.nombre}</AutocompleteItem>}
                </Autocomplete>
              </div>
            </div>
            <div className='w-1/2 flex flex-row'>
              <div className='w-1/3 h-[40px] flex items-center pl-2'>
                <label className='font-medium'>Fecha de entrega del informe</label>
              </div>
              <div className='w-2/3'>
                <DatePicker
                  classNames={{ inputWrapper: 'border border-gris-institucional rounded-[15px] w-full max-h-[40px]' }}
                  className='w-full' labelPlacement='outside' type='date' isRequired
                  firstDayOfWeek='mon' showMonthAndYearPickers
                  calendarProps={{ color: 'danger', classNames: { cellButton: 'data-[selected=true]:bg-rojo-institucional' } }}
                  minValue={minDate} maxValue={maxDate}
                  value={fechaEntrega || undefined} onChange={(value) => setFechaEntrega(value)}
                />
              </div>
            </div>
          </div>
        </div>

        <p className='text-normal mt-8'>Actividades a realizar</p>
        <Divider className='mb-4' />
        <div className='w-full flex flex-row gap-4'>
          <div className='w-1/2 flex flex-row'>
            <div className='w-1/4 flex items-start mt-3'>
              <label className='font-medium'>Descripción</label>
            </div>
            <div className='w-3/4'>
              <textarea className='w-full p-3 border border-gris-institucional rounded-[15px] min-h-[100px] resize-none' name='actividades' value={actividades} onChange={(e) => setActividades(e.target.value)} placeholder='Describa las actividades que realizará el estudiante' required />
            </div>
          </div>

          <div className='w-1/2 flex flex-col'>
            <label className='font-medium mb-2'>Archivo de soporte (PDF o DOCX)</label>
            <input type='file' ref={fileInputRef} className='hidden' onChange={handleFileChange} accept='.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document' />
            <div className='border-2 border-dashed border-gray-300 rounded-lg p-4 text-center'>
              {fileName ? (
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <FileText className='text-rojo-institucional' size={20} />
                    <p className='text-sm font-medium truncate max-w-[180px]'>{fileName}</p>
                  </div>
                  <button type='button' className='p-1 bg-gray-200 rounded-full' onClick={() => { setSelectedFile(null); setFileName('') }}>
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className='h-8 w-8 text-gray-400 mx-auto mb-2' />
                  <p className='text-xs text-gray-500 mb-2'>PDF o DOCX (MÁX. 10MB)</p>
                  <button type='button' onClick={() => fileInputRef.current.click()} className='py-1.5 px-4 border border-rojo-institucional text-rojo-institucional rounded-md hover:bg-rojo-institucional hover:text-white transition-colors text-sm'>
                    Seleccionar archivo
                  </button>
                </>
              )}
            </div>
            {fileError && <p className='text-red-600 mt-1 text-xs'>{fileError}</p>}
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