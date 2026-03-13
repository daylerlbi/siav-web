import { Alert } from "@heroui/alert"
import Actividades from "../componentes/Actividades"
import { CalendarDays, Clock, Circle, User, CheckCircle, Link2, CircleHelp, File, Download, Upload, Send } from "lucide-react"
import Boton from "../../../Boton"
import useProject from "../../../../lib/hooks/useProject"
import { useState, useEffect } from "react"
import MensajeFase from "../componentes/MensajeFase"
import ConfirmarRevisionModal from "../componentes/ConfirmarRevisionModal"
import ModalSubirCorreccion from "../../../sustentaciones/ModalSubirCorreccion"

export default function Fase_8({ project, adminView = false }) {
   const actividades = [
      {
         title: "Aprobación de la Sustentación",
         tasks: [
            { desc: "Revisar detalles de la sustentación" },
            { desc: "Llegar al menos 15 minutos antes" },
            { desc: "Estar preparado para responder preguntas" },
         ],
      }
   ]

   const { listSustentaciones, getDocuments, sendDocuments, deleteDocumentos, setReviewState } = useProject()
   const [sustentacion, setSustentacion] = useState(null)
   const [listActas, setListActas] = useState([])
   const [showDeleteModal, setShowDeleteModal] = useState(false)
   const [actaToDelete, setActaToDelete] = useState(null)
   const [documentos, setDocumentos] = useState([])
   const [showSuccess, setShowSuccess] = useState({ message: "", state: false })
   const [showConfirmModal, setShowConfirmModal] = useState(false)
   const [modalCorreccion, setModalCorreccion] = useState({ open: false, documento: null })

   useEffect(() => {
      const fetchAll = async () => {
         try {
            const data = await listSustentaciones(project.id)
            const tesis = data.find(s => s.tipoSustentacion === "TESIS")
            setSustentacion(tesis)

            const actas = await getDocuments(project.id, "ACTABORRADOR")
            setListActas(actas || [])

            const docs = await getDocuments(project.id, "TESIS")
            setDocumentos(docs || [])
         } catch (error) {
            console.error("Error fetching sustentaciones:", error)
         }
      }
      fetchAll()
   }, [])

   // Subir nueva acta de borrador
   const handleSubirActaBorrador = async (e) => {
      e.preventDefault()
      const file = e.target.actaArchivo.files[0]
      if (!file) return
      await sendDocuments(
         project.id,
         "ACTABORRADOR", // tipoDocumento
         "ActaBorrador", // tag
         file
      )
      const actas = await getDocuments(project.id, "ACTABORRADOR")
      setListActas(actas || [])
      e.target.reset()
   }

   // Eliminar acta
   const handleDeleteActaClick = (acta) => {
      setActaToDelete(acta)
      setShowDeleteModal(true)
   }
   const handleConfirmDeleteActa = async () => {
      if (actaToDelete) {
         await deleteDocumentos(actaToDelete.id)
         const actas = await getDocuments(project.id, "ACTABORRADOR")
         setListActas(actas || [])
         setShowDeleteModal(false)
         setActaToDelete(null)
      }
   }
   const handleCancelDeleteActa = () => {
      setShowDeleteModal(false)
      setActaToDelete(null)
   }

   // Subir corrección de documento
   const handleSubirCorreccion = async (archivo) => {
      const doc = modalCorreccion.documento
      setModalCorreccion({ open: false, documento: null })
      if (!doc || !archivo) return
      await deleteDocumentos(doc.id)
      await sendDocuments(
         project.id,
         doc.tipoDocumento,
         doc.tag,
         archivo
      )
      const docs = await getDocuments(project.id, "TESIS")
      setDocumentos(docs)
   }

   // Enviar a revisión (cuando el estudiante sube correcciones)
   const handleReview = async () => {
      const data = {
         estadoRevision: "EN_REVISION",
         comentarioRevision: ""
      }
      setReviewState(project?.id, data)
         .then(() => {
            setShowSuccess({
               message: "Cambios enviados a revisión correctamente",
               state: true
            })
            setTimeout(() => setShowSuccess({ message: "", state: false }), 3000)
            setTimeout(() => window.location.reload(), 3000)
         })
         .catch((error) => {
            console.error("Error al enviar a revisión:", error)
            alert("Error al enviar el proyecto a revisión. Inténtalo de nuevo más tarde.")
         })
   }

   // Permite edición si está en fase 8 y no está aceptada
   const puedeEditar = (
      project?.estadoActual === 8 &&
      (project?.estadoRevision === null ||
         project?.estadoRevision === "RECHAZADA" ||
         project?.estadoRevision === "SIN_REVISAR") &&
      !adminView
   )

   return sustentacion && (
      <>
         <section className="space-y-5">
            <div>
               <h4 className="font-bold text-2xl">Fase 8: Aprobación de la Sustentación</h4>
               <p className="text-gris-institucional text-sm">
                  Revise los detalles de la sustentación aprobada y confirme su asistencia
               </p>
               {project && <MensajeFase estadoRevision={project?.estadoActual > 8 ? "ACEPTADA" : project?.estadoRevision} mensaje={project?.comentarioRevision} />}
            </div>

            <Actividades taskList={actividades} />

            <Alert
               title={"Sustentación Aprobada"}
               classNames={{
                  title: "font-bold text-base",
                  base: "border-success bg-success-light text-success border py-5",
                  iconWrapper: "bg-transparent border-0 shadow-none",
                  description: "text-success"
               }}
               description={sustentacion?.descripcion ?? "Sin descripción"}
               icon={<><CheckCircle size={24} /></>}
            />
            {
               !!sustentacion.sustentacionRealizada === false &&
               <div className="border-gris-claro rounded-md border p-4">
                  <h6 className="font-bold">Detalles de la Sustentación</h6>
                  <div className="grid grid-cols-12 items-center gap-10 p-4">
                     <div className="flex flex-col gap-4 col-span-3">
                        <div className="flex items-center gap-2">
                           <CalendarDays size={24} />
                           <div className="flex flex-col justify-center">
                              <h6 className="font-bold text-sm">Fecha</h6>
                              <p className="text-gris-institucional text-xs">
                                 {
                                    (() => {
                                       const dateStr = sustentacion?.fecha
                                       if (!dateStr) return ''
                                       const [year, month, day] = dateStr.split('-').map(num => parseInt(num, 10))
                                       const date = new Date(year, month - 1, day)
                                       return date.toLocaleDateString('es-ES', {
                                          day: '2-digit',
                                          month: 'long',
                                          weekday: 'long',
                                          year: 'numeric'
                                       })
                                    })()
                                 }
                              </p>
                           </div>
                        </div>
                        <div className="flex items-center gap-2">
                           <Clock size={24} />
                           <div className="flex flex-col justify-center">
                              <h6 className="font-bold text-sm">Hora</h6>
                              <p className="text-gris-institucional text-xs">{sustentacion?.hora?.slice(0, 5)} hrs</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-2">
                           <Link2 className="-rotate-45" size={24} />
                           <div className="flex flex-col justify-center">
                              <h6 className="font-bold text-sm">Link</h6>
                              <a href={sustentacion?.lugar} target="_blank" className="text-blue-600 hover:text-blue-800 duration-150 text-xs">{sustentacion?.lugar}</a>
                           </div>
                        </div>
                     </div>
                     <div className="flex flex-col gap-4 col-span-4">
                        <div className="flex items-center gap-4">
                           <User size={24} />
                           <h6 className="font-bold">Jurados Asignados</h6>
                        </div>
                        <div className="py-2 ml-1 space-y-2">
                           {
                              sustentacion?.evaluadores.length === 0
                                 ? <div className="flex items-center gap-4">
                                    <Circle size={16} />
                                    <span className="text-gris-intermedio text-sm flex">Sin jurados asignados</span>
                                 </div>
                                 : sustentacion?.evaluadores.map((jurado, index) =>
                                    <div key={index} className="flex items-center gap-4">
                                       <Circle size={16} />
                                       <p className="text-black text-sm">{jurado?.nombreUsuario}</p>
                                    </div>
                                 )
                           }
                        </div>
                     </div>
                     <div className="flex flex-col gap-4 col-span-5">
                        <div className="flex items-center gap-4">
                           <CircleHelp size={24} />
                           <h6 className="font-bold">Criterios de Evaluación</h6>
                        </div>
                        {
                           sustentacion.criteriosEvaluacion.length === 0 ?
                              <>
                                 <div className="flex items-center gap-4">
                                    <Circle size={16} />
                                    <p className="text-black text-sm">
                                       Llegue al menos 15 minutos antes de la hora programada para preparar su presentación.
                                    </p>
                                 </div>
                                 <div className="flex items-center gap-4">
                                    <Circle size={16} />
                                    <p className="text-black text-sm">
                                       Esté preparado para responder preguntas del comité evaluador después de su presentación.
                                    </p>
                                 </div>
                              </>
                              : sustentacion.criteriosEvaluacion?.map(ce =>
                                 <div key={ce.id} className="flex items-center gap-4 ml-1">
                                    <Circle size={16} />
                                    <p className="text-black text-sm">
                                       {ce.descripcion}
                                    </p>
                                 </div>
                              )
                        }
                     </div>
                  </div>
               </div>
            }
            {/* SECCIÓN DE ACTAS DE BORRADOR */}
            {Array.isArray(listActas) && (
               <section className="my-10">
                  <div className="mb-4">
                     <h5 className="font-bold text-lg">Acta de Sustentación del Trabajo de Grado</h5>
                     <p className="text-gris-institucional text-sm">Este documento certifica la entrega y sustentación de tu trabajo de grado ante el comité evaluador.</p>
                  </div>
                  <div className="flex flex-col gap-3">
                     {listActas.map(acta => (
                        <div
                           key={acta.id}
                           className="border-gris-claro rounded-md border flex flex-col md:flex-row md:items-center justify-between gap-2 p-4"
                        >
                           <div className="flex items-center gap-2 flex-1 min-w-0">
                              <File size={22} className="text-blue-400 shrink-0" />
                              <div className="flex flex-col min-w-0">
                                 <span className="truncate font-semibold text-sm">{acta.nombre}</span>
                                 <span className="text-xs text-gray-500">{acta.peso}</span>
                              </div>
                           </div>
                           <div className="flex gap-2 flex-shrink-0">
                              <a
                                 href={acta.url}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 download
                              >
                                 <Boton type="button" variant="borderwhite" customClassName="w-fit">
                                    Descargar
                                 </Boton>
                              </a>
                              {adminView && (
                                 <Boton
                                    type="button"
                                    variant="whitered"
                                    customClassName="w-fit"
                                    onClick={() => handleDeleteActaClick(acta)}
                                 >
                                    Eliminar
                                 </Boton>
                              )}
                           </div>
                        </div>
                     ))}
                  </div>
                  {adminView && (
                     <div className="mt-6 space-y-2">
                        <label className="font-bold select-none">Agregar Acta Original</label>
                        <form
                           onSubmit={handleSubirActaBorrador}
                           className="flex flex-col md:flex-row gap-2 items-center"
                        >
                           <input
                              type="file"
                              name="actaArchivo"
                              required
                              className="border rounded p-2 text-sm"
                              accept=".pdf"
                           />
                           <Boton type="submit" variant="borderwhite" customClassName="w-fit">
                              Subir Acta
                           </Boton>
                        </form>
                     </div>
                  )}
               </section>
            )}

            {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
            {showDeleteModal && (
               <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                  <div className="bg-white rounded-md p-6 max-w-sm w-full flex flex-col gap-4">
                     <h6 className="font-bold text-lg">¿Eliminar acta?</h6>
                     <p className="text-sm">
                        ¿Estás seguro de que deseas eliminar el acta <b>{actaToDelete?.nombre}</b>? Esta acción no se puede deshacer.
                     </p>
                     <div className="flex gap-2 justify-end">
                        <Boton variant="borderwhite" onClick={handleCancelDeleteActa}>
                           Cancelar
                        </Boton>
                        <Boton variant="whitered" onClick={handleConfirmDeleteActa}>
                           Eliminar
                        </Boton>
                     </div>
                  </div>
               </div>
            )}

            {/* Retroalimentación de los jurados */}
            <div className="border-gris-claro rounded-md border p-4 mt-6">
               <h6 className="font-bold mb-2">Retroalimentación de los jurados</h6>
               {
                  !sustentacion?.sustentacionRealizada ? <div className="text-gray-400 text-sm">Aún no hay retroalimentaciones registradas.</div> :
                     <>
                        {sustentacion?.evaluadores?.filter(j => j.observaciones || j.nota !== null).length === 0 ? (
                           <div className="text-gray-400 text-sm">Aún no hay retroalimentaciones registradas.</div>
                        ) : (
                           <div className="space-y-4">
                              {sustentacion.evaluadores
                                 .filter(j => j.observaciones || j.nota !== null)
                                 .map((jurado, idx) => (
                                    <div key={idx} className="border rounded-md p-3 flex flex-col gap-1 bg-gray-50">
                                       <div className="flex items-center gap-2">
                                          <span className="font-semibold">{jurado.nombreUsuario}</span>
                                       </div>
                                       {jurado.observaciones && (
                                          <div className="text-gray-700 text-sm whitespace-pre-line">
                                             {jurado.observaciones}
                                          </div>
                                       )}
                                       {typeof jurado.nota === "number" && (
                                          <div className="text-xs text-gray-500">Nota: {jurado.nota}</div>
                                       )}
                                    </div>
                                 ))}
                           </div>
                        )}
                     </>
               }
            </div>

            {/* Correcciones de los documentos */}
            {
               sustentacion?.sustentacionRealizada &&
               <div className="border-gris-claro rounded-md border p-4 mt-6">
                  <h6 className="font-bold mb-2">Documentos</h6>
                  {documentos.length === 0 ? (
                     <div className="text-gray-400 text-sm">Aún no hay documentos cargados.</div>
                  ) : (
                     <div className="space-y-4">
                        {documentos.map((doc, idx) => (
                           <div key={idx} className="border rounded-md p-3 flex items-center justify-between bg-gray-50">
                              <div className="flex items-center gap-2">
                                 <File size={20} className="text-blue-500" />
                                 <span className="font-semibold">{doc.nombre}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                 {
                                    (!adminView && (project.estadoRevision === "SIN_REVISAR" || project.estadoRevision === "RECHAZADA")) &&
                                    <Boton
                                       variant={"whitered"}
                                       customClassName="w-fit"
                                       onClick={() => setModalCorreccion({ open: true, documento: doc })}
                                    >
                                       <Upload size={18} />
                                       Subir Corrección
                                    </Boton>
                                 }
                                 <a
                                    href={doc.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 duration-150 text-xs"
                                 >
                                    <Boton variant={"borderwhite"} customClassName="w-fit">
                                       <Download size={18} />
                                       Descargar
                                    </Boton>
                                 </a>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            }

            {
               showSuccess.state && (
                  <div className="bg-green-100 border-green-400 text-green-700 z-40 whitespace-nowrap w-fit
               border px-4 py-2 fixed bottom-10 right-10 rounded mb-2 text-sm font-semibold flex items-center gap-2">
                     <CheckCircle size={18} />
                     {showSuccess.message}
                  </div>
               )
            }

            {
               (sustentacion?.sustentacionRealizada && (project?.estadoRevision === "SIN_REVISAR" || project?.estadoRevision === "RECHAZADA")) &&
               <div className="flex justify-between gap-4 mt-6">
                  <p>
                     <span className="text-rojo-institucional font-bold">Importante:&nbsp;</span>
                     Para avanzar a la siguiente fase, es obligatorio implementar todas las retroalimentaciones proporcionadas por los jurados. Revisa cuidadosamente cada observación y asegúrate de realizar las correcciones necesarias antes de enviar el proyecto a revisión.
                  </p>
                  {
                     !adminView &&
                     < Boton
                        type="button"
                        variant="whitered"
                        customClassName="w-60"
                        onClick={() => setShowConfirmModal(true)}
                     >
                        Enviar a Revisión
                        <Send size={16} />
                     </Boton>
                  }
               </div >
            }
         </section>

         <ModalSubirCorreccion
            recomendaciones={sustentacion?.evaluadores}
            isOpen={modalCorreccion.open}
            documento={modalCorreccion.documento}
            onClose={() => setModalCorreccion({ open: false, documento: null })}
            onSubir={handleSubirCorreccion}
         />

         {/* Modal de confirmación */}
         <ConfirmarRevisionModal
            isOpen={showConfirmModal}
            onCancel={() => setShowConfirmModal(false)}
            onConfirm={() => {
               setShowConfirmModal(false)
               handleReview()
            }}
         />
      </>
   )
}