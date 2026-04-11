import { useState, useEffect } from 'react'
import Tabla from '../../components/Tabla'
import { Pencil, Eye } from 'lucide-react'
import Modal from '../../components/Modal'
import Boton from '../../components/Boton'
import AlertaModal from '../../components/AlertaModal'
import { Input } from '@heroui/react'
import { getBackendUrl } from '../../lib/controllers/endpoints'

const Cohortes = () => {
  const [informacion, setInformacion] = useState([])
  const [selectedCohorte, setSelectedCohorte] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({ nombre: '' })
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [cohorteDetails, setCohorteDetails] = useState(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createFormData, setCreateFormData] = useState({ nombre: '' })
  const [alertaModalOpen, setAlertaModalOpen] = useState(false)
  const [alertaMessage, setAlertaMessage] = useState('')
  const [alertaType, setAlertaType] = useState('success')
  const [alertaTitulo, setAlertaTitulo] = useState('')
  const [cargandoCohortes, setCargandoCohortes] = useState(true)
  const backendUrl = getBackendUrl()

  // ← NUEVO: detectar si es usuario de Google
  const googleToken = localStorage.getItem('googleToken')
  const isGoogleUser = !!googleToken

  const showAlerta = (mensaje, tipo, titulo) => {
    setAlertaMessage(mensaje)
    setAlertaType(tipo)
    setAlertaTitulo(titulo || (tipo === 'success' ? 'Operación exitosa' : 'Error'))
    setAlertaModalOpen(true)
  }

  useEffect(() => {
    fetchCohortes()
  }, [])

  const fetchCohortes = () => {
    setCargandoCohortes(true)
    fetch(`${backendUrl}/api/cohortes/listar`)
      .then((response) => response.json())
      .then((data) => {
        const datosTabla = data.map((cohorte) => ({
          ...cohorte,
          Id: cohorte.id,
          Nombre: cohorte.nombre,
          'Fecha de creación': new Date(cohorte.fechaCreacion).toLocaleDateString()
        }))
        setInformacion(datosTabla)
      })
      .catch(() => {
        showAlerta('Error al cargar la lista de cohortes', 'error', 'Error de conexión')
      })
      .finally(() => {
        setCargandoCohortes(false)
      })
  }

  const handleViewCohorte = (cohorte) => {
    fetch(`${backendUrl}/api/cohortes/${cohorte.id}`)
      .then((response) => response.json())
      .then((data) => {
        setCohorteDetails(data)
        setIsViewModalOpen(true)
      })
      .catch(() => {
        showAlerta('Error al obtener los detalles de la cohorte', 'error', 'Error de conexión')
      })
  }

  const handleEditCohorte = (cohorte) => {
    setSelectedCohorte(cohorte)
    setEditFormData({ nombre: cohorte.nombre })
    setIsEditModalOpen(true)
  }

  const handleEditSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault()
    const cohorteDTO = {
      nombre: editFormData.nombre,
      fechaCreacion: selectedCohorte.fechaCreacion
    }
    fetch(`${backendUrl}/api/cohortes/${selectedCohorte.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cohorteDTO)
    })
      .then((response) => {
        if (response.ok) return response.json()
        return response.json().then((data) => { throw new Error(data.mensaje || 'Error al actualizar la cohorte') })
      })
      .then((data) => {
        setIsEditModalOpen(false)
        fetchCohortes()
        showAlerta(data.mensaje || 'Cohorte actualizada exitosamente', 'success', 'Cohorte actualizada')
      })
      .catch((error) => { showAlerta(error.message, 'error', 'Error al actualizar') })
  }

  const handleCreateSubmit = () => {
    if (!createFormData.nombre.trim()) {
      showAlerta('El nombre de la cohorte es requerido', 'error', 'Campos incompletos')
      return
    }
    const cohorteDTO = { nombre: createFormData.nombre }
    fetch(`${backendUrl}/api/cohortes/crear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cohorteDTO)
    })
      .then((response) => {
        if (response.ok) return response.json()
        return response.json().then((data) => { throw new Error(data.mensaje || 'Error al crear la cohorte') })
      })
      .then((data) => {
        setIsCreateModalOpen(false)
        setCreateFormData({ nombre: '' })
        fetchCohortes()
        showAlerta(data.mensaje || 'Cohorte creada exitosamente', 'success', 'Cohorte creada')
      })
      .catch((error) => { showAlerta(error.message, 'error', 'Error al crear') })
  }

  const columnas = ['Id', 'Nombre', 'Fecha de creación']
  const filtros = ['Nombre']
  const acciones = [
    { icono: <Eye size={18} />, tooltip: 'Ver detalles', accion: handleViewCohorte },
    { icono: <Pencil size={18} />, tooltip: 'Editar', accion: handleEditCohorte }
  ]

  const accionesSoloVer = [
    { icono: <Eye size={18} />, tooltip: 'Ver detalles', accion: handleViewCohorte }
  ]

  return (
    <div className='w-full p-4'>
      <div className='w-full flex items-center justify-between mb-8'>
        <p className='text-center text-titulos flex-1'>Lista de Cohortes</p>
        {!isGoogleUser && (
          <Boton onClick={() => setIsCreateModalOpen(true)} color='danger'>
            Crear cohorte
          </Boton>
        )}
      </div>

      <Tabla
        informacion={informacion}
        columnas={columnas}
        filtros={filtros}
        acciones={isGoogleUser ? accionesSoloVer : acciones}
        elementosPorPagina={10}
        cargandoContenido={cargandoCohortes}
      />

      <Modal
        isOpen={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        cabecera='Detalles de la Cohorte'
        size='5xl'
        cuerpo={
          cohorteDetails && (
            <div className='w-full flex flex-col'>
              <div className='w-full grid grid-cols-2 gap-4 mb-4'>
                <div>
                  <Input
                    classNames={{
                      label: `w-1/3 h-[40px] flex items-center group-data-[has-helper=true]:pt-0`,
                      base: 'flex items-start',
                      inputWrapper: 'border border-gris-institucional rounded-[15px] w-full max-h-[40px]',
                      mainWrapper: 'w-full'
                    }}
                    label='Nombre'
                    labelPlacement='outside-left'
                    name='nombre'
                    type='text'
                    readOnly
                    value={cohorteDetails.nombre || ''}
                  />
                </div>
                <div>
                  <Input
                    classNames={{
                      label: `w-1/3 h-[40px] flex items-center group-data-[has-helper=true]:pt-0`,
                      base: 'flex items-start',
                      inputWrapper: 'border border-gris-institucional rounded-[15px] w-full max-h-[40px]',
                      mainWrapper: 'w-full'
                    }}
                    label='Fecha de Creación'
                    labelPlacement='outside-left'
                    name='fechaCreacion'
                    type='text'
                    readOnly
                    value={new Date(cohorteDetails.fechaCreacion).toLocaleDateString()}
                  />
                </div>
              </div>

              <div className='w-full mb-4'>
                <p className='font-medium mb-2'>Grupos asociados</p>
                {cohorteDetails.cohortesGrupos && cohorteDetails.cohortesGrupos.length > 0 ? (
                  <div className='flex flex-row gap-4'>
                    <div className='w-1/2'>
                      <Input
                        classNames={{
                          label: `mb-2`,
                          base: 'flex flex-col w-full',
                          inputWrapper: 'border border-gris-institucional rounded-[15px] w-full max-h-[40px]'
                        }}
                        label='Grupo A'
                        labelPlacement='outside'
                        name='grupoA'
                        type='text'
                        readOnly
                        value={cohorteDetails.cohortesGrupos[0]?.nombre || 'No asignado'}
                      />
                    </div>
                    <div className='w-1/2'>
                      {cohorteDetails.cohortesGrupos.length > 1 ? (
                        <Input
                          classNames={{
                            label: `mb-2`,
                            base: 'flex flex-col w-full',
                            inputWrapper: 'border border-gris-institucional rounded-[15px] w-full max-h-[40px]'
                          }}
                          label='Grupo B'
                          labelPlacement='outside'
                          name='grupoB'
                          type='text'
                          readOnly
                          value={cohorteDetails.cohortesGrupos[1]?.nombre || 'No asignado'}
                        />
                      ) : (
                        <Input
                          classNames={{
                            label: `mb-2`,
                            base: 'flex flex-col w-full',
                            inputWrapper: 'border border-gris-institucional rounded-[15px] w-full max-h-[40px]'
                          }}
                          label='Grupo B'
                          labelPlacement='outside'
                          name='grupoB'
                          type='text'
                          readOnly
                          value='No asignado'
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className='text-center p-4 border border-gris-institucional rounded-[15px] text-gray-500'>
                    No hay grupos asociados a esta cohorte
                  </div>
                )}
              </div>
            </div>
          )
        }
      />

      <Modal
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        cabecera={`Editar cohorte: ${selectedCohorte?.nombre || ''}`}
        size='md'
        cuerpo={
          <form className='space-y-4'>
            <div className='flex flex-col gap-1'>
              <label className='text-sm'>Nombre del cohorte *</label>
              <div className='border border-gris-institucional rounded-[15px] px-3 py-2'>
                <input
                  className='w-full outline-none bg-transparent text-sm'
                  placeholder='Ej: 2025-I'
                  value={editFormData.nombre}
                  onChange={(e) => setEditFormData({ ...editFormData, nombre: e.target.value })}
                />
              </div>
            </div>
          </form>
        }
        footer={
          <Boton onClick={handleEditSubmit} color='danger'>
            Guardar cambios
          </Boton>
        }
      />

      <Modal
        isOpen={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        cabecera='Crear nuevo cohorte'
        size='md'
        cuerpo={
          <form className='space-y-4'>
            <div className='flex flex-col gap-1'>
              <label className='text-sm'>Nombre del cohorte *</label>
              <div className='border border-gris-institucional rounded-[15px] px-3 py-2'>
                <input
                  className='w-full outline-none bg-transparent text-sm'
                  placeholder='Ej: 2025-I'
                  value={createFormData.nombre}
                  onChange={(e) => setCreateFormData({ ...createFormData, nombre: e.target.value })}
                />
              </div>
            </div>
          </form>
        }
        footer={
          <Boton onClick={handleCreateSubmit} color='danger'>
            Crear cohorte
          </Boton>
        }
      />

      <AlertaModal
        isOpen={alertaModalOpen}
        onClose={() => setAlertaModalOpen(false)}
        message={alertaMessage}
        type={alertaType}
        titulo={alertaTitulo}
      />
    </div>
  )
}

export default Cohortes