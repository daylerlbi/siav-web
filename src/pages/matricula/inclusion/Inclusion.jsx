import { useEffect, useState } from 'react'
import { ClipboardList, Users } from 'lucide-react'
import Tabla from '../../../components/Tabla'
import { useNavigate } from 'react-router-dom'
import { getBackendUrl } from '../../../lib/controllers/endpoints'
import Modal from '../../../components/Modal'
import Boton from '../../../components/Boton'
import AlertaModal from '../../../components/AlertaModal'
import { Autocomplete, AutocompleteItem } from '@heroui/react'

const Inclusion = () => {
  const [estudiantes, setEstudiantes] = useState([])
  const [transformedEstudiantes, setTransformedEstudiantes] = useState([])
  const [cargandoEstudiantes, setCargandoEstudiantes] = useState(true)
  const Navigate = useNavigate()
  const backendUrl = getBackendUrl()

  // Estados para matrícula por lote
  const [isLoteModalOpen, setIsLoteModalOpen] = useState(false)
  const [grupos, setGrupos] = useState([])
  const [cargandoGrupos, setCargandoGrupos] = useState(false)
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null)
  const [estudiantesSeleccionados, setEstudiantesSeleccionados] = useState([])
  const [matriculando, setMatriculando] = useState(false)
  const [paso, setPaso] = useState(1) // 1: seleccionar grupo, 2: seleccionar estudiantes

  const [alertaModalOpen, setAlertaModalOpen] = useState(false)
  const [alertaMessage, setAlertaMessage] = useState('')
  const [alertaType, setAlertaType] = useState('success')
  const [alertaTitulo, setAlertaTitulo] = useState('')

  const showAlerta = (mensaje, tipo, titulo) => {
    setAlertaMessage(mensaje)
    setAlertaType(tipo)
    setAlertaTitulo(titulo || (tipo === 'success' ? 'Operación exitosa' : 'Error'))
    setAlertaModalOpen(true)
  }

  const obtenerEstudiantes = async () => {
    setCargandoEstudiantes(true)
    try {
      const response = await fetch(`${backendUrl}/api/estudiantes/listar/estado/1`)
      const data = await response.json()
      setEstudiantes(data)
    } catch (error) {
      console.error('Error fetching estudiantes:', error)
    } finally {
      setCargandoEstudiantes(false)
    }
  }

  const obtenerGrupos = async () => {
    setCargandoGrupos(true)
    try {
      const response = await fetch(`${backendUrl}/api/grupos/vinculados`)
      const data = await response.json()
      setGrupos(data)
    } catch (error) {
      showAlerta('Error al cargar los grupos', 'error', 'Error de conexión')
    } finally {
      setCargandoGrupos(false)
    }
  }

  useEffect(() => {
    obtenerEstudiantes()
    localStorage.removeItem('estudianteMatricula')
    localStorage.removeItem('materiaMatricular')
  }, [])

  useEffect(() => {
    if (estudiantes.length > 0) {
      const transformed = estudiantes.map((estudiante) => {
        const nombreUnido = [
          estudiante.nombre,
          estudiante.nombre2,
          estudiante.apellido,
          estudiante.apellido2
        ].filter(Boolean).join(' ')

        return {
          Id: estudiante.id,
          Código: estudiante.codigo,
          Cohorte: estudiante.cohorteNombre,
          Estudiante: nombreUnido,
          email: estudiante.email,
          telefono: estudiante.telefono,
          fechaNacimiento: estudiante.fechaNacimiento,
          fechaIngreso: estudiante.fechaIngreso,
          esPosgrado: estudiante.esPosgrado,
          pensumId: estudiante.pensumId,
          pensumNombre: estudiante.pensumNombre,
          programaId: estudiante.programaId,
          programaNombre: estudiante.programaNombre,
          estadoEstudianteId: estudiante.estadoEstudianteId,
          estadoEstudianteNombre: estudiante.estadoEstudianteNombre,
          usuarioId: estudiante.usuarioId
        }
      })
      setTransformedEstudiantes(transformed)
    }
  }, [estudiantes])

  const columnas = ['Id', 'Estudiante', 'Código', 'Cohorte']
  const filtros = ['Estudiante', 'Código', 'Cohorte']

  const acciones = [
    {
      icono: <ClipboardList className='text-[25px]' />,
      tooltip: 'Matricular materias',
      accion: (estudiante) => Navigate(`matricular/${estudiante.Id}`)
    }
  ]

  // --- Lote ---
  const abrirModalLote = () => {
    obtenerGrupos()
    setGrupoSeleccionado(null)
    setEstudiantesSeleccionados([])
    setPaso(1)
    setIsLoteModalOpen(true)
  }

  const toggleEstudiante = (estudiante) => {
    setEstudiantesSeleccionados(prev => {
      const existe = prev.find(e => e.Id === estudiante.Id)
      if (existe) return prev.filter(e => e.Id !== estudiante.Id)
      return [...prev, estudiante]
    })
  }

  const seleccionarTodos = () => {
    if (estudiantesSeleccionados.length === transformedEstudiantes.length) {
      setEstudiantesSeleccionados([])
    } else {
      setEstudiantesSeleccionados([...transformedEstudiantes])
    }
  }

  const matricularLote = async () => {
    if (!grupoSeleccionado) { showAlerta('Debe seleccionar un grupo', 'error', 'Campo requerido'); return }
    if (estudiantesSeleccionados.length === 0) { showAlerta('Debe seleccionar al menos un estudiante', 'error', 'Campo requerido'); return }

    setMatriculando(true)
    const userStorage = JSON.parse(localStorage.getItem('userInfo'))
    const nombreUsuario = userStorage?.nombre || 'Usuario no identificado'

    const matriculas = estudiantesSeleccionados.map(e => ({
      estudianteId: e.Id,
      grupoCohorteId: grupoSeleccionado.id,
      nuevaMatricula: true
    }))

    try {
      const response = await fetch(`${backendUrl}/api/matriculas/crear/lote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Usuario': nombreUsuario },
        body: JSON.stringify(matriculas)
      })
      const data = await response.json()
      setIsLoteModalOpen(false)
      showAlerta(data.message || 'Matrículas procesadas correctamente', 'success', 'Matrícula por lote')
    } catch {
      showAlerta('Error al procesar las matrículas', 'error', 'Error de conexión')
    } finally {
      setMatriculando(false)
    }
  }

  return (
    <div className='p-4 flex flex-col w-full items-center'>
      <div className='w-full flex items-center justify-between mb-8'>
        <p className='text-center text-titulos flex-1'>Inclusión de materias</p>
        <Boton onClick={abrirModalLote}>
          <div className='flex items-center gap-2'>
            <Users size={18} />
            <span>Matricular por lote</span>
          </div>
        </Boton>
      </div>
      <div className='w-full'>
        <Tabla
          informacion={transformedEstudiantes}
          columnas={columnas}
          acciones={acciones}
          filtros={filtros}
          cargandoContenido={cargandoEstudiantes}
        />
      </div>

      {/* Modal matrícula por lote */}
      <Modal
        isOpen={isLoteModalOpen}
        onOpenChange={(open) => { if (!matriculando) setIsLoteModalOpen(open) }}
        size='3xl'
        cabecera={paso === 1 ? 'Paso 1: Seleccionar grupo' : 'Paso 2: Seleccionar estudiantes'}
        cuerpo={
          <div className='flex flex-col gap-4'>
            {paso === 1 && (
              <div className='flex flex-col gap-4'>
                <p className='text-sm text-gray-500'>Selecciona el grupo al que deseas matricular estudiantes.</p>
                {cargandoGrupos ? (
                  <p className='text-center text-gray-400'>Cargando grupos...</p>
                ) : (
                  <Autocomplete
                    variant='bordered'
                    className='w-full'
                    defaultItems={grupos}
                    label='Grupo'
                    size='md'
                    placeholder='Selecciona el grupo'
                    labelPlacement='outside'
                    onSelectionChange={(id) => {
                      const g = grupos.find(g => g.id?.toString() === id?.toString())
                      setGrupoSeleccionado(g || null)
                    }}
                  >
                    {(grupo) => (
                      <AutocompleteItem key={grupo.id?.toString()}>
                        {`${grupo.codigoGrupo || ''} - ${grupo.grupoNombre || ''}`}
                      </AutocompleteItem>
                    )}
                  </Autocomplete>
                )}
                <div className='flex justify-end'>
                  <Boton onClick={() => { if (!grupoSeleccionado) { showAlerta('Debe seleccionar un grupo', 'error', 'Campo requerido'); return } setPaso(2) }}>
                    Siguiente
                  </Boton>
                </div>
              </div>
            )}

            {paso === 2 && (
              <div className='flex flex-col gap-4'>
                <p className='text-sm text-gray-500'>
                  Grupo seleccionado: <strong>{grupoSeleccionado?.codigoGrupo} - {grupoSeleccionado?.grupoNombre}</strong>
                </p>
                <div className='flex items-center justify-between'>
                  <p className='text-sm font-medium'>{estudiantesSeleccionados.length} estudiante(s) seleccionado(s)</p>
                  <button onClick={seleccionarTodos} className='text-sm text-rojo-institucional hover:underline'>
                    {estudiantesSeleccionados.length === transformedEstudiantes.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                  </button>
                </div>
                <div className='max-h-[350px] overflow-y-auto border rounded-lg'>
                  <table className='min-w-full divide-y divide-gray-200'>
                    <thead className='bg-gray-50 sticky top-0'>
                      <tr>
                        <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'></th>
                        <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Estudiante</th>
                        <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Código</th>
                        <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Cohorte</th>
                      </tr>
                    </thead>
                    <tbody className='bg-white divide-y divide-gray-200'>
                      {transformedEstudiantes.map((estudiante) => {
                        const seleccionado = estudiantesSeleccionados.find(e => e.Id === estudiante.Id)
                        return (
                          <tr
                            key={estudiante.Id}
                            onClick={() => toggleEstudiante(estudiante)}
                            className={`cursor-pointer hover:bg-gray-50 ${seleccionado ? 'bg-red-50' : ''}`}
                          >
                            <td className='px-4 py-3'>
                              <input type='checkbox' readOnly checked={!!seleccionado} className='accent-rojo-institucional' />
                            </td>
                            <td className='px-4 py-3 text-sm'>{estudiante.Estudiante}</td>
                            <td className='px-4 py-3 text-sm'>{estudiante.Código}</td>
                            <td className='px-4 py-3 text-sm'>{estudiante.Cohorte}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div className='flex justify-between'>
                  <Boton onClick={() => setPaso(1)}>Atrás</Boton>
                  <Boton onClick={matricularLote} disabled={matriculando}>
                    {matriculando ? 'Matriculando...' : `Matricular ${estudiantesSeleccionados.length} estudiante(s)`}
                  </Boton>
                </div>
              </div>
            )}
          </div>
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

export default Inclusion
