import { useEffect, useState } from 'react'
import Tabla from '../../components/Tabla'
import Boton from '../../components/Boton'
import Modal from '../../components/Modal'
import { Form, Autocomplete, AutocompleteItem, Input } from '@heroui/react'
import { Eye, Pencil } from 'lucide-react'
import AlertaModal from '../../components/AlertaModal'
import { getBackendUrl, getMoodleToken, getMoodleUrl } from '../../lib/controllers/endpoints'

const Grupos = () => {
  const [grupos, setGrupos] = useState([])
  const [gruposCohorte, setGruposCohorte] = useState([])
  const [profesores, setProfesores] = useState([])
  const [informacion, setInformacion] = useState([])
  const [cargandoGrupos, setCargandoGrupos] = useState(true)
  const backendUrl = getBackendUrl()
  const moodleUrl = getMoodleUrl()
  const moodleToken = getMoodleToken()
  const isGoogleUser = !!localStorage.getItem('googleToken')
  // Estados para el modal de creación
  const [isOpen, setIsOpen] = useState(false)
  const [isOpenView, setIsOpenView] = useState(false)
  const [materias, setMaterias] = useState([])
  const [materiaId, setMateriaId] = useState('')
  const [cohorteId, setCohorteId] = useState('')
  const [docenteId, setDocenteId] = useState('')
  const [modoEdicion, setModoEdicion] = useState(false)
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null)
  const [grupoId, setGrupoId] = useState(null)

  // Nuevos estados para programas y pensums
  const [programas, setProgramas] = useState([])
  const [pensums, setPensums] = useState([])
  const [programaId, setProgramaId] = useState('')
  const [pensumId, setPensumId] = useState('')

  // Estados para el AlertaModal
  const [isAlertOpen, setIsAlertOpen] = useState(false)
  const [alertType, setAlertType] = useState('success')
  const [alertMessage, setAlertMessage] = useState('')

  // Validaciones para campos obligatorios
  const materiaIdErrors = []
  if (materiaId === '') {
    materiaIdErrors.push('Este campo es obligatorio')
  }

  const cohorteIdErrors = []
  if (cohorteId === '') {
    cohorteIdErrors.push('Este campo es obligatorio')
  }

  const docenteIdErrors = []
  if (docenteId === '') {
    docenteIdErrors.push('Este campo es obligatorio')
  }

  // Nuevas validaciones
  const programaIdErrors = []
  if (!modoEdicion && programaId === '') {
    programaIdErrors.push('Este campo es obligatorio')
  }

  const pensumIdErrors = []
  if (!modoEdicion && pensumId === '') {
    pensumIdErrors.push('Este campo es obligatorio')
  }

  useEffect(() => {
    cargarDatos()
    fetch(`${backendUrl}/api/programas/listar`)
      .then((response) => response.json())
      .then((data) => {
        setProgramas(data)
      })
      .catch(() => {
        setAlertType('error')
        setAlertMessage('Error al cargar los programas')
        setIsAlertOpen(true)
      })
  }, [])

  useEffect(() => {
    if (programaId) {
      fetch(`${backendUrl}/api/pensums/programa/${programaId}`)
        .then((response) => response.json())
        .then((data) => {
          setPensums(data)
          setPensumId('')
          setMateriaId('')
          setMaterias([])
        })
        .catch(() => {
          setAlertType('error')
          setAlertMessage('Error al cargar los pensums')
          setIsAlertOpen(true)
        })
    }
  }, [programaId])

  useEffect(() => {
    if (pensumId) {
      fetch(`${backendUrl}/api/materias/pensum/${pensumId}`)
        .then((response) => response.json())
        .then((data) => {
          setMaterias(data)
          setMateriaId('')
        })
        .catch(() => {
          setAlertType('error')
          setAlertMessage('Error al cargar las materias')
          setIsAlertOpen(true)
        })
    }
  }, [pensumId])

  const cargarDatos = () => {
    setCargandoGrupos(true)
    fetch(`${backendUrl}/api/grupos/vinculados`)
      .then((response) => response.json())
      .then((data) => {
        setGrupos(data)
      })
      .catch(() => {
        setAlertType('error')
        setAlertMessage('Error al cargar los grupos')
        setIsAlertOpen(true)
      })
      .finally(() => {
        setCargandoGrupos(false)
      })

    fetch(`${backendUrl}/api/cohortes/listar`)
      .then((response) => response.json())
      .then((data) => {
        const fetchGruposPromises = data.map((cohorte) => {
          return fetch(`${backendUrl}/api/cohortes/${cohorte.id}`)
            .then((response) => response.json())
            .then((cohortesData) => {
              return cohortesData.cohortesGrupos || []
            })
        })

        Promise.all(fetchGruposPromises)
          .then((resultados) => {
            const todosLosGrupos = resultados.flat()
            setGruposCohorte(todosLosGrupos)
          })
          .catch(() => {
            setAlertType('error')
            setAlertMessage('Error al obtener los grupos de las cohortes')
            setIsAlertOpen(true)
          })
      })
      .catch(() => {
        setAlertType('error')
        setAlertMessage('Error al cargar las cohortes')
        setIsAlertOpen(true)
      })

    fetch(`${backendUrl}/api/usuarios/rol/2`)
      .then((response) => response.json())
      .then((data) => {
        setProfesores(data)
      })
      .catch(() => {
        setAlertType('error')
        setAlertMessage('Error al cargar los profesores')
        setIsAlertOpen(true)
      })

    fetch(`${backendUrl}/api/materias/listar`)
      .then((response) => response.json())
      .then((data) => {
        setMaterias(data)
      })
      .catch(() => {
        setAlertType('error')
        setAlertMessage('Error al cargar las materias')
        setIsAlertOpen(true)
      })
  }

  useEffect(() => {
    if (grupos.length > 0) {
      const datosCombinados = grupos.map((grupo) => {
        return {
          ...grupo,
          Código: grupo.codigoGrupo,
          Nombre: grupo.grupoNombre,
          Cohorte: grupo.cohorteNombre,
          Profesor: grupo.docenteNombre
        }
      })
      setInformacion(datosCombinados)
    }
  }, [grupos])

  const columnas = ['Código', 'Nombre', 'Cohorte', 'Profesor']
  const filtros = ['Código', 'Nombre', 'Cohorte', 'Profesor']

  const acciones = isGoogleUser
    ? [{ icono: <Eye className='text-[25px]' />, tooltip: 'Ver', accion: (grupo) => verGrupo(grupo) }]
    : [
        { icono: <Eye className='text-[25px]' />, tooltip: 'Ver', accion: (grupo) => verGrupo(grupo) },
        { icono: <Pencil className='text-[25px]' />, tooltip: 'Editar', accion: (grupo) => prepararEdicion(grupo) }
      ]

  const verGrupo = (grupo) => {
    fetch(`${backendUrl}/api/grupos/vinculado/${grupo.id}`)
      .then((response) => response.json())
      .then((data) => {
        setGrupoSeleccionado({
          ...data,
          Código: data.codigoMateria,
          Nombre: data.grupoNombre,
          Cohorte: data.cohorteGrupoNombre,
          Profesor: data.docenteNombre
        })
        setIsOpenView(true)
      })
      .catch(() => {
        setAlertType('error')
        setAlertMessage('Error al cargar los detalles del grupo')
        setIsAlertOpen(true)
      })
  }

  const prepararEdicion = (grupo) => {
    setGrupoSeleccionado(grupo)
    setMateriaId(grupo.grupoId?.toString() || '')
    setCohorteId(grupo.cohorteGrupoId?.toString() || '')
    setDocenteId(grupo.docenteId?.toString() || '')
    setGrupoId(grupo.id)
    setModoEdicion(true)
    setIsOpen(true)
  }

  const validarCampos = () => {
    if (!materiaId || !cohorteId || !docenteId) {
      setAlertType('error')
      setAlertMessage('Por favor complete todos los campos')
      setIsAlertOpen(true)
      return false
    }
    return true
  }

  const crearGrupo = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/grupos/crear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materiaId: parseInt(materiaId) })
      })
      const data = await response.json()
      if (!response.ok) {
        setAlertType('error')
        setAlertMessage(data.message || 'Error al crear el grupo')
        setIsAlertOpen(true)
        return null
      }
      return data.id
    } catch (error) {
      setAlertType('error')
      setAlertMessage('Error al crear el grupo')
      setIsAlertOpen(true)
      return null
    }
  }

  const vincularGrupo = async (nuevoGrupoId) => {
    try {
      const response = await fetch(`${backendUrl}/api/grupos/vincular`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grupoId: nuevoGrupoId,
          cohorteGrupoId: parseInt(cohorteId),
          docenteId: parseInt(docenteId)
        })
      })
      const data = await response.json()
      if (!response.ok) {
        setAlertType('error')
        setAlertMessage(data.message || 'El grupo fue creado pero hubo un error al vincularlo')
        setIsAlertOpen(true)
        return null
      }
      return data
    } catch (error) {
      setAlertType('error')
      setAlertMessage('Error al vincular el grupo')
      setIsAlertOpen(true)
      return null
    }
  }

  const obtenerInformacionMateria = async (materiaId) => {
    try {
      const response = await fetch(`${backendUrl}/api/materias/${materiaId}`)
      const data = await response.json()
      if (!response.ok) {
        setAlertType('error')
        setAlertMessage(data.message || 'Error al obtener la información de la materia')
        setIsAlertOpen(true)
        return null
      }
      return data
    } catch (error) {
      setAlertType('error')
      setAlertMessage('Error al obtener la información de la materia')
      setIsAlertOpen(true)
      return null
    }
  }

  const crearCursoMoodle = async (nombreGrupo, codigoGrupo, categoriaId) => {
    try {
      const url =
        `${moodleUrl}?wstoken=${moodleToken}` +
        `&wsfunction=core_course_create_courses` +
        `&courses[0][fullname]=${encodeURIComponent(nombreGrupo)}` +
        `&courses[0][shortname]=${encodeURIComponent(codigoGrupo)}` +
        `&courses[0][categoryid]=${categoriaId}` +
        `&courses[0][idnumber]=${encodeURIComponent(codigoGrupo)}` +
        `&moodlewsrestformat=json`
      const response = await fetch(url)
      const data = await response.json()
      if (!data || !Array.isArray(data) || data.length === 0 || !data[0].id) {
        setAlertType('error')
        setAlertMessage('Error: Formato de respuesta de Moodle no válido')
        setIsAlertOpen(true)
        return null
      }
      return data[0].id
    } catch (error) {
      setAlertType('error')
      setAlertMessage('Error al crear el curso en Moodle')
      setIsAlertOpen(true)
      return null
    }
  }

  const asignarMoodleIdGrupo = async (grupoId, moodleId) => {
    try {
      const response = await fetch(
        `${backendUrl}/api/grupos/moodle/${grupoId}?moodleId=${moodleId}`,
        { method: 'POST' }
      )
      if (!response.ok) {
        const data = await response.json()
        setAlertType('error')
        setAlertMessage(data.message || 'Error al asignar el ID de Moodle al grupo')
        setIsAlertOpen(true)
        return false
      }
      return true
    } catch (error) {
      setAlertType('error')
      setAlertMessage('Error al asignar el ID de Moodle al grupo')
      setIsAlertOpen(true)
      return false
    }
  }

  const obtenerInformacionProfesor = async (profesorId) => {
    try {
      const response = await fetch(`${backendUrl}/api/usuarios/${profesorId}`)
      const data = await response.json()
      if (!response.ok) {
        setAlertType('error')
        setAlertMessage(data.message || 'Error al obtener la información del profesor')
        setIsAlertOpen(true)
        return null
      }
      return data
    } catch (error) {
      setAlertType('error')
      setAlertMessage('Error al obtener la información del profesor')
      setIsAlertOpen(true)
      return null
    }
  }

  const enrollProfesorEnCurso = async (profesorMoodleId, cursoMoodleId) => {
    try {
      const rolId = 3
      const url =
        `${moodleUrl}?wstoken=${moodleToken}` +
        `&wsfunction=enrol_manual_enrol_users` +
        `&enrolments[0][roleid]=${rolId}` +
        `&enrolments[0][userid]=${profesorMoodleId}` +
        `&enrolments[0][courseid]=${cursoMoodleId}` +
        `&moodlewsrestformat=json`
      const response = await fetch(url)
      const data = await response.json()
      if (data && data.exception) {
        setAlertType('error')
        setAlertMessage(`Error al inscribir al profesor en el curso: ${data.message}`)
        setIsAlertOpen(true)
        return false
      }
      return true
    } catch (error) {
      setAlertType('error')
      setAlertMessage('Error al inscribir al profesor en el curso')
      setIsAlertOpen(true)
      return false
    }
  }

  const obtenerGrupoVinculado = async (idGrupo) => {
    try {
      const response = await fetch(`${backendUrl}/api/grupos/vinculado/${idGrupo}`)
      const data = await response.json()
      if (!response.ok) {
        setAlertType('error')
        setAlertMessage(data.message || 'Error al obtener información del grupo')
        setIsAlertOpen(true)
        return null
      }
      return data
    } catch (error) {
      setAlertType('error')
      setAlertMessage('Error al obtener información del grupo')
      setIsAlertOpen(true)
      return null
    }
  }

  const unenrollUsuarioDelCurso = async (usuarioMoodleId, cursoMoodleId) => {
    try {
      const url =
        `${moodleUrl}?wstoken=${moodleToken}` +
        `&wsfunction=enrol_manual_unenrol_users` +
        `&enrolments[0][userid]=${usuarioMoodleId}` +
        `&enrolments[0][courseid]=${cursoMoodleId}` +
        `&moodlewsrestformat=json`
      const response = await fetch(url)
      const data = await response.json()
      if (data && data.exception) {
        setAlertType('error')
        setAlertMessage(`Error al retirar al profesor del curso: ${data.message}`)
        setIsAlertOpen(true)
        return false
      }
      return true
    } catch (error) {
      setAlertType('error')
      setAlertMessage('Error al retirar al profesor del curso')
      setIsAlertOpen(true)
      return false
    }
  }

  const actualizarProfesorEnMoodle = async (grupoId, nuevoDocenteId, docenteIdAnterior) => {
    try {
      if (nuevoDocenteId === docenteIdAnterior) return true
      const grupoInfo = await obtenerGrupoVinculado(grupoId)
      if (!grupoInfo || !grupoInfo.moodleId) return false
      const profesorAnteriorInfo = await obtenerInformacionProfesor(docenteIdAnterior)
      if (profesorAnteriorInfo && profesorAnteriorInfo.moodleId) {
        await unenrollUsuarioDelCurso(profesorAnteriorInfo.moodleId, grupoInfo.moodleId)
      }
      const nuevoProfesorInfo = await obtenerInformacionProfesor(nuevoDocenteId)
      if (nuevoProfesorInfo && nuevoProfesorInfo.moodleId) {
        const enrollExitoso = await enrollProfesorEnCurso(nuevoProfesorInfo.moodleId, grupoInfo.moodleId)
        if (!enrollExitoso) return false
      }
      return true
    } catch (error) {
      return false
    }
  }

  const crearYVincularGrupo = async (e) => {
    e.preventDefault()
    if (!validarCampos()) return
    try {
      const nuevoGrupoId = await crearGrupo()
      if (nuevoGrupoId === null) return
      const grupoVinculado = await vincularGrupo(nuevoGrupoId)
      if (grupoVinculado === null) return
      const materiaInfo = await obtenerInformacionMateria(grupoVinculado.materiaId)
      if (materiaInfo === null) return
      const profesorInfo = await obtenerInformacionProfesor(grupoVinculado.docenteId)
      if (profesorInfo === null) return
      const moodleCourseId = await crearCursoMoodle(
        grupoVinculado.grupoNombre + ' - ' + programas[0].semestreActual,
        grupoVinculado.codigoGrupo + '-' + programas[0].semestreActual,
        materiaInfo.moodleId
      )
      if (moodleCourseId === null) return
      const asignacionExitosa = await asignarMoodleIdGrupo(grupoVinculado.id, moodleCourseId)
      if (!asignacionExitosa) return
      if (profesorInfo.moodleId) {
        await enrollProfesorEnCurso(profesorInfo.moodleId, moodleCourseId)
      }
      limpiarFormulario()
      setIsOpen(false)
      setAlertType('success')
      setAlertMessage('Grupo creado, vinculado y curso en Moodle creado correctamente')
      setIsAlertOpen(true)
      cargarDatos()
    } catch (error) {
      setAlertType('error')
      setAlertMessage('Error al procesar la solicitud')
      setIsAlertOpen(true)
    }
  }

  const actualizarGrupoVinculado = async (e) => {
    e.preventDefault()
    if (!materiaId || !cohorteId || !docenteId || !grupoId) {
      setAlertType('error')
      setAlertMessage('Por favor complete todos los campos')
      setIsAlertOpen(true)
      return
    }
    try {
      const grupoAnterior = await obtenerGrupoVinculado(grupoId)
      if (!grupoAnterior) return
      const docenteIdAnterior = grupoAnterior.docenteId
      const actualizarResponse = await fetch(`${backendUrl}/api/grupos/vincular/${grupoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grupoId: parseInt(materiaId),
          cohorteGrupoId: parseInt(cohorteId),
          docenteId: parseInt(docenteId)
        })
      })
      const actualizarData = await actualizarResponse.json()
      if (!actualizarResponse.ok) {
        setAlertType('error')
        setAlertMessage(actualizarData.message || 'Error al actualizar el grupo')
        setIsAlertOpen(true)
        return
      }
      if (parseInt(docenteId) !== docenteIdAnterior) {
        await actualizarProfesorEnMoodle(grupoId, parseInt(docenteId), docenteIdAnterior)
      }
      limpiarFormulario()
      setIsOpen(false)
      setAlertType('success')
      setAlertMessage('Grupo actualizado correctamente')
      setIsAlertOpen(true)
      cargarDatos()
    } catch (error) {
      setAlertType('error')
      setAlertMessage('Error al procesar la solicitud')
      setIsAlertOpen(true)
    }
  }

  const limpiarFormulario = () => {
    setMateriaId('')
    setCohorteId('')
    setDocenteId('')
    setGrupoId(null)
    setProgramaId('')
    setPensumId('')
    setModoEdicion(false)
    setGrupoSeleccionado(null)
  }

  const getNombreCompleto = (profesor) => {
    const primerNombre = profesor.primerNombre || ''
    const segundoNombre = profesor.segundoNombre || ''
    const primerApellido = profesor.primerApellido || ''
    const segundoApellido = profesor.segundoApellido || ''
    return `${primerNombre} ${segundoNombre} ${primerApellido} ${segundoApellido}`.trim()
  }

  return (
    <div className='p-4 w-full flex flex-col justify-center items-center'>
      <div className='w-full flex items-center justify-between mb-8'>
        <p className='text-center text-titulos flex-1'>Grupos</p>
        {!isGoogleUser && (
          <Boton onClick={() => { limpiarFormulario(); setIsOpen(true) }}>
            Crear grupo
          </Boton>
        )}
      </div>
      <Tabla
        informacion={informacion}
        filtros={filtros}
        columnas={columnas}
        acciones={acciones}
        elementosPorPagina={10}
        cargandoContenido={cargandoGrupos}
      />

      <Modal
        size='xl'
        isOpen={isOpen}
        onOpenChange={(open) => { setIsOpen(open); if (!open) limpiarFormulario() }}
        cabecera={modoEdicion ? 'Editar Grupo' : 'Crear Grupo'}
        cuerpo={
          <Form
            className='flex flex-col gap-4'
            onSubmit={modoEdicion ? actualizarGrupoVinculado : crearYVincularGrupo}
          >
            {!modoEdicion && (
              <>
                <div className='w-full py-4'>
                  <Autocomplete
                    variant='bordered'
                    className='w-full'
                    defaultItems={programas}
                    selectedKey={programaId}
                    label='Programa'
                    size='md'
                    placeholder='Selecciona el programa'
                    labelPlacement='outside'
                    isRequired
                    onSelectionChange={(id) => setProgramaId(id || '')}
                    isInvalid={programaIdErrors.length > 0}
                    errorMessage={() => (
                      <ul className='text-xs text-danger mt-1'>
                        {programaIdErrors.map((error, i) => <li key={i}>{error}</li>)}
                      </ul>
                    )}
                  >
                    {(programa) => (
                      <AutocompleteItem key={programa.id.toString()}>
                        {programa.codigo + ' - ' + programa.nombre}
                      </AutocompleteItem>
                    )}
                  </Autocomplete>
                </div>

                {programaId && (
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
                      onSelectionChange={(id) => setPensumId(id || '')}
                      isInvalid={pensumIdErrors.length > 0}
                      errorMessage={() => (
                        <ul className='text-xs text-danger mt-1'>
                          {pensumIdErrors.map((error, i) => <li key={i}>{error}</li>)}
                        </ul>
                      )}
                    >
                      {(pensum) => (
                        <AutocompleteItem key={pensum.id.toString()}>
                          {pensum.nombre}
                        </AutocompleteItem>
                      )}
                    </Autocomplete>
                  </div>
                )}

                {pensumId && (
                  <div className='w-full py-4'>
                    <Autocomplete
                      variant='bordered'
                      className='w-full'
                      defaultItems={materias}
                      selectedKey={materiaId}
                      label='Materia'
                      size='md'
                      placeholder='Selecciona la materia'
                      labelPlacement='outside'
                      isRequired
                      isDisabled={modoEdicion}
                      onSelectionChange={(id) => { if (!modoEdicion) setMateriaId(id || '') }}
                      isInvalid={materiaIdErrors.length > 0}
                      errorMessage={() => (
                        <ul className='text-xs text-danger mt-1'>
                          {materiaIdErrors.map((error, i) => <li key={i}>{error}</li>)}
                        </ul>
                      )}
                    >
                      {(materia) => (
                        <AutocompleteItem key={materia.id.toString()}>
                          {materia.codigo + ' - ' + materia.nombre}
                        </AutocompleteItem>
                      )}
                    </Autocomplete>
                  </div>
                )}
              </>
            )}

            <div className='w-full py-4'>
              <Autocomplete
                variant='bordered'
                className='w-full'
                defaultItems={gruposCohorte}
                selectedKey={cohorteId}
                label='Cohorte'
                size='md'
                placeholder='Selecciona la cohorte'
                labelPlacement='outside'
                isRequired
                isDisabled={modoEdicion}
                onSelectionChange={(id) => setCohorteId(id || '')}
                isInvalid={cohorteIdErrors.length > 0}
                errorMessage={() => (
                  <ul className='text-xs text-danger mt-1'>
                    {cohorteIdErrors.map((error, i) => <li key={i}>{error}</li>)}
                  </ul>
                )}
              >
                {(grupo) => (
                  <AutocompleteItem key={grupo.id.toString()}>
                    {grupo.nombre}
                  </AutocompleteItem>
                )}
              </Autocomplete>
            </div>

            <div className='w-full py-4'>
              <Autocomplete
                variant='bordered'
                className='w-full'
                defaultItems={profesores}
                selectedKey={docenteId}
                label='Profesor'
                size='md'
                placeholder='Selecciona el profesor'
                labelPlacement='outside'
                isRequired
                onSelectionChange={(id) => setDocenteId(id || '')}
                isInvalid={docenteIdErrors.length > 0}
                errorMessage={() => (
                  <ul className='text-xs text-danger mt-1'>
                    {docenteIdErrors.map((error, i) => <li key={i}>{error}</li>)}
                  </ul>
                )}
              >
                {(profesor) => (
                  <AutocompleteItem key={profesor.id.toString()}>
                    {getNombreCompleto(profesor)}
                  </AutocompleteItem>
                )}
              </Autocomplete>
            </div>

            <div className='w-full flex justify-end mb-[-20px]'>
              <Boton type={'submit'}>
                {modoEdicion ? 'Guardar cambios' : 'Crear grupo'}
              </Boton>
            </div>
          </Form>
        }
      />

      <Modal
        size='5xl'
        isOpen={isOpenView}
        onOpenChange={(open) => { setIsOpenView(open); if (!open) setGrupoSeleccionado(null) }}
        cabecera='Detalles del Grupo'
        cuerpo={
          grupoSeleccionado && (
            <div className='w-full flex flex-col'>
              <div className='w-full flex flex-row mb-4'>
                <Input
                  classNames={{
                    label: `w-1/4 h-[40px] flex items-center group-data-[has-helper=true]:pt-0`,
                    base: 'flex items-start',
                    inputWrapper: 'border border-gris-institucional rounded-[15px] w-full max-h-[40px]',
                    mainWrapper: 'w-[70%]'
                  }}
                  label='Código'
                  labelPlacement='outside-left'
                  name='codigo'
                  type='text'
                  readOnly
                  value={grupoSeleccionado.Código || ''}
                />
                <Input
                  classNames={{
                    label: `w-1/4 h-[40px] flex items-center group-data-[has-helper=true]:pt-0`,
                    base: 'flex items-start',
                    inputWrapper: 'border border-gris-institucional rounded-[15px] w-full max-h-[40px]',
                    mainWrapper: 'w-[70%]'
                  }}
                  label='Nombre'
                  labelPlacement='outside-left'
                  name='nombre'
                  type='text'
                  readOnly
                  value={grupoSeleccionado.Nombre || ''}
                />
              </div>
              <div className='w-full flex flex-row mb-4'>
                <Input
                  classNames={{
                    label: `w-1/4 h-[40px] flex items-center group-data-[has-helper=true]:pt-0`,
                    base: 'flex items-start',
                    inputWrapper: 'border border-gris-institucional rounded-[15px] w-full max-h-[40px]',
                    mainWrapper: 'w-[70%]'
                  }}
                  label='Cohorte'
                  labelPlacement='outside-left'
                  name='cohorte'
                  type='text'
                  readOnly
                  value={grupoSeleccionado.Cohorte || ''}
                />
                <Input
                  classNames={{
                    label: `w-1/4 h-[40px] flex items-center group-data-[has-helper=true]:pt-0`,
                    base: 'flex items-start',
                    inputWrapper: 'border border-gris-institucional rounded-[15px] w-full max-h-[40px]',
                    mainWrapper: 'w-[70%]'
                  }}
                  label='Profesor'
                  labelPlacement='outside-left'
                  name='profesor'
                  type='text'
                  readOnly
                  value={grupoSeleccionado.Profesor || ''}
                />
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
export default Grupos