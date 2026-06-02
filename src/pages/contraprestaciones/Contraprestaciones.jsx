import { useState, useEffect, useRef } from 'react'
import TablaEstados from '../../components/TablaEstados'
import { Pencil, Eye, Check, FileCheck, Upload, X, FileText, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Boton from '../../components/Boton'
import Modal from '../../components/Modal'
import AlertaModal from '../../components/AlertaModal'
import { Divider } from '@heroui/react'
import { getBackendUrl } from '../../lib/controllers/endpoints'

const Contraprestaciones = () => {
  const [informacion, setInformacion] = useState([])
  const [cargandoContraprestaciones, setCargandoContraprestaciones] = useState(true)
  const backendUrl = getBackendUrl()
  const navigate = useNavigate()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileName, setFileName] = useState('')
  const [fileError, setFileError] = useState(null)
  const [approving, setApproving] = useState(false)
  const [currentContraprestacion, setCurrentContraprestacion] = useState(null)
  const fileInputRef = useRef(null)
  const [generatingCertificate, setGeneratingCertificate] = useState(false)

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
    setAlertaMessage(mensaje); setAlertaType(tipo)
    setAlertaTitulo(titulo || (tipo === 'success' ? 'Operación exitosa' : 'Error'))
    setAlertaModalOpen(true)
  }

  useEffect(() => { fetchContraprestaciones() }, [backendUrl])

  const fetchContraprestaciones = () => {
    setCargandoContraprestaciones(true)
    fetch(`${backendUrl}/api/contraprestaciones`)
      .then(r => { if (!r.ok) throw new Error('Error al obtener contraprestaciones'); return r.json() })
      .then(data => {
        const datosTablas = data
          .filter(c => !isEstudiante || c.estudianteId === parseInt(estudianteIdLocal))
          .map(contraprestacion => ({
            Id: contraprestacion.id, Estudiante: contraprestacion.estudianteNombre,
            'Tipo de Contraprestación': contraprestacion.tipoContraprestacionNombre,
            Porcentaje: contraprestacion.porcentajeContraprestacion, Semestre: contraprestacion.semestre,
            'Fecha de Creación': new Date(contraprestacion.fechaCreacion).toLocaleDateString(),
            Estado: contraprestacion.aprobada ? 'Aprobado' : 'Pendiente',
            aprobada: contraprestacion.aprobada
          }))
        setInformacion(datosTablas)
      })
      .catch(error => showAlerta(`Error al cargar las contraprestaciones: ${error.message}`, 'error', 'Error de conexión'))
      .finally(() => setCargandoContraprestaciones(false))
  }

  const handleViewContraprestacion = (c) => { navigate(`${c.Id}`) }

  const handleAprobarContraprestacion = (c) => {
    if (c.aprobada) { showAlerta('Esta contraprestación ya ha sido aprobada anteriormente.', 'error', 'Operación no permitida'); return }
    setCurrentContraprestacion(c); setIsModalOpen(true); setSelectedFile(null); setFileName(''); setFileError(null)
  }

  const handleEditContraprestacion = (c) => {
    if (c.aprobada) { showAlerta('No se puede editar una contraprestación ya aprobada', 'error', 'Operación no permitida'); return }
    navigate(`editar/${c.Id}`)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]; if (!file) return; setFileError(null)
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!validTypes.includes(file.type)) { setFileError('Solo se permiten archivos PDF o DOCX'); setSelectedFile(null); setFileName(''); return }
    if (file.size > 10 * 1024 * 1024) { setFileError('El archivo no debe exceder los 10MB'); setSelectedFile(null); setFileName(''); return }
    setSelectedFile(file); setFileName(file.name)
  }
  const openFileSelector = () => { fileInputRef.current.click() }
  const previewSelectedFile = () => { if (!selectedFile) return; window.open(URL.createObjectURL(selectedFile), '_blank') }

  const submitAprobarContraprestacion = async () => {
    if (!selectedFile) { setFileError('Debe seleccionar un archivo para aprobar la contraprestación'); return }
    setApproving(true); setFileError(null)
    const formData = new FormData(); formData.append('informe', selectedFile)
    const userStorage = JSON.parse(localStorage.getItem('userInfo'))
    const nombreUsuario = userStorage?.nombre || 'Usuario no identificado'
    try {
      const r = await fetch(`${backendUrl}/api/contraprestaciones/aprobar/${currentContraprestacion.Id}`, { method: 'POST', body: formData, headers: { 'X-Usuario': nombreUsuario } })
      const data = await r.json().catch(() => ({ mensaje: r.ok ? 'Contraprestación aprobada con éxito' : 'Error al aprobar' }))
      if (!r.ok) throw new Error(data.mensaje || 'Error al aprobar la contraprestación')
      fetchContraprestaciones(); setIsModalOpen(false)
      showAlerta(data.mensaje || 'Contraprestación aprobada con éxito', 'success', 'Aprobación exitosa')
    } catch (err) { setFileError(err.message); showAlerta(err.message, 'error', 'Error al aprobar') }
    finally { setApproving(false) }
  }

  const handleGenerarCertificado = async (c) => {
    if (!c.aprobada) { showAlerta('No se puede generar un certificado para una contraprestación no aprobada', 'error', 'Operación no permitida'); return }
    try {
      setGeneratingCertificate(true)
      const r = await fetch(`${backendUrl}/api/contraprestaciones/generar/certificado/${c.Id}`, { method: 'POST', headers: { Accept: 'application/pdf' } })
      if (!r.ok) { const ct = r.headers.get('content-type'); const err = ct?.includes('application/json') ? await r.json() : {}; throw new Error(err.mensaje || 'Error al generar el certificado') }
      const blob = await r.blob(); const url = window.URL.createObjectURL(blob)
      const cd = r.headers.get('Content-Disposition')
      let fn = 'certificado_contraprestacion.pdf'
      if (cd?.includes('filename=')) fn = cd.split('filename=')[1].replace(/"/g, '')
      const link = document.createElement('a'); link.href = url; link.setAttribute('download', fn); document.body.appendChild(link); link.click(); document.body.removeChild(link); window.URL.revokeObjectURL(url)
      showAlerta('Certificado generado y descargado correctamente', 'success', 'Certificado generado')
      fetchContraprestaciones()
    } catch (error) { showAlerta(`Error al generar el certificado: ${error.message}`, 'error', 'Error de generación') }
    finally { setGeneratingCertificate(false) }
  }

  const columnas = ['Id', 'Estudiante', 'Tipo de Contraprestación', 'Porcentaje', 'Semestre', 'Fecha de Creación', 'Estado']
  const filtros = ['Estudiante', 'Tipo de Contraprestación', 'Semestre']

  const accionesPorEstado = {
    true: [
      { icono: <Eye size={18} />, tooltip: 'Ver', accion: handleViewContraprestacion },
      { icono: <FileCheck size={18} />, tooltip: 'Generar Certificado', accion: handleGenerarCertificado }
    ],
    false: [
      { icono: <Eye size={18} />, tooltip: 'Ver', accion: handleViewContraprestacion },
      ...(!isEstudiante ? [
        { icono: <Pencil size={18} />, tooltip: 'Editar', accion: handleEditContraprestacion },
        { icono: <Check size={18} />, tooltip: 'Aprobar', accion: handleAprobarContraprestacion }
      ] : [])
    ]
  }

  return (
    <div className='w-full p-4 relative'>
      <div className='w-full flex items-center justify-between mb-8'>
        <p className='text-center text-titulos flex-1'>Lista de Contraprestaciones</p>
        <Boton onClick={() => navigate('crear')}>Crear Contraprestación</Boton>
      </div>
      <TablaEstados informacion={informacion} columnas={columnas} filtros={filtros} accionesPorEstado={accionesPorEstado} campoEstado='aprobada' elementosPorPagina={10} cargandoContenido={cargandoContraprestaciones} />

      <Modal isOpen={isModalOpen} onOpenChange={(open) => { if (!approving) setIsModalOpen(open) }} cabecera='' size='xl'
        cuerpo={
          <div>
            <div className='flex flex-col gap-1 text-center mb-6'><p className='text-2xl font-semibold text-titulos'>Aprobar Contraprestación</p></div>
            {currentContraprestacion && <p>¿Estás seguro que quieres aprobar la contraprestación de {currentContraprestacion.Estudiante} realizada en el semestre {currentContraprestacion.Semestre}?</p>}
            <p className='text-normal mt-6 mb-2'>Informe de Contraprestación (PDF o DOCX)</p>
            <Divider className='mb-4' />
            <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center relative'>
              <input type='file' ref={fileInputRef} className='hidden' onChange={handleFileChange} accept='.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document' />
              {fileName ? (
                <div className='flex items-center justify-center'>
                  <div className='flex-grow text-left'><div className='flex items-center'><FileText className='text-rojo-institucional mr-2' /><p className='font-medium'>{fileName}</p></div></div>
                  <button className='ml-2 p-1 bg-gray-200 rounded-full' onClick={() => { setSelectedFile(null); setFileName('') }} disabled={approving}><X size={16} /></button>
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
            {fileName && <div className='flex justify-center mt-4'><Boton onClick={previewSelectedFile} variant='bordered' color='primary' startContent={<FileText size={18} />}>Previsualizar Documento</Boton></div>}
            {fileError && <p className='text-red-600 mt-2 text-sm'>{fileError}</p>}
          </div>
        }
        footer={<div className='flex justify-end w-full'><Boton onClick={submitAprobarContraprestacion} disabled={approving || !selectedFile} startContent={approving ? null : <CheckCircle size={18} />}>{approving ? 'Aprobando...' : 'Aprobar'}</Boton></div>}
      />

      <AlertaModal isOpen={alertaModalOpen} onClose={() => setAlertaModalOpen(false)} message={alertaMessage} type={alertaType} titulo={alertaTitulo} />
    </div>
  )
}

export default Contraprestaciones