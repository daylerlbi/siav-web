import { useState, useEffect, useRef } from 'react'
import { Eye, Check, Pencil, Upload, FileText, X, CheckCircle } from 'lucide-react'
import TablaEstados from '../../components/TablaEstados'
import Boton from '../../components/Boton'
import Modal from '../../components/Modal'
import AlertaModal from '../../components/AlertaModal'
import { Textarea, Divider, Form, Autocomplete, AutocompleteItem } from '@heroui/react'
import { useNavigate } from 'react-router-dom'
import { getBackendUrl } from '../../lib/controllers/endpoints'

const Cancelaciones = () => {
  const navigate = useNavigate()
  const [informacion, setInformacion] = useState([])
  const [cargandoCancelaciones, setCargandoCancelaciones] = useState(true)
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false)
  const [currentSolicitud, setCurrentSolicitud] = useState(null)
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const backendUrl = getBackendUrl()

  const [estudiantes, setEstudiantes] = useState([])
  const [estudianteId, setEstudianteId] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [creando, setCreando] = useState(false)
  const [materias, setMaterias] = useState([])
  const [materiaId, setMateriaId] = useState('')

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editSolicitudId, setEditSolicitudId] = useState(null)
  const [editDescripcion, setEditDescripcion] = useState('')
  const [editEstudianteId, setEditEstudianteId] = useState('')
  const [editMateriaId, setEditMateriaId] = useState('')
  const [editando, setEditando] = useState(false)

  const [approving, setApproving] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileName, setFileName] = useState('')
  const [fileError, setFileError] = useState(null)
  const fileInputRef = useRef(null)

  const [alertaModalOpen, setAlertaModalOpen] = useState(false)
  const [alertaMessage, setAlertaMessage] = useState('')
  const [alertaType, setAlertaType] = useState('success')
  const [alertaTitulo, setAlertaTitulo] = useState('')

  const googleToken = localStorage.getItem('googleToken')
  const estudianteIdLocal = localStorage.getItem('estudianteId')
  const isEstudiante = (() => {
    try {
      if (!googleToken) return false
      const payload = JSON.parse(atob(googleToken.split('.')[1]))
      return (payload.role || '').toLowerCase() === 'estudiante'
    } catch { return false }
  })()

  const showAlerta = (mensaje, tipo, titulo) => {
    setAlertaMessage(mensaje)
    setAlertaType(tipo)
    setAlertaTitulo(titulo || (tipo === 'success' ? 'Operación exitosa' : 'Error'))
    setAlertaModalOpen(true)
  }

  useEffect(() => { fetchSolicitudes() }, [])

  const fetchSolicitudes = () => {
    setCargandoCancelaciones(true)
    fetch(`${backendUrl}/api/solicitudes/cancelacion`)
      .then(r => { if (!r.ok) throw new Error('Error al obtener las solicitudes'); return r.json() })
      .then(data => {
        const datosTabla = data
          .filter(s => !isEstudiante || s.estudianteId === parseInt(estudianteIdLocal))
          .map(solicitud => ({
            Id: solicitud.id,
            Estudiante: solicitud.estudianteNombre,
            Materia: solicitud.grupoNombre?.split(' - ')[0] || 'No especificado',
            Grupo: solicitud.grupoCodigo || 'No especificado',
            Semestre: solicitud.semestre,
            'Fecha de Creación': new Date(solicitud.fechaCreacion).toLocaleDateString(),
            Estado: solicitud.estaAprobado ? 'Aprobado' : 'Pendiente',
            estaAprobado: solicitud.estaAprobado || false,
            estudianteId: solicitud.estudianteId,
            grupoCohorteId: solicitud.grupoCohorteId,
            grupoId: solicitud.grupoId,
            descripcion: solicitud.descripcion,
            tipoSolicitudId: solicitud.tipoSolicitudId
          }))
        setInformacion(datosTabla)
      })
      .catch(() => showAlerta('Error al cargar las solicitudes de cancelación', 'error', 'Error de conexión'))
      .finally(() => setCargandoCancelaciones(false))
  }

  const handleViewSolicitud = (solicitud) => { navigate(`${solicitud.Id}`) }

  const handleEditSolicitud = async (solicitud) => {
    setEditSolicitudId(solicitud.Id)
    setEditDescripcion(solicitud.descripcion || '')
    try {
      if (!isEstudiante) await cargarEstudiantes()
      const idEstudiante = isEstudiante ? estudianteIdLocal : solicitud.estudianteId?.toString()
      setEditEstudianteId(idEstudiante || '')
      if (idEstudiante) {
        const materiasDelEstudiante = await cargarMateriasPorEstudiante(idEstudiante)
        if (solicitud.grupoCohorteId && materiasDelEstudiante.length > 0) {
          const materiaEncontrada = materiasDelEstudiante.find(m =>
            m.grupoCohorteId === solicitud.grupoCohorteId || m.id === solicitud.grupoCohorteId ||
            m.grupoId === solicitud.grupoCohorteId || m.matriculaId === solicitud.grupoCohorteId
          )
          setEditMateriaId(materiaEncontrada?.id?.toString() || '')
        } else { setEditMateriaId('') }
      }
      setIsEditModalOpen(true)
    } catch { showAlerta('Error al preparar el formulario de edición', 'error', 'Error de conexión') }
  }

  const handleAprobarSolicitud = (solicitud) => { setCurrentSolicitud(solicitud); setIsApproveModalOpen(true) }

  const handleOpenRegisterModal = async () => {
    if (isEstudiante && estudianteIdLocal) {
      setEstudianteId(estudianteIdLocal)
      await cargarMateriasPorEstudiante(estudianteIdLocal)
    } else {
      await cargarEstudiantes()
    }
    setIsRegisterModalOpen(true)
  }

  const cargarEstudiantes = async () => {
    try {
      const r = await fetch(`${backendUrl}/api/estudiantes/listar/estado/1`)
      if (!r.ok) throw new Error()
      const data = await r.json()
      setEstudiantes(data)
      return data
    } catch { showAlerta('Error al cargar la lista de estudiantes', 'error', 'Error de conexión'); return [] }
  }

  const cargarMateriasPorEstudiante = async (id) => {
    try {
      const r = await fetch(`${backendUrl}/api/matriculas/estudiante/${id}`)
      if (!r.ok) throw new Error()
      const data = await r.json()
      const materiasEnCurso = data.filter(m => m.estadoMatriculaNombre === 'En curso')
      setMaterias(materiasEnCurso)
      return materiasEnCurso
    } catch { showAlerta('Error al cargar las materias del estudiante', 'error', 'Error de conexión'); setMaterias([]); return [] }
  }

  const handleEstudianteChange = (id) => {
    setEstudianteId(id || '')
    if (id) cargarMateriasPorEstudiante(id)
    else setMaterias([])
    setMateriaId('')
  }

  const handleEditEstudianteChange = async (id) => {
    setEditEstudianteId(id || '')
    if (id) {
      const materiasDelEstudiante = await cargarMateriasPorEstudiante(id)
      if (editSolicitudId && informacion) {
        const solicitudActual = informacion.find(s => s.Id === editSolicitudId)
        if (solicitudActual && solicitudActual.estudianteId.toString() === id) {
          const materiaExiste = materiasDelEstudiante.find(m =>
            m.grupoCohorteId === solicitudActual.grupoCohorteId || m.id === solicitudActual.grupoCohorteId ||
            m.grupoId === solicitudActual.grupoCohorteId || m.matriculaId === solicitudActual.grupoCohorteId
          )
          setEditMateriaId(materiaExiste?.id?.toString() || '')
        } else { setEditMateriaId('') }
      }
    } else { setMaterias([]); setEditMateriaId('') }
  }

  const crearSolicitudCancelacion = async (e) => {
    e.preventDefault()
    if (!estudianteId) { showAlerta('Debe seleccionar un estudiante', 'error', 'Campo requerido'); return }
    if (!materiaId) { showAlerta('Debe seleccionar una materia', 'error', 'Campo requerido'); return }
    if (!descripcion.trim()) { showAlerta('Debe ingresar una descripción o motivo', 'error', 'Campo requerido'); return }
    setCreando(true)
    try {
      const r = await fetch(`${backendUrl}/api/solicitudes/cancelacion/crear`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descripcion, estudianteId: parseInt(estudianteId), matriculaId: parseInt(materiaId) })
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.mensaje || data.message || data.error || 'Error al crear la solicitud')
      limpiarFormularioRegistro(); setIsRegisterModalOpen(false); fetchSolicitudes()
      showAlerta(data.mensaje || 'Solicitud de cancelación creada con éxito', 'success', 'Solicitud registrada')
    } catch (error) { showAlerta(error.message, 'error', 'Error de validación') }
    finally { setCreando(false) }
  }

  const limpiarFormularioRegistro = () => { setEstudianteId(''); setMateriaId(''); setDescripcion('') }
  const limpiarFormularioEdicion = () => { setEditSolicitudId(null); setEditDescripcion(''); setEditEstudianteId(''); setEditMateriaId('') }

  const actualizarSolicitudCancelacion = async (e) => {
    e.preventDefault()
    if (!editEstudianteId) { showAlerta('Debe seleccionar un estudiante', 'error', 'Campo requerido'); return }
    if (!editMateriaId) { showAlerta('Debe seleccionar una materia', 'error', 'Campo requerido'); return }
    if (!editDescripcion.trim()) { showAlerta('Debe ingresar una descripción o motivo', 'error', 'Campo requerido'); return }
    setEditando(true)
    try {
      const r = await fetch(`${backendUrl}/api/solicitudes/cancelacion/actualizar/${editSolicitudId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editSolicitudId, descripcion: editDescripcion, estudianteId: parseInt(editEstudianteId), matriculaId: parseInt(editMateriaId) })
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.mensaje || data.message || data.error || 'Error al actualizar la solicitud')
      limpiarFormularioEdicion(); setIsEditModalOpen(false); fetchSolicitudes()
      showAlerta(data.mensaje || 'Solicitud actualizada con éxito', 'success', 'Solicitud actualizada')
    } catch (error) { showAlerta(error.message, 'error', 'Error de validación') }
    finally { setEditando(false) }
  }

  const submitAprobarCancelacion = async () => {
    if (!selectedFile) { setFileError('Debe seleccionar un archivo para aprobar la cancelación'); return }
    setApproving(true); setFileError(null)
    const formData = new FormData(); formData.append('informe', selectedFile)
    const userStorage = JSON.parse(localStorage.getItem('userInfo'))
    const nombreUsuario = userStorage?.nombre || 'Usuario no identificado'
    try {
      const r = await fetch(`${backendUrl}/api/solicitudes/cancelacion/aprobar/${currentSolicitud.Id}`, { method: 'POST', headers: { 'X-Usuario': nombreUsuario }, body: formData })
      if (!r.ok) { const e = await r.json(); throw new Error(e.mensaje || 'Error al aprobar') }
      const data = await r.json()
      fetchSolicitudes(); setIsApproveModalOpen(false); setSelectedFile(null); setFileName('')
      showAlerta(data.mensaje || 'Solicitud aprobada con éxito', 'success', 'Solicitud aprobada')
    } catch (err) { setFileError(err.message); showAlerta(err.message, 'error', 'Error al aprobar') }
    finally { setApproving(false) }
  }

  const previewSelectedFile = () => { if (!selectedFile) return; window.open(URL.createObjectURL(selectedFile), '_blank') }
  const handleFileChange = (e) => {
    const file = e.target.files[0]; if (!file) return; setFileError(null)
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!validTypes.includes(file.type)) { setFileError('Solo se permiten archivos PDF o DOCX'); setSelectedFile(null); setFileName(''); return }
    if (file.size > 10 * 1024 * 1024) { setFileError('El archivo no debe exceder los 10MB'); setSelectedFile(null); setFileName(''); return }
    setSelectedFile(file); setFileName(file.name)
  }
  const openFileSelector = () => { fileInputRef.current.click() }

  const columnas = ['Id', 'Estudiante', 'Materia', 'Grupo', 'Semestre', 'Fecha de Creación', 'Estado']
  const filtros = ['Estudiante', 'Materia', 'Grupo', 'Semestre', 'Estado']

  const accionesPorEstado = {
    false: [
      { icono: <Eye size={18} />, tooltip: 'Ver detalles', accion: handleViewSolicitud },
      { icono: <Pencil size={18} />, tooltip: 'Editar solicitud', accion: handleEditSolicitud },
      ...(!isEstudiante ? [{ icono: <Check size={18} />, tooltip: 'Aprobar solicitud', accion: handleAprobarSolicitud }] : [])
    ],
    true: [{ icono: <Eye size={18} />, tooltip: 'Ver detalles', accion: handleViewSolicitud }]
  }

  return (
    <div className='w-full p-4'>
      <div className='w-full flex items-center justify-between mb-8'>
        <p className='text-center text-titulos flex-1'>Cancelación de Materias</p>
        <Boton onClick={handleOpenRegisterModal} color='danger'>Registrar Cancelación</Boton>
      </div>

      <TablaEstados informacion={informacion} columnas={columnas} filtros={filtros} accionesPorEstado={accionesPorEstado} campoEstado='estaAprobado' elementosPorPagina={10} cargandoContenido={cargandoCancelaciones} />

      <Modal isOpen={isApproveModalOpen} onOpenChange={(open) => { if (!approving) setIsApproveModalOpen(open) }} cabecera='' size='xl'
        cuerpo={
          <div>
            <div className='flex flex-col gap-1 text-center mb-6'><p className='text-2xl font-semibold text-titulos'>Aprobar Solicitud de Cancelación</p></div>
            {currentSolicitud && <p>¿Está seguro que desea aprobar la solicitud de cancelación de la materia <strong>{currentSolicitud.Materia}</strong> para el estudiante <strong>{currentSolicitud.Estudiante}</strong>?</p>}
            <p className='mt-2 mb-1'>Esta acción cancelará la materia {currentSolicitud?.Materia} del grupo {currentSolicitud?.Grupo} para el semestre {currentSolicitud?.Semestre}.</p>
            <p className='text-normal mt-6 mb-2'>Documento de Soporte (PDF o DOCX)</p>
            <Divider className='mb-4' />
            <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center relative'>
              <input type='file' ref={fileInputRef} className='hidden' onChange={handleFileChange} accept='.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document' />
              {fileName ? (
                <div className='flex flex-col'>
                  <div className='flex items-center justify-center'>
                    <div className='flex-grow text-left'><div className='flex items-center'><FileText className='text-rojo-institucional mr-2' /><p className='font-medium'>{fileName}</p></div></div>
                    <button className='ml-2 p-1 bg-gray-200 rounded-full' onClick={() => { setSelectedFile(null); setFileName('') }} disabled={approving}><X size={16} /></button>
                  </div>
                  <div className='flex justify-center mt-4'><Boton onClick={previewSelectedFile} variant='bordered' color='primary' startContent={<FileText size={18} />} disabled={!selectedFile}>Previsualizar Documento</Boton></div>
                </div>
              ) : (
                <>
                  <Upload className='h-12 w-12 text-gray-400 mx-auto mb-2' />
                  <p className='text-sm text-gray-500 mb-1'>Haga clic para cargar o arrastre y suelte</p>
                  <p className='text-xs text-gray-400'>PDF o DOCX (MÁX. 10MB)</p>
                  <button onClick={openFileSelector} className='mt-4 py-1.5 px-4 border border-rojo-institucional text-rojo-institucional rounded-md hover:bg-rojo-institucional hover:text-white transition-colors' disabled={approving}>Seleccionar archivo</button>
                </>
              )}
            </div>
            {fileError && <p className='text-red-600 mt-2 text-sm'>{fileError}</p>}
          </div>
        }
        footer={<div className='flex justify-end w-full'><Boton color='success' onClick={submitAprobarCancelacion} disabled={approving || !selectedFile} startContent={approving ? null : <CheckCircle size={18} />}>{approving ? 'Aprobando...' : 'Aprobar'}</Boton></div>}
      />

      <Modal isOpen={isRegisterModalOpen} onOpenChange={(open) => { setIsRegisterModalOpen(open); if (!open) limpiarFormularioRegistro() }} cabecera='Registrar Cancelación de Materia' size='xl'
        cuerpo={
          <Form className='flex flex-col gap-4' onSubmit={crearSolicitudCancelacion}>
            {!isEstudiante && (
              <div className='w-full py-4'>
                <Autocomplete variant='bordered' className='w-full' defaultItems={estudiantes} selectedKey={estudianteId} label='Estudiante' size='md' placeholder='Selecciona el estudiante' labelPlacement='outside' isRequired onSelectionChange={handleEstudianteChange}>
                  {(estudiante) => <AutocompleteItem key={estudiante.id.toString()}>{`${estudiante.nombre || ''} ${estudiante.nombre2 || ''} ${estudiante.apellido || ''} ${estudiante.apellido2 || ''} - ${estudiante.codigo || ''}`}</AutocompleteItem>}
                </Autocomplete>
              </div>
            )}
            <div className='w-full py-4'>
              <Autocomplete variant='bordered' className='w-full' defaultItems={materias} selectedKey={materiaId} label='Materia a Cancelar' size='md' placeholder='Selecciona la materia' labelPlacement='outside' isRequired isDisabled={!estudianteId} onSelectionChange={(id) => setMateriaId(id || '')}>
                {(materia) => <AutocompleteItem key={materia.id.toString()}>{`${materia.nombreMateria || ''} - ${materia.grupoNombre?.split(' - ')[1] || 'Sin grupo'} (${materia.codigoMateria || ''})`}</AutocompleteItem>}
              </Autocomplete>
            </div>
            <div className='w-full'>
              <p className='font-medium mb-2'>Motivo de la Solicitud</p>
              <Textarea classNames={{ inputWrapper: 'border border-gris-institucional rounded-[15px] w-full' }} placeholder='Ingrese el motivo detallado para la cancelación de la materia' value={descripcion} onChange={(e) => setDescripcion(e.target.value)} minRows={4} isRequired />
            </div>
            <div className='w-full flex justify-end mb-[-20px]'><Boton type='submit' disabled={creando}>{creando ? 'Creando...' : 'Registrar Cancelación'}</Boton></div>
          </Form>
        }
      />

      <Modal isOpen={isEditModalOpen} onOpenChange={(open) => { setIsEditModalOpen(open); if (!open) limpiarFormularioEdicion() }} cabecera='Editar Solicitud de Cancelación' size='xl'
        cuerpo={
          <Form className='flex flex-col gap-4' onSubmit={actualizarSolicitudCancelacion}>
            {!isEstudiante && (
              <div className='w-full py-4'>
                <Autocomplete variant='bordered' className='w-full' defaultItems={estudiantes} selectedKey={editEstudianteId} label='Estudiante' size='md' placeholder='Selecciona el estudiante' labelPlacement='outside' isRequired onSelectionChange={handleEditEstudianteChange}>
                  {(estudiante) => <AutocompleteItem key={estudiante.id.toString()}>{`${estudiante.nombre || ''} ${estudiante.nombre2 || ''} ${estudiante.apellido || ''} ${estudiante.apellido2 || ''} - ${estudiante.codigo || ''}`}</AutocompleteItem>}
                </Autocomplete>
              </div>
            )}
            <div className='w-full py-4'>
              <Autocomplete variant='bordered' className='w-full' defaultItems={materias} selectedKey={editMateriaId} label='Materia a Cancelar' size='md' placeholder='Selecciona la materia' labelPlacement='outside' isRequired isDisabled={!editEstudianteId} onSelectionChange={(id) => setEditMateriaId(id || '')}>
                {(materia) => <AutocompleteItem key={materia.id.toString()}>{`${materia.nombreMateria || ''} - ${materia.grupoNombre?.split(' - ')[1] || 'Sin grupo'} (${materia.codigoMateria || ''})`}</AutocompleteItem>}
              </Autocomplete>
            </div>
            <div className='w-full'>
              <p className='font-medium mb-2'>Motivo de la Solicitud</p>
              <Textarea classNames={{ inputWrapper: 'border border-gris-institucional rounded-[15px] w-full' }} placeholder='Ingrese el motivo detallado para la cancelación de la materia' value={editDescripcion} onChange={(e) => setEditDescripcion(e.target.value)} minRows={4} isRequired />
            </div>
            <div className='w-full flex justify-end mb-[-20px]'><Boton type='submit' color='success' disabled={editando}>{editando ? 'Actualizando...' : 'Actualizar Cancelación'}</Boton></div>
          </Form>
        }
      />

      <AlertaModal isOpen={alertaModalOpen} onClose={() => setAlertaModalOpen(false)} message={alertaMessage} type={alertaType} titulo={alertaTitulo} />
    </div>
  )
}

export default Cancelaciones