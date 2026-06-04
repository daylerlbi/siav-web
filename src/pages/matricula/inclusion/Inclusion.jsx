import { useEffect, useState } from 'react'
import { ClipboardList, Users } from 'lucide-react'
import Tabla from '../../../components/Tabla'
import { useNavigate } from 'react-router-dom'
import { getBackendUrl } from '../../../lib/controllers/endpoints'
import Modal from '../../../components/Modal'
import Boton from '../../../components/Boton'
import AlertaModal from '../../../components/AlertaModal'

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
  const [paso, setPaso] = useState(1)
  const [filtroBusqueda, setFiltroBusqueda] = useState('')
  const [filtroCohorte, setFiltroCohorte] = useState('')

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
    const googleToken = localStorage.getItem('googleToken')
    const estudianteIdLocal = localStorage.getItem('estudianteId')
    const isEstudiante = (() => {
      try {
        if (!googleToken) return false
        const payload = JSON.parse(atob(googleToken.split('.')[1]))
        return (payload.role || '').toLowerCase() === 'estudiante'
      } catch { return false }
    })()

    if (isEstudiante && estudianteIdLocal) {
      Navigate(`matricular/pensum/${estudianteIdLocal}`)
      return
    }

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
    setFiltroBusqueda('')
    setFiltroCohorte('')
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

  const estudiantesFiltrados = transformedEstudiantes.filter(e => {
    const busqueda = filtroBusqueda.toLowerCase()
    const coincideBusqueda = !busqueda || e.Estudiante?.toLowerCase().includes(busqueda) || e.Código?.toLowerCase().includes(busqueda)
    const coincideCohorte = !filtroCohorte || e.Cohorte === filtroCohorte
    return coincideBusqueda && coincideCohorte
  })

  const seleccionarTodos = () => {
    if (estudiantesSeleccionados.length === estudiantesFiltrados.length &&
        estudiantesFiltrados.every(e => estudiantesSeleccionados.find(s => s.Id === e.Id))) {
      setEstudiantesSeleccionados(prev => prev.filter(s => !estudiantesFiltrados.find(e => e.Id === s.Id)))
    } else {
      const nuevos = estudiantesFiltrados.filter(e => !estudiantesSeleccionados.find(s => s.Id === e.Id))
      setEstudiantesSeleccionados(prev => [...prev, ...nuevos])
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
                  <div className='max-h-[400px] overflow-y-auto border rounded-lg'>
                    {(() => {
                      const semestresUnicos = [...new Set(grupos.map(g => g.semestreMateria))].sort((a, b) => parseInt(a) - parseInt(b))
                      return semestresUnicos.map(semestre => {
                        const gruposSemestre = grupos.filter(g => g.semestreMateria === semestre)
                        return (
                          <div key={semestre}>
                            <div className='bg-gray-100 px-4 py-2 sticky top-0 z-10'>
                              <p className='font-semibold text-sm text-gray-700'>Semestre {semestre}</p>
                            </div>
                            {gruposSemestre.map(grupo => (
                              <div
                                key={grupo.id}
                                onClick={() => setGrupoSeleccionado(grupo)}
                                className={`px-4 py-3 cursor-pointer hover:bg-gray-50 border-b flex items-center justify-between ${grupoSeleccionado?.id === grupo.id ? 'bg-red-50 border-l-4 border-l-rojo-institucional' : ''}`}
                              >
                                <div>
                                  <p className='text-sm font-medium'>{grupo.materia}</p>
                                  <p className='text-xs text-gray-500'>{grupo.codigoGrupo} — {grupo.grupoNombre}</p>
                                </div>
                                <div className='text-right'>
                                  <p className='text-xs text-gray-400'>{grupo.cohorteNombre}</p>
                                  {grupoSeleccionado?.id === grupo.id && (
                                    <span className='text-xs text-rojo-institucional font-semibold'>Seleccionado</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      })
                    })()}
                  </div>
                )}
                <div className='flex justify-end'>
                  <Boton onClick={() => {
                    if (!grupoSeleccionado) { showAlerta('Debe seleccionar un grupo', 'error', 'Campo requerido'); return }
                    setPaso(2)
                  }}>
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

                {/* Filtros */}
                <div className='flex flex-row gap-3'>
                  <input
                    type='text'
                    placeholder='Buscar estudiante o código...'
                    value={filtroBusqueda}
                    onChange={(e) => setFiltroBusqueda(e.target.value)}
                    className='flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rojo-institucional'
                  />
                  <select
                    value={filtroCohorte}
                    onChange={(e) => setFiltroCohorte(e.target.value)}
                    className='px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-rojo-institucional'
                  >
                    <option value=''>Todas las cohortes</option>
                    {[...new Set(transformedEstudiantes.map(e => e.Cohorte).filter(Boolean))].sort().map(cohorte => (
                      <option key={cohorte} value={cohorte}>{cohorte}</option>
                    ))}
                  </select>
                </div>

                <div className='flex items-center justify-between'>
                  <p className='text-sm font-medium'>{estudiantesSeleccionados.length} estudiante(s) seleccionado(s)</p>
                  <button onClick={seleccionarTodos} className='text-sm text-rojo-institucional hover:underline'>
                    {estudiantesFiltrados.every(e => estudiantesSeleccionados.find(s => s.Id === e.Id)) && estudiantesFiltrados.length > 0
                      ? 'Deseleccionar filtrados'
                      : 'Seleccionar filtrados'}
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
                      {estudiantesFiltrados.map((estudiante) => {
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