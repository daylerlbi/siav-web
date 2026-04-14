import { useEffect, useState } from 'react'
import Tabla from '../../components/Tabla'
import Boton from '../../components/Boton'
import { Eye, Pencil } from 'lucide-react'
import Modal from '../../components/Modal'
import { Autocomplete, AutocompleteItem } from '@heroui/react'
import AlertaModal from '../../components/AlertaModal'
import { getBackendUrl, getMoodleToken, getMoodleUrl } from '../../lib/controllers/endpoints'

const Materias = () => {
  const [materias, setMaterias] = useState([])
  const [pensums, setPensums] = useState([])
  const [informacion, setInformacion] = useState([])
  const [cargandoMaterias, setCargandoMaterias] = useState(true)
  const backendUrl = getBackendUrl()
  const moodleUrl = getMoodleUrl()
  const moodleToken = getMoodleToken()
  const [isOpenForm, setIsOpenForm] = useState(false)
  const [isOpenView, setIsOpenView] = useState(false)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [materiaId, setMateriaId] = useState(null)
  const [codigo, setCodigo] = useState('')
  const [nombre, setNombre] = useState('')
  const [creditos, setCreditos] = useState('')
  const [semestre, setSemestre] = useState('')
  const [pensumId, setPensumId] = useState('')
  const [materiaSeleccionada, setMateriaSeleccionada] = useState(null)
  const [moodleId, setMoodleId] = useState('')
  const [isAlertOpen, setIsAlertOpen] = useState(false)
  const [alertType, setAlertType] = useState('success')
  const [alertMessage, setAlertMessage] = useState('')
  const [maxSemestres, setMaxSemestres] = useState(0)

  // ← NUEVO: detectar si es usuario de Google y su pensum
  const googleToken = localStorage.getItem('googleToken')
  const isGoogleUser = !!googleToken
  const pensumIdEstudiante = localStorage.getItem('pensumIdEstudiante')

  const codigoErrors = []
  if (codigo === '') codigoErrors.push('Este campo es obligatorio')

  const nombreErrors = []
  if (nombre === '') nombreErrors.push('Este campo es obligatorio')

  const creditosErrors = []
  if (creditos === '') {
    creditosErrors.push('Este campo es obligatorio')
  } else if (!/^\d+$/.test(creditos)) {
    creditosErrors.push('Solo se permiten números')
  } else {
    const creditosNum = parseInt(creditos)
    if (creditosNum < 1 || creditosNum > 10) creditosErrors.push('El valor debe estar entre 1 y 10')
  }

  const semestreErrors = []
  if (semestre === '') {
    semestreErrors.push('Este campo es obligatorio')
  } else if (!/^\d+$/.test(semestre)) {
    semestreErrors.push('Solo se permiten números')
  } else {
    const semestreNum = parseInt(semestre)
    if (semestreNum < 1 || semestreNum > maxSemestres) semestreErrors.push(`El valor debe estar entre 1 y ${maxSemestres}`)
  }

  const pensumIdErrors = []
  if (pensumId === '') pensumIdErrors.push('Este campo es obligatorio')

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    setCargandoMaterias(true)
    try {
      // ← NUEVO: si es Google, filtrar materias por pensum del estudiante
      const materiasUrl = isGoogleUser && pensumIdEstudiante
        ? `${backendUrl}/api/materias/pensum/${pensumIdEstudiante}`
        : `${backendUrl}/api/materias/listar`

      const materiasResponse = await fetch(materiasUrl)
      const materiasData = await materiasResponse.json()
      setMaterias(materiasData)
      const pensumsResponse = await fetch(`${backendUrl}/api/pensums/listar`)
      const pensumsData = await pensumsResponse.json()
      setPensums(pensumsData)
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setCargandoMaterias(false)
    }
  }

  useEffect(() => {
    if (materias.length > 0 && pensums.length > 0) {
      const materiasConPensums = materias.map((materia) => {
        const pensum = pensums.find((p) => p.id === materia.pensumId)
        return {
          id: materia.id,
          Código: materia.codigo,
          Nombre: materia.nombre,
          Pensum: pensum ? pensum.nombre : 'No disponible',
          Créditos: materia.creditos,
          Semestre: materia.semestre,
          pensumId: pensum ? pensum.id : null,
          pensumNombre: pensum ? pensum.nombre : 'No disponible',
          moodleId: materia.moodleId
        }
      })
      setInformacion(materiasConPensums)
    }
  }, [materias, pensums])

  const prepararEdicion = (materia) => {
    setCodigo(materia.Código)
    setNombre(materia.Nombre)
    setCreditos(materia.Créditos?.toString() || '')
    setSemestre(materia.Semestre?.toString() || '')
    setPensumId(materia.pensumId?.toString() || '')
    setMateriaId(materia.id)
    setModoEdicion(true)
    setIsOpenForm(true)
    if (materia.moodleId !== undefined) {
      setMoodleId(materia.moodleId.toString())
    } else {
      obtenerMoodleIdMateria(materia.id)
        .then((moodleId) => setMoodleId(moodleId ? moodleId.toString() : ''))
        .catch(() => setMoodleId(''))
    }
    if (materia.pensumId) {
      const pensumSeleccionado = pensums.find((p) => p.id === materia.pensumId)
      if (pensumSeleccionado?.cantidadSemestres) setMaxSemestres(pensumSeleccionado.cantidadSemestres)
    }
  }

  const obtenerSemestresPrograma = async (programaId) => {
    const response = await fetch(`${backendUrl}/api/programas/${programaId}/semestres`)
    if (!response.ok) throw new Error('Error al obtener los semestres del programa')
    return await response.json()
  }

  const crearCategoriaMateriaEnMoodle = async (nombre, parentId, codigo) => {
    const response = await fetch(
      `${moodleUrl}?wstoken=${moodleToken}&moodlewsrestformat=json&wsfunction=core_course_create_categories&categories[0][name]=${nombre}&categories[0][parent]=${parentId}&categories[0][idnumber]=${codigo}&categories[0][description]=Materia: ${nombre} (${codigo})`
    )
    if (!response.ok) throw new Error('Error al crear categoría en Moodle')
    const data = await response.json()
    if (!data || data.length === 0 || !data[0].id) throw new Error('Respuesta de Moodle inválida')
    return data[0].id
  }

  const actualizarMoodleIdMateria = async (materiaId, moodleId) => {
    if (!materiaId || !moodleId) throw new Error(`Faltan parámetros: materiaId=${materiaId}, moodleId=${moodleId}`)
    const response = await fetch(`${backendUrl}/api/materias/moodle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ backendId: materiaId, moodleId: moodleId.toString() })
    })
    if (!response.ok) throw new Error(`Error al actualizar moodleId: ${response.status}`)
    return await response.json()
  }

  const obtenerMoodleIdMateria = async (materiaId) => {
    const response = await fetch(`${backendUrl}/api/materias/${materiaId}`)
    if (!response.ok) throw new Error('Error al obtener datos de la materia')
    const materiaData = await response.json()
    return materiaData.moodleId
  }

  const actualizarCategoriaMateriaEnMoodle = async (moodleId, nombre, parentId, codigo) => {
    const response = await fetch(
      `${moodleUrl}?wstoken=${moodleToken}&moodlewsrestformat=json&wsfunction=core_course_update_categories&categories[0][id]=${moodleId}&categories[0][name]=${nombre}&categories[0][parent]=${parentId}&categories[0][idnumber]=${codigo}&categories[0][description]=Materia: ${nombre} (${codigo})`
    )
    if (!response.ok) throw new Error('Error al actualizar categoría en Moodle')
  }

  const crearMateria = async (e) => {
    e.preventDefault()
    const data = { codigo, nombre, creditos: parseInt(creditos), semestre, pensumId: parseInt(pensumId) }
    try {
      const response = await fetch(`${backendUrl}/api/materias/crear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) {
        const result = await response.json()
        setAlertType('error'); setAlertMessage(result.message); setIsAlertOpen(true)
        return
      }
      const materiaCreada = await response.json()
      const backendId = materiaCreada.id || materiaCreada.backendId || materiaCreada._id
      if (!backendId) throw new Error('La respuesta del servidor no incluyó un ID válido')
      try {
        const pensumSeleccionado = pensums.find((p) => p.id.toString() === pensumId)
        if (!pensumSeleccionado) throw new Error('Pensum no encontrado')
        const programaData = await obtenerSemestresPrograma(pensumSeleccionado.programaId)
        const semestreSeleccionado = programaData.semestres.find((s) => s.numero === parseInt(semestre))
        if (!semestreSeleccionado) throw new Error(`Semestre ${semestre} no encontrado`)
        if (!semestreSeleccionado.moodleId) throw new Error(`El semestre ${semestre} no tiene ID de Moodle`)
        const moodleId = await crearCategoriaMateriaEnMoodle(nombre, semestreSeleccionado.moodleId, codigo)
        await actualizarMoodleIdMateria(backendId, moodleId)
      } catch (moodleError) {
        console.error('Error en Moodle:', moodleError)
      }
      limpiarFormulario(); setIsOpenForm(false)
      setAlertType('success'); setAlertMessage('Materia creada correctamente'); setIsAlertOpen(true)
      cargarDatos()
    } catch (error) {
      setAlertType('error'); setAlertMessage('Error al procesar la solicitud'); setIsAlertOpen(true)
    }
  }

  const actualizarMateria = async (e) => {
    e.preventDefault()
    const data = { codigo, nombre, creditos: parseInt(creditos), semestre, pensumId: parseInt(pensumId) }
    if (moodleId) data.moodleId = moodleId
    try {
      const response = await fetch(`${backendUrl}/api/materias/${materiaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) {
        const result = await response.json()
        setAlertType('error'); setAlertMessage(result.message); setIsAlertOpen(true)
        return
      }
      try {
        const materiaMoodleId = await obtenerMoodleIdMateria(materiaId)
        if (materiaMoodleId) {
          const pensumSeleccionado = pensums.find((p) => p.id === parseInt(pensumId))
          if (!pensumSeleccionado) throw new Error('Pensum no encontrado')
          const programaData = await obtenerSemestresPrograma(pensumSeleccionado.programaId)
          const semestreSeleccionado = programaData.semestres.find((s) => s.numero === parseInt(semestre))
          if (!semestreSeleccionado?.moodleId) throw new Error(`El semestre ${semestre} no tiene ID de Moodle`)
          await actualizarCategoriaMateriaEnMoodle(materiaMoodleId, nombre, semestreSeleccionado.moodleId, codigo)
        }
      } catch (moodleError) {
        console.error('Error en Moodle:', moodleError)
      }
      limpiarFormulario(); setIsOpenForm(false)
      setAlertType('success'); setAlertMessage('Materia actualizada correctamente'); setIsAlertOpen(true)
      cargarDatos()
    } catch (error) {
      setAlertType('error'); setAlertMessage('Error al procesar la solicitud'); setIsAlertOpen(true)
    }
  }

  const limpiarFormulario = () => {
    setCodigo(''); setNombre(''); setCreditos(''); setSemestre('')
    setPensumId(''); setMateriaId(null); setModoEdicion(false); setMaxSemestres(0)
  }

  const verMateria = (materia) => { setMateriaSeleccionada(materia); setIsOpenView(true) }

  const handlePensumChange = (id) => {
    setPensumId(id || '')
    if (id) {
      const pensumSeleccionado = pensums.find((p) => p.id.toString() === id)
      if (pensumSeleccionado?.cantidadSemestres) {
        setMaxSemestres(pensumSeleccionado.cantidadSemestres)
        if (semestre !== '' && parseInt(semestre) > pensumSeleccionado.cantidadSemestres) setSemestre('')
      } else {
        setMaxSemestres(0)
      }
    } else {
      setMaxSemestres(0)
    }
  }

  const columnas = ['Código', 'Nombre', 'Pensum', 'Créditos', 'Semestre']
  const filtros = ['Código', 'Nombre', 'Pensum']
  const acciones = [
    { icono: <Eye className='text-[25px]' />, tooltip: 'Ver', accion: (materia) => verMateria(materia) },
    { icono: <Pencil className='text-[25px]' />, tooltip: 'Editar', accion: (materia) => prepararEdicion(materia) }
  ]

  const accionesSoloVer = [
    { icono: <Eye className='text-[25px]' />, tooltip: 'Ver', accion: (materia) => verMateria(materia) }
  ]

  return (
    <div className='flex flex-col items-center justify-center p-4 w-full'>
      <div className='w-full flex items-center justify-between mb-8'>
        <p className='text-center text-titulos flex-1'>Lista de materias</p>
        {!isGoogleUser && <Boton onClick={() => { limpiarFormulario(); setIsOpenForm(true) }}>Crear materia</Boton>}
      </div>
      <div className='w-full my-8'>
        <Tabla
          columnas={columnas}
          informacion={informacion}
          acciones={isGoogleUser ? accionesSoloVer : acciones}
          filtros={filtros}
          elementosPorPagina={10}
          cargandoContenido={cargandoMaterias}
        />
      </div>

      <Modal
        size='xl'
        isOpen={isOpenForm}
        onOpenChange={(open) => { setIsOpenForm(open); if (!open) limpiarFormulario() }}
        cabecera={modoEdicion ? 'Editar Materia' : 'Crear Materia'}
        cuerpo={
          <form
            className='flex flex-col gap-4'
            onSubmit={modoEdicion ? actualizarMateria : crearMateria}
          >
            <div className='flex flex-col gap-1 w-full py-4'>
              <label className='text-sm'>Código *</label>
              <div className='border border-gris-institucional rounded-[15px] px-3 py-2'>
                <input
                  className='w-full outline-none bg-transparent text-sm'
                  placeholder='Ingresa el código de la materia'
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  required
                />
              </div>
              {codigoErrors.length > 0 && <ul className='text-xs text-danger mt-1'>{codigoErrors.map((e, i) => <li key={i}>{e}</li>)}</ul>}
            </div>

            <div className='flex flex-col gap-1 w-full py-4'>
              <label className='text-sm'>Nombre *</label>
              <div className='border border-gris-institucional rounded-[15px] px-3 py-2'>
                <input
                  className='w-full outline-none bg-transparent text-sm'
                  placeholder='Ingresa el nombre de la materia'
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>
              {nombreErrors.length > 0 && <ul className='text-xs text-danger mt-1'>{nombreErrors.map((e, i) => <li key={i}>{e}</li>)}</ul>}
            </div>

            <div className='w-full py-4'>
              <Autocomplete
                variant='bordered'
                className='w-full'
                defaultItems={pensums}
                selectedKey={pensumId}
                label='Pensum'
                size='md'
                placeholder='Selecciona el pensum'
                labelPlacement='outside'
                isRequired
                isDisabled={modoEdicion}
                onSelectionChange={(id) => handlePensumChange(id)}
                isInvalid={pensumIdErrors.length > 0}
                errorMessage={() => <ul className='text-xs text-danger mt-1'>{pensumIdErrors.map((e, i) => <li key={i}>{e}</li>)}</ul>}
              >
                {(pensum) => <AutocompleteItem key={pensum.id.toString()}>{pensum.nombre}</AutocompleteItem>}
              </Autocomplete>
            </div>

            <div className='flex w-full flex-row gap-4'>
              <div className='w-1/2 flex flex-col gap-1 py-4'>
                <label className='text-sm'>Créditos *</label>
                <div className='border border-gris-institucional rounded-[15px] px-3 py-2'>
                  <input
                    className='w-full outline-none bg-transparent text-sm'
                    placeholder='Ingresa los créditos'
                    value={creditos}
                    onChange={(e) => setCreditos(e.target.value)}
                    required
                  />
                </div>
                {creditosErrors.length > 0 && <ul className='text-xs text-danger mt-1'>{creditosErrors.map((e, i) => <li key={i}>{e}</li>)}</ul>}
              </div>

              <div className='w-1/2 flex flex-col gap-1 py-4'>
                <label className='text-sm'>Semestre *</label>
                <div className='border border-gris-institucional rounded-[15px] px-3 py-2'>
                  <input
                    className='w-full outline-none bg-transparent text-sm'
                    placeholder={maxSemestres ? `Ingresa el semestre (1-${maxSemestres})` : 'Selecciona un pensum primero'}
                    type='number'
                    min={1}
                    max={maxSemestres || undefined}
                    disabled={maxSemestres === 0}
                    value={semestre}
                    onChange={(e) => {
                      if (e.target.value === '') { setSemestre('') }
                      else {
                        const numValue = parseInt(e.target.value)
                        if (!isNaN(numValue) && numValue >= 1 && numValue <= maxSemestres) setSemestre(numValue.toString())
                      }
                    }}
                    required
                  />
                </div>
                {semestreErrors.length > 0 && <ul className='text-xs text-danger mt-1'>{semestreErrors.map((e, i) => <li key={i}>{e}</li>)}</ul>}
                <p className='text-xs text-gray-500 mt-1'>{maxSemestres ? `Debe ser un número entre 1 y ${maxSemestres}` : 'Selecciona un pensum primero'}</p>
              </div>
            </div>

            <div className='w-full flex justify-end mb-[-20px]'>
              <Boton type='submit'>{modoEdicion ? 'Guardar cambios' : 'Crear materia'}</Boton>
            </div>
          </form>
        }
      />

      <Modal
        size='5xl'
        isOpen={isOpenView}
        onOpenChange={(open) => { setIsOpenView(open); if (!open) setMateriaSeleccionada(null) }}
        cabecera='Detalles de la materia'
        cuerpo={
          materiaSeleccionada && (
            <div className='w-full flex flex-col'>
              <div className='w-full flex flex-row mb-4 gap-4'>
                <div className='flex flex-col gap-1 w-1/2'>
                  <label className='text-sm'>Código</label>
                  <div className='border border-gris-institucional rounded-[15px] px-3 py-2'>
                    <input className='w-full outline-none bg-transparent text-sm' readOnly value={materiaSeleccionada.Código || ''} />
                  </div>
                </div>
                <div className='flex flex-col gap-1 w-1/2'>
                  <label className='text-sm'>Nombre</label>
                  <div className='border border-gris-institucional rounded-[15px] px-3 py-2'>
                    <input className='w-full outline-none bg-transparent text-sm' readOnly value={materiaSeleccionada.Nombre || ''} />
                  </div>
                </div>
              </div>
              <div className='w-full flex flex-row mb-4 gap-4'>
                <div className='flex flex-col gap-1 w-1/2'>
                  <label className='text-sm'>Créditos</label>
                  <div className='border border-gris-institucional rounded-[15px] px-3 py-2'>
                    <input className='w-full outline-none bg-transparent text-sm' readOnly value={materiaSeleccionada.Créditos?.toString() || ''} />
                  </div>
                </div>
                <div className='flex flex-col gap-1 w-1/2'>
                  <label className='text-sm'>Semestre</label>
                  <div className='border border-gris-institucional rounded-[15px] px-3 py-2'>
                    <input className='w-full outline-none bg-transparent text-sm' readOnly value={materiaSeleccionada.Semestre?.toString() || ''} />
                  </div>
                </div>
              </div>
              <div className='w-full flex flex-row gap-4'>
                <div className='flex flex-col gap-1 w-1/2'>
                  <label className='text-sm'>Pensum</label>
                  <div className='border border-gris-institucional rounded-[15px] px-3 py-2'>
                    <input className='w-full outline-none bg-transparent text-sm' readOnly value={materiaSeleccionada.pensumNombre || ''} />
                  </div>
                </div>
              </div>
            </div>
          )
        }
      />

      <AlertaModal
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
        message={alertMessage}
        type={alertType}
        titulo={alertType === 'success' ? 'Operación exitosa' : 'Error'}
      />
    </div>
  )
}
export default Materias