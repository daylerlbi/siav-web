import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Tabla from '../../components/Tabla'
import Boton from '../../components/Boton'
import Modal from '../../components/Modal'
import AlertaModal from '../../components/AlertaModal'
import { getBackendUrl, getMoodleToken, getMoodleUrl } from '../../lib/controllers/endpoints'

const NotasPosgrado = () => {
  const backendUrl = getBackendUrl()
  const moodleUrl = getMoodleUrl()
  const moodleToken = getMoodleToken()
  const { id } = useParams()
  const [grupo, setGrupo] = useState(null)
  const [estudiantes, setEstudiantes] = useState([])
  const [notas, setNotas] = useState([])
  const [informacion, setInformacion] = useState([])
  const [cargandoNotas, setCargandoNotas] = useState(true)
  const [cargando, setCargando] = useState(false)
  const [cargandoMoodle, setCargandoMoodle] = useState(false)
  const [notasRegistradas, setNotasRegistradas] = useState(false)
  const [notasEditadas, setNotasEditadas] = useState({}) // notas manuales por estudianteId

  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [estudianteActual, setEstudianteActual] = useState(null)
  const [operacionGrupal, setOperacionGrupal] = useState(false)

  const [isAlertOpen, setIsAlertOpen] = useState(false)
  const [alertType, setAlertType] = useState('success')
  const [alertMessage, setAlertMessage] = useState('')
  const [alertTitulo, setAlertTitulo] = useState('')

  useEffect(() => {
    fetch(`${backendUrl}/api/grupos/vinculado/${id}`)
      .then(r => r.json())
      .then(data => setGrupo(data))

    fetch(`${backendUrl}/api/estudiantes/matriculados/grupo-cohorte/${id}`)
      .then(r => r.json())
      .then(data => setEstudiantes(data))
  }, [])

  useEffect(() => {
    if (estudiantes.length > 0) {
      verificarNotasRegistradas()
      // Cargar datos base sin esperar Moodle
      const infoBase = estudiantes.map(e => ({
        ...e,
        Código: e.codigo,
        Nombre: [e.nombre, e.nombre2, e.apellido, e.apellido2].filter(Boolean).join(' '),
        DEF: notasEditadas[e.id] !== undefined ? notasEditadas[e.id] : '-',
        MoodleDEF: '-'
      }))
      setInformacion(infoBase)
      setCargandoNotas(false)
    }
  }, [estudiantes])

  useEffect(() => {
    if (grupo?.moodleId) {
      cargarNotasMoodle()
    }
  }, [grupo])

  const cargarNotasMoodle = async () => {
    setCargandoMoodle(true)
    try {
      const response = await fetch(
        `${moodleUrl}?wstoken=${moodleToken}&moodlewsrestformat=json&wsfunction=gradereport_user_get_grade_items&courseid=${grupo.moodleId}`
      )
      const data = await response.json()
      if (data?.usergrades) {
        setNotas(data.usergrades)
      }
    } catch (error) {
      console.error('Error al cargar notas de Moodle:', error)
    } finally {
      setCargandoMoodle(false)
    }
  }

  // Cuando llegan notas de Moodle, actualizar la columna MoodleDEF
  useEffect(() => {
    if (notas?.length > 0 && estudiantes.length > 0) {
      setInformacion(prev => prev.map(est => {
        const notasEst = notas.find(n => n.userid?.toString() === est.moodleId?.toString())
        let moodleDEF = '-'
        if (notasEst?.gradeitems?.length > 0) {
          const ultima = notasEst.gradeitems[notasEst.gradeitems.length - 1]
          moodleDEF = ultima.graderaw ?? '-'
        }
        return { ...est, MoodleDEF: moodleDEF }
      }))
    }
  }, [notas])

  // Cuando cambia notasEditadas, actualizar DEF en informacion
  useEffect(() => {
    if (informacion.length > 0) {
      setInformacion(prev => prev.map(est => ({
        ...est,
        DEF: notasEditadas[est.id] !== undefined ? notasEditadas[est.id] : est.DEF
      })))
    }
  }, [notasEditadas])

  const verificarNotasRegistradas = async () => {
    try {
      if (estudiantes.length === 0) return
      const primerEstudiante = estudiantes[0]
      const resp = await fetch(`${backendUrl}/api/matriculas/estudiante/${primerEstudiante.id}`)
      if (!resp.ok) return
      const matriculas = await resp.json()
      const matriculaGrupo = matriculas.find(m => m.grupoId?.toString() === id?.toString())
      if (matriculaGrupo) setNotasRegistradas(matriculaGrupo.nota !== null)
    } catch (error) {
      console.error('Error al verificar notas:', error)
    }
  }

  const mostrarAlerta = (mensaje, tipo, titulo) => {
    setAlertMessage(mensaje)
    setAlertType(tipo)
    setAlertTitulo(titulo || (tipo === 'success' ? 'Éxito' : 'Error'))
    setIsAlertOpen(true)
  }

  const obtenerNombreUsuario = () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'))
      return userInfo?.nombre || 'Usuario Sistema'
    } catch { return 'Usuario Sistema' }
  }

  const handleNotaManualChange = (estudianteId, valor) => {
    const num = parseFloat(valor)
    if (valor === '' || valor === '-') {
      setNotasEditadas(prev => ({ ...prev, [estudianteId]: '-' }))
    } else if (!isNaN(num) && num >= 0 && num <= 5) {
      setNotasEditadas(prev => ({ ...prev, [estudianteId]: num }))
    }
  }

  const copiarDesdeeMoodle = () => {
    const nuevas = {}
    informacion.forEach(est => {
      if (est.MoodleDEF !== '-' && est.MoodleDEF !== null) {
        nuevas[est.id] = est.MoodleDEF
      }
    })
    setNotasEditadas(nuevas)
    mostrarAlerta('Notas copiadas desde Moodle', 'success', 'Notas cargadas')
  }

  const registrarNotasEstudiantes = async () => {
    const nombreUsuario = obtenerNombreUsuario()
    const errores = []
    for (const estudiante of informacion) {
      try {
        const resp = await fetch(`${backendUrl}/api/matriculas/estudiante/${estudiante.id}`)
        if (!resp.ok) throw new Error(`Error al obtener matrículas de ${estudiante.Nombre}`)
        const matriculas = await resp.json()
        const matriculaGrupo = matriculas.find(m => m.grupoId?.toString() === id?.toString())
        if (!matriculaGrupo) throw new Error(`No se encontró matrícula de ${estudiante.Nombre}`)
        const respReg = await fetch(`${backendUrl}/api/notas/registrar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Usuario': nombreUsuario },
          body: JSON.stringify({ matriculaId: matriculaGrupo.id, nota: estudiante.DEF, realizadoPor: nombreUsuario })
        })
        if (!respReg.ok) throw new Error(`Error al registrar nota de ${estudiante.Nombre}`)
      } catch (error) {
        errores.push(`${estudiante.Nombre}: ${error.message}`)
      }
    }
    return errores
  }

  const cerrarNotas = async (estudiante) => {
    setCargando(true)
    try {
      const nombreUsuario = obtenerNombreUsuario()
      const resp = await fetch(`${backendUrl}/api/matriculas/estudiante/${estudiante.id}`)
      if (!resp.ok) throw new Error('Error al obtener las matrículas del estudiante')
      const matriculas = await resp.json()
      const matriculaGrupo = matriculas.find(m => m.grupoId?.toString() === id?.toString())
      if (!matriculaGrupo) throw new Error('No se encontró la matrícula del estudiante para este grupo')
      const respReg = await fetch(`${backendUrl}/api/notas/registrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Usuario': nombreUsuario },
        body: JSON.stringify({ matriculaId: matriculaGrupo.id, nota: estudiante.DEF, realizadoPor: nombreUsuario })
      })
      if (!respReg.ok) throw new Error('Error al registrar la nota del estudiante')
      setNotasRegistradas(true)
      mostrarAlerta(`Nota registrada correctamente para ${estudiante.Nombre}`, 'success', 'Nota registrada')
    } catch (error) {
      mostrarAlerta(error.message, 'error', 'Error al registrar notas')
    } finally {
      setCargando(false)
    }
  }

  const cerrarTodasLasNotas = async () => {
    setCargando(true)
    try {
      const errores = await registrarNotasEstudiantes()
      setNotasRegistradas(true)
      if (errores.length > 0) {
        mostrarAlerta(`Proceso completado con errores:\n${errores.join('\n')}`, 'warning', 'Proceso con errores')
      } else {
        mostrarAlerta('Todas las notas han sido registradas correctamente', 'success', 'Proceso completado')
      }
    } catch (error) {
      mostrarAlerta(error.message, 'error', 'Error en el proceso')
    } finally {
      setCargando(false)
    }
  }

  const hayNotasVacias = () => informacion.some(e => !e.DEF || e.DEF === '-' || e.DEF === '')

  const acciones = [
    {
      icono: 'DEF',
      tooltip: 'Registrar nota',
      accion: (estudiante) => { setEstudianteActual(estudiante); setOperacionGrupal(false); setIsConfirmOpen(true) },
      disabled: !notasRegistradas
    }
  ]

  return (
    <div className='flex flex-col items-center p-4'>
      <div className='w-full'>
        <button
          className='w-[40px] h-[30px] text-[30px] bg-rojo-mate flex items-center justify-center rounded-md border border-rojo-mate text-white hover:bg-rojo-oscuro ease-in-out transition-all duration-300'
          onClick={() => window.history.back()}
        >
          <ArrowLeft />
        </button>
      </div>
      <p className='text-titulos'>Información del grupo</p>
      <p className='text-subtitulos'>{grupo?.grupoNombre}</p>
      <div className='flex flex-row w-full my-8'>
        <div className='w-[50%] flex flex-row justify-center space-x-2'>
          <div className='font-semibold'>Nombre del docente:</div>
          <div>{grupo?.docenteNombre}</div>
        </div>
        <div className='w-[50%] flex flex-row justify-center space-x-2'>
          <div className='font-semibold'>Número de estudiantes:</div>
          <div>{estudiantes?.length}</div>
        </div>
      </div>

      {/* Tabla con notas editables */}
      <p className='text-subtitulos mb-4'>Lista de estudiantes</p>
      <div className='w-full overflow-x-auto'>
        <table className='min-w-full divide-y divide-gray-200 border rounded-lg'>
          <thead className='bg-gray-50'>
            <tr>
              <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Código</th>
              <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Nombre</th>
              <th className='px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase'>
                DEF Moodle
                {cargandoMoodle && <span className='ml-2 text-xs text-gray-400'>(cargando...)</span>}
              </th>
              <th className='px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase'>DEF Manual</th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            {cargandoNotas ? (
              <tr><td colSpan={4} className='text-center py-8 text-gray-400'>Cargando estudiantes...</td></tr>
            ) : informacion.map(est => (
              <tr key={est.id} className='hover:bg-gray-50'>
                <td className='px-4 py-3 text-sm'>{est.Código}</td>
                <td className='px-4 py-3 text-sm'>{est.Nombre}</td>
                <td className='px-4 py-3 text-sm text-center'>
                  {cargandoMoodle ? <span className='text-gray-400'>...</span> : (est.MoodleDEF ?? '-')}
                </td>
                <td className='px-4 py-3 text-center'>
                  <input
                    type='number'
                    min='0'
                    max='5'
                    step='0.1'
                    value={notasEditadas[est.id] !== undefined ? notasEditadas[est.id] : ''}
                    onChange={(e) => handleNotaManualChange(est.id, e.target.value)}
                    placeholder='-'
                    className='w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:border-rojo-institucional'
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className='w-full flex mb-8 mt-8 justify-between items-center'>
        <Boton onClick={copiarDesdeeMoodle} disabled={cargandoMoodle || notas.length === 0}>
          {cargandoMoodle ? 'Cargando Moodle...' : 'Copiar notas desde Moodle'}
        </Boton>
        <Boton
          onClick={() => { setOperacionGrupal(true); setIsConfirmOpen(true) }}
          disabled={cargando || hayNotasVacias()}
          success={notasRegistradas}
        >
          {cargando ? 'Procesando...' : 'Cerrar todas las notas'}
        </Boton>
      </div>

      <Modal
        size='md'
        isOpen={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        cabecera={operacionGrupal ? 'Confirmar cierre de todas las notas' : 'Confirmar cierre de nota'}
        cuerpo={
          <div className='flex flex-col'>
            <p>{operacionGrupal ? '¿Está seguro de cerrar todas las notas del grupo?' : `¿Está seguro de cerrar la nota de ${estudianteActual?.Nombre}?`}</p>
            <p className='text-warning-500 font-semibold mt-2'>
              {operacionGrupal ? 'Esta acción registrará las notas en el sistema académico.' : 'Esta acción registrará la respectiva nota en el sistema académico.'}
            </p>
            <div className='flex justify-end space-x-3 mt-6 mb-[-20px]'>
              <Boton onClick={() => {
                setIsConfirmOpen(false)
                if (operacionGrupal) cerrarTodasLasNotas()
                else if (estudianteActual) cerrarNotas(estudianteActual)
              }}>
                Confirmar
              </Boton>
            </div>
          </div>
        }
      />

      <AlertaModal isOpen={isAlertOpen} onClose={() => setIsAlertOpen(false)} message={alertMessage} type={alertType} titulo={alertTitulo} />
    </div>
  )
}

export default NotasPosgrado