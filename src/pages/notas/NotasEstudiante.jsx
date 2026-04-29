import { useEffect, useState } from 'react'
import { getBackendUrl } from '../../lib/controllers/endpoints'

const NotasEstudiante = () => {
  const [notas, setNotas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const backendUrl = getBackendUrl()

  useEffect(() => {
    const estudianteId = localStorage.getItem('estudianteId')
    if (!estudianteId) {
      setError('No se encontro el ID del estudiante.')
      setCargando(false)
      return
    }

    fetch(`${backendUrl}/api/estudiantes/${estudianteId}/notas`)
      .then((r) => {
        if (!r.ok) throw new Error('Error al obtener notas')
        return r.json()
      })
      .then((data) => {
        setNotas(data)
        setCargando(false)
      })
      .catch((err) => {
        setError(err.message)
        setCargando(false)
      })
  }, [backendUrl])

  const getColorNota = (nota) => {
    if (nota === null || nota === undefined) return 'text-gray-400'
    if (nota >= 3.0) return 'text-green-600 font-semibold'
    return 'text-red-600 font-semibold'
  }

  return (
    <div className='flex flex-col items-center p-6'>
      <p className='text-titulos mb-6'>Mis Notas</p>

      {cargando && <p className='text-gray-500'>Cargando notas...</p>}
      {error && <p className='text-red-500'>{error}</p>}

      {!cargando && !error && notas.length === 0 && (
        <p className='text-gray-500'>No tienes notas registradas.</p>
      )}

      {!cargando && !error && notas.length > 0 && (
        <div className='w-full max-w-4xl overflow-x-auto'>
          <table className='w-full border-collapse bg-white rounded-lg shadow'>
            <thead>
              <tr className='bg-rojo-mate text-white'>
                <th className='p-3 text-left'>Materia</th>
                <th className='p-3 text-left'>Codigo</th>
                <th className='p-3 text-center'>Creditos</th>
                <th className='p-3 text-center'>Semestre</th>
                <th className='p-3 text-center'>Nota</th>
                <th className='p-3 text-center'>Estado</th>
              </tr>
            </thead>
            <tbody>
              {notas.map((nota, index) => (
                <tr
                  key={nota.matriculaId}
                  className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                >
                  <td className='p-3'>{nota.materiaNombre || '-'}</td>
                  <td className='p-3'>{nota.materiaCodigo || '-'}</td>
                  <td className='p-3 text-center'>{nota.materiaCreditos || '-'}</td>
                  <td className='p-3 text-center'>{nota.materiaSemestre || '-'}</td>
                  <td className={`p-3 text-center ${getColorNota(nota.nota)}`}>
                    {nota.nota !== null && nota.nota !== undefined ? nota.nota : 'Sin nota'}
                  </td>
                  <td className='p-3 text-center'>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        nota.estadoMatricula === 'ACTIVO'
                          ? 'bg-green-100 text-green-700'
                          : nota.estadoMatricula === 'CANCELADO'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {nota.estadoMatricula || '-'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default NotasEstudiante