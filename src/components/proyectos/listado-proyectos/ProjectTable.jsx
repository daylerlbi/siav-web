import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import CambiarFaseModal from "../../admin/CambiarFaseModal"
import useAdmin from "../../../lib/hooks/useAdmin"
import CrearSustentacionForm from "../../admin/CrearSustentacionForm"
import AsignarDirectoresModal from "../../admin/AsignarDirectoresModal"
import AsignarComentariosJuradosModal from "../../admin/AsignarComentariosJuradosModal"
import { useAuth } from "../../../lib/hooks/useAuth"
import useProject from "../../../lib/hooks/useProject"
import EliminarProyectoModal from "../../admin/EliminarProyectoModal"
import EstadoRevision from "../seguimiento/componentes/EstadoRevision"
import RevisarFaseModal from "../../admin/RevisarFaseModal"
import ConfirmarCompletarSustentacionModal from "../../admin/ConfirmarCompletarSustentacionModal"

export default function ProjectTable({ projectList }) {
   const { obtenerDocentes, asignarDirectores, actualizarFase, deleteProject, guardarComentariosJurados, completeSustentacion } = useAdmin()
   const { listSustentaciones, getDocuments, asignarDefinitivaAction, setReviewState } = useProject()
   const [modalDirectores, setModalDirectores] = useState(null)
   const [docentes, setDocentes] = useState([])
   const [openActions, setOpenActions] = useState({})
   const dropdownRefs = useRef({})
   const [modalEliminarProyecto, setModalEliminarProyecto] = useState(null)
   const [modalProyecto, setModalProyecto] = useState(null)
   const [modalSustentacion, setModalSustentacion] = useState(null)
   const [modalComentarios, setModalComentarios] = useState(false)
   const [sustentacionSeleccionada, setSustentacionSeleccionada] = useState(null)
   const [modalCompletarSustentacion, setModalCompletarSustentacion] = useState(null)
   const [modalEditarSustentacion, setModalEditarSustentacion] = useState(null)
   const [listDocumentos, setListDocumentos] = useState([])
   const [modalRevisarFase, setModalRevisarFase] = useState(null)

   const { userRole } = useAuth()

   const toggleActions = (projectId) => {
      setOpenActions(prev => ({
         ...prev,
         [projectId]: !prev[projectId]
      }))
   }

   useEffect(() => { obtenerDocentes().then(setDocentes) }, [])

   useEffect(() => {
      function handleClickOutside(event) {
         Object.keys(openActions).forEach(projectId => {
            if (
               openActions[projectId] &&
               dropdownRefs.current[projectId] &&
               !dropdownRefs.current[projectId].contains(event.target)
            ) {
               setOpenActions(prev => ({ ...prev, [projectId]: false }))
            }
         })
      }
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
   }, [openActions])

   const handleConfirmarCambioFase = async (proyecto) => {
      if (proyecto.estadoActual !== 8) {
         const nuevoEstado = proyecto.estadoActual + 1
         const res = await actualizarFase({ idProyecto: proyecto.id, faseNueva: { estadoActual: nuevoEstado } })
         if (res) {
            if (Array.isArray(projectList)) {
               const idx = projectList.findIndex(p => p.id === proyecto.id)
               if (idx !== -1) projectList[idx].estadoActual = nuevoEstado
            }
         }
      } else {
         await asignarDefinitivaAction(proyecto.id)
         const res = await actualizarFase({ idProyecto: proyecto.id, faseNueva: { estadoActual: 0 } })
         if (res) {
            if (Array.isArray(projectList)) {
               const idx = projectList.findIndex(p => p.id === proyecto.id)
               if (idx !== -1) projectList[idx].estadoActual = 0
            }
         }
      }
      setModalProyecto(null)
      setOpenActions({})
   }

   // Lógica real para eliminar el proyecto
   const handleEliminarProyecto = async (proyecto) => {
      await deleteProject(proyecto.id)
      setModalEliminarProyecto(null)
      if (typeof obtenerDocentes === "function") obtenerDocentes().then(setDocentes)
      if (typeof window !== "undefined") window.location.reload()
   }

   return (
      <>
         <table className="flex flex-col rounded-md border">
            <thead className="bg-black/5 p-4">
               <tr className="grid grid-cols-12 gap-2">
                  <th className="col-span-3 text-start">Estudiante</th>
                  <th className="col-span-2 text-start">Grupo</th>
                  <th className="col-span-2 text-start">Linea</th>
                  <th className="col-span-1 text-start">Estado</th>
                  <th className="col-span-1 text-start">Fase</th>
                  <th className="col-span-2 text-start">Proyecto</th>
                  <th className="col-span-1 text-center">Acciones</th>
               </tr>
            </thead>
            <tbody className="text-sm">
               {
                  projectList.map(project => (
                     <tr key={project.id} className="grid grid-cols-12 items-center gap-2 p-4">
                        <td className="col-span-3 flex gap-2 items-center">
                           {(() => {
                              const estudiante = project.usuariosAsignados?.find(u => u.rol.nombre.toLowerCase() === "estudiante")
                              return (
                                 <>
                                    <span className="w-10 h-10 rounded-full overflow-hidden">
                                       <img
                                          src={estudiante?.fotoUsuario ?? "https://placehold.co/250x250/4477ba/white?text=User"}
                                          alt={estudiante?.nombreUsuario ?? "Estudiante"}
                                       />
                                    </span>
                                    <div className="flex flex-col">
                                       <h6 className="text-base font-bold">{estudiante?.nombreUsuario ?? "Sin estudiante"}</h6>
                                       <p className="text-gris-intermedio">{estudiante?.email ?? ""}</p>
                                    </div>
                                 </>
                              )
                           })()}
                        </td>
                        <td className="col-span-2">
                           {project.lineaInvestigacion?.grupoInvestigacion?.nombre ?? <b className="text-rojo-mate">Sin grupo asignado</b>}
                        </td>
                        <td className="col-span-2">
                           {project.lineaInvestigacion?.nombre ?? <b className="text-rojo-mate">Sin línea asignada</b>}
                        </td>
                        <td>
                           <EstadoRevision estadoRevision={project.estadoRevision} faseActual={project.estadoActual} />
                        </td>
                        <td className="col-span-1">
                           {project.estadoActual === 0 ? "Terminado" : `Fase ${project.estadoActual ?? "-"}`}
                        </td>
                        <td className="col-span-2">
                           {project.titulo}
                        </td>
                        <td
                           className="relative col-span-1 place-self-center w-full"
                           ref={el => dropdownRefs.current[project.id] = el}
                        >
                           <button
                              id="custom-ellipsis"
                              onClick={() => toggleActions(project.id)}
                              className="flex justify-center items-center gap-1 p-2 w-full"
                           >
                              <span id="dot" />
                              <span id="dot" />
                              <span id="dot" />
                           </button>
                           {openActions[project.id] && (
                              <div className="bg-white whitespace-nowrap border rounded-md absolute z-30 top-[115%] right-0 select-animation flex flex-col">

                                 {/* Ver proyecto: SIEMPRE SE MUESTRA */}
                                 <Link className="hover:bg-gris-claro/50 duration-150 p-2" to={`/listado-proyectos/${project.id}`}>
                                    Ver proyecto
                                 </Link>

                                 {/* Revisar fase: solo si el proyecto NO está terminado y estadoRevision es EN_REVISION */}
                                 {
                                    (((project.estadoActual !== 0) && (project.estadoRevision === "EN_REVISION")) || (project.estadoActual === 6 && project.estadoRevision !== "ACEPTADA")) && (
                                       <button className="hover:bg-gris-claro/50 duration-150 p-2 text-left" onClick={() => setModalRevisarFase(project)}>
                                          Revisar fase
                                       </button>
                                    )
                                 }

                                 {/* solo si el usuario es ADMIN o SUPERADMIN */}
                                 {
                                    (userRole === "ROLE_ADMIN" || userRole === "ROLE_SUPERADMIN") && (
                                       <>
                                          {/* Marcar sustentación como completada: solo si estadoActual es 4 u 8 */}
                                          {
                                             ((project.estadoActual === 4 || project.estadoActual === 8) && (project.estadoRevision !== "ACEPTADA" && project.estadoRevision !== "EN_REVISION")) && (
                                                <button
                                                   className="hover:bg-gris-claro/50 duration-150 p-2 text-left"
                                                   onClick={async () => {
                                                      // Busca jurados de la sustentación actual
                                                      const sustentacion = await listSustentaciones(project.id)
                                                      const docs = await getDocuments(project.id, project.estadoActual === 4 ? "ANTEPROYECTO" : "TESIS")
                                                      const acta = await getDocuments(project.id, project.estadoActual === 4 ? "ACTAAPROBACION" : "ACTABORRADOR")
                                                      setModalCompletarSustentacion({
                                                         proyecto: project,
                                                         jurados: sustentacion[sustentacion.length - 1]?.evaluadores || [],
                                                         sustentacionRealizada: sustentacion[sustentacion.length - 1]?.sustentacionRealizada,
                                                         documentos: docs,
                                                         acta: acta,
                                                         estadoFase: project.estadoRevision,
                                                         faseActual: project.estadoActual
                                                      })
                                                   }}
                                                >
                                                   Configurar sustentación
                                                </button>
                                             )
                                          }

                                          {/* Cambiar de fase: solo si NO es fase 3 ni 7, y estadoRevision es ACEPTADA */}
                                          {
                                             ((project.estadoActual !== 3 && project.estadoActual !== 7 && project.estadoActual !== 0) &&
                                                (project.estadoRevision === "ACEPTADA")) && (
                                                <button className="hover:bg-gris-claro/50 duration-150 p-2 text-left" onClick={() => setModalProyecto(project)}>
                                                   {project.estadoActual !== 8 ? "Cambiar de fase" : "Finalizar proyecto"}
                                                </button>
                                             )
                                          }

                                          {/* Crear sustentación: solo si es fase 3 o fase 7, y estadoRevision es ACEPTADA */}
                                          {
                                             ((project.estadoActual === 3 || project.estadoActual === 7) && (project.estadoRevision === "ACEPTADA")) && (
                                                <button className="hover:bg-gris-claro/50 duration-150 p-2 text-left" onClick={() => setModalSustentacion(project)}>
                                                   Crear Sustentación
                                                </button>
                                             )
                                          }

                                          {/* Asignar director y codirector: siempre */}
                                          {
                                             project.estadoActual !== 0 &&
                                             (() => {
                                                const tieneDirector = project.usuariosAsignados?.some(u => u.rol?.nombre === "Director")
                                                const tieneCodirector = project.usuariosAsignados?.some(u => u.rol?.nombre === "Codirector")
                                                return (
                                                   <button className="hover:bg-gris-claro/50 duration-150 p-2 text-left" onClick={() => setModalDirectores(project)}>
                                                      {(tieneDirector && tieneCodirector) ? "Reasignar" : "Asignar"} Directores
                                                   </button>
                                                )
                                             })()
                                          }

                                          <button className="hover:bg-rojo-claro text-red-500 duration-150 p-2 text-left" onClick={() => setModalEliminarProyecto(project)}>
                                             Eliminar Proyecto
                                          </button>
                                       </>
                                    )
                                 }
                              </div>
                           )}
                        </td>
                     </tr>
                  ))
               }
            </tbody>
         </table>
         <CambiarFaseModal proyecto={modalProyecto} isOpen={setModalProyecto} onConfirm={handleConfirmarCambioFase} />
         {modalRevisarFase && (
            <RevisarFaseModal
               proyecto={modalRevisarFase}
               isOpen={!!modalRevisarFase}
               onClose={() => {
                  setModalRevisarFase(null)
               }}
            />
         )}
         {modalSustentacion && (
            <CrearSustentacionForm
               isOpen={setModalSustentacion}
               proyecto={modalSustentacion}
            />
         )}
         {modalDirectores && (
            <AsignarDirectoresModal
               isOpen={setModalDirectores}
               proyecto={modalDirectores}
               docentes={docentes}
               onAsignar={async ({ director, codirector }) => {
                  // Asignar director (rol id 3), solo si existe
                  if (director) {
                     await asignarDirectores({
                        body: {
                           idUsuario: director.id,
                           idProyecto: modalDirectores.id,
                           rol: { id: 3 }
                        }
                     })
                  }
                  // Asignar codirector (rol id 5), solo si existe
                  if (codirector) {
                     await asignarDirectores({
                        body: {
                           idUsuario: codirector.id,
                           idProyecto: modalDirectores.id,
                           rol: { id: 5 }
                        }
                     })
                  }
               }}
            />
         )}
         {modalComentarios && sustentacionSeleccionada && (
            <AsignarComentariosJuradosModal
               isOpen={setModalComentarios}
               sustentacion={sustentacionSeleccionada}
               documentosTesis={listDocumentos}
               onSave={() => setModalComentarios(false)}
            />
         )}
         {modalEliminarProyecto && (
            <EliminarProyectoModal
               proyecto={modalEliminarProyecto}
               isOpen={setModalEliminarProyecto}
               onConfirm={handleEliminarProyecto}
            />
         )}
         {modalEditarSustentacion && (
            <CrearSustentacionForm
               isOpen={setModalEditarSustentacion}
               proyecto={modalEditarSustentacion.proyecto}
               sustentacion={modalEditarSustentacion.sustentacion}
            />
         )}
         {modalCompletarSustentacion && (
            <ConfirmarCompletarSustentacionModal
               isOpen={!!modalCompletarSustentacion}
               documentos={modalCompletarSustentacion.documentos}
               sustentacionRealizada={modalCompletarSustentacion.sustentacionRealizada}
               onCancel={() => setModalCompletarSustentacion(null)}
               estadoFase={modalCompletarSustentacion.estadoFase}
               acta={modalCompletarSustentacion.acta}
               faseActual={modalCompletarSustentacion.faseActual}
               jurados={modalCompletarSustentacion.jurados}
               onConfirm={async ({ retroalimentaciones, requiereCorrecciones }) => {
                  for (const c of retroalimentaciones) {
                     const review = {
                        idSustentacion: c.idSustentacion,
                        idUsuario: c.idUsuario,
                        observaciones: c.observaciones,
                        nota: Number(c.nota)
                     }
                     await guardarComentariosJurados({ body: review })
                  }

                  const body = {
                     estadoRevision: requiereCorrecciones ? "RECHAZADA" : "EN_REVISION",
                     comentarioRevision: requiereCorrecciones ? "Implementa en tus documentos las retroalimentaciones proporcionadas por los jurados y sube los cambios." : "",
                  }
                  await setReviewState(modalCompletarSustentacion.proyecto.id, body)
                  await completeSustentacion(modalCompletarSustentacion.jurados[0].idSustentacion)

                  setModalCompletarSustentacion(null)
                  setTimeout(() => { window.location.reload() }, 1000)
               }}
               onEditarSustentacion={async () => {
                  const sustentacion = await listSustentaciones(modalCompletarSustentacion.proyecto.id)
                  setModalEditarSustentacion({
                     proyecto: modalCompletarSustentacion.proyecto,
                     sustentacion: sustentacion[sustentacion.length - 1]
                  })
               }}
            />
         )}
      </>
   )
}