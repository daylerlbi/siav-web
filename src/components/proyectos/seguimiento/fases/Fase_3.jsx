import EstadoEntrega from "../componentes/EstadoEntrega"
import Actividades from "../componentes/Actividades"
import Boton from "../../../Boton"
import { Save, Download, Upload, File } from "lucide-react"
import useProject from "../../../../lib/hooks/useProject"
import { useEffect, useRef, useState } from "react"
import MensajeFase from "../componentes/MensajeFase"
import { Send } from "lucide-react"
import ConfirmarRevisionModal from "../componentes/ConfirmarRevisionModal"
import { CheckCircle } from "lucide-react"
import { getBackendUrl } from "../../../../lib/controllers/endpoints"

const actividades = [
   {
      title: "Preparación de Presentación Inicial",
      tasks: [
         { desc: "Subir documento del anteproyecto" },
         { desc: "Subir diapositivas del anteproyecto" },
         { desc: "Revisión por director y codirector" },
         { desc: "Realizar ajustes (si es necesario)" },
      ],
   }
]

export default function Fase_3({ project, adminView = false }) {
   const [showSuccess, setShowSuccess] = useState({ message: "", state: false })
   const { getDocuments, sendDocuments, deleteDocumentos, setReviewState } = useProject()
   const [showConfirmModal, setShowConfirmModal] = useState(false)
   const [currentProject, setCurrentProject] = useState(null)
   const [listDocumentos, setListDocumentos] = useState(null)
   const [listActas, setListActas] = useState([])
   const [formData, setFormData] = useState({
      documentoAnteproyecto: null,
      presentacionAnteproyecto: null,
   })
   const [dragTarget, setDragTarget] = useState(null)

   const anteproyectoInputRef = useRef(null)
   const presentacionInputRef = useRef(null)
   const anteproyectoLabelRef = useRef(null)
   const presentacionLabelRef = useRef(null)

   useEffect(() => { fetchProject() }, [])
   useEffect(() => { if (!!currentProject) setDocumentosFase(currentProject.id) }, [currentProject])

   const fetchProject = async () => { setCurrentProject(project) }

   const setDocumentosFase = async (projectId) => {
      const docs = await getDocuments(projectId, "ANTEPROYECTO")
      setListDocumentos(docs)

      const actas = await getDocuments(projectId, "ACTASOLICITUD")
      setListActas(actas || [])
   }

   const handleDragOver = (event, target) => {
      event.preventDefault()
      event.stopPropagation()
      setDragTarget(target)
   }

   const handleDragLeave = (event) => {
      event.preventDefault()
      event.stopPropagation()
      setDragTarget(null)
   }

   const handleDrop = (event, target) => {
      event.preventDefault()
      event.stopPropagation()
      setDragTarget(null)
      if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
         const file = event.dataTransfer.files[0]
         if (file.type === 'application/pdf') {
            if (target === 'anteproyecto') {
               setFormData({ ...formData, documentoAnteproyecto: file })
            } else if (target === 'presentacion') {
               setFormData({ ...formData, presentacionAnteproyecto: file })
            }
         } else {
            alert('Por favor, suba únicamente archivos PDF')
         }
      }
   }

   const handleFileChange = (e, target) => {
      if (e.target.files && e.target.files.length > 0) {
         const file = e.target.files[0]
         if (target === 'anteproyecto') {
            setFormData({ ...formData, documentoAnteproyecto: file })
         } else if (target === 'presentacion') {
            setFormData({ ...formData, presentacionAnteproyecto: file })
         }
      }
   }

   const getFileInfo = (file) => {
      return file ? `${file.name} (${(file.size / 1024).toFixed(2)} KB)` : null
   }

   const handleEliminarDocumento = async (docId) => {
      await deleteDocumentos(docId)
      await setDocumentosFase(currentProject.id)
   }

   // Identificar documentos por tag
   const anteproyectoDoc = listDocumentos?.find(doc => doc.tag === "DOCUMENTO_ANTEPROYECTO")
   const presentacionDoc = listDocumentos?.find(doc => doc.tag === "PRESENTACION_ANTEPROYECTO")

   const onSubmit = async (e) => {
      if (e) e.preventDefault()
      let documentosActualizados = false
      try {
         if (formData.documentoAnteproyecto) {
            await sendDocuments(currentProject.id, "ANTEPROYECTO", "DOCUMENTO_ANTEPROYECTO", formData.documentoAnteproyecto)
            documentosActualizados = true
         }
         if (formData.presentacionAnteproyecto) {
            await sendDocuments(currentProject.id, "ANTEPROYECTO", "PRESENTACION_ANTEPROYECTO", formData.presentacionAnteproyecto)
            documentosActualizados = true
         }
         if (documentosActualizados) {
            await setDocumentosFase(currentProject.id)
            setFormData({ ...formData, documentoAnteproyecto: null, presentacionAnteproyecto: null })
            if (anteproyectoInputRef.current) anteproyectoInputRef.current.value = ""
            if (presentacionInputRef.current) presentacionInputRef.current.value = ""
         }

         setShowSuccess({
            message: "Cambios guardados correctamente",
            state: true
         })

         setTimeout(() => setShowSuccess({ message: "", state: false }), 3000)
         return true
      } catch (error) {
         console.error("Error al guardar los cambios:", error)
         alert("Error al guardar los cambios. Por favor, inténtalo de nuevo más tarde.")
         return false
      }
   }

   const handleReview = async () => {
      const guardado = await onSubmit()
      if (!guardado) return

      const data = {
         estadoRevision: "EN_REVISION",
         comentarioRevision: ""
      }

      setReviewState(project?.id, data)
         .then(() => {
            setShowSuccess({
               message: "Proyecto enviado a revisión correctamente",
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

   const puedeEditar = ((project?.estadoActual === 3) && (project?.estadoRevision === null || project?.estadoRevision === "RECHAZADA" || project?.estadoRevision === "SIN_REVISAR"))

   const backendUrl = getBackendUrl()
   const api_plantillas = `${backendUrl}/plantillas`

   // documentos de actas
   const handleSubirCartaSolicitud = async (e) => {
      e.preventDefault()
      const file = e.target.actaArchivo.files[0]
      if (!file) return

      // Busca si ya existe una carta de solicitud
      const cartaAnterior = Array.isArray(listActas) ? listActas.find(acta => acta.tag === "SolicitudEvaluacion") : null

      // Si existe, elimínala antes de subir la nueva
      if (cartaAnterior) {
         await deleteDocumentos(cartaAnterior.id)
      }

      // Ahora sube la nueva carta
      await sendDocuments(
         currentProject.id,
         "ACTASOLICITUD",      // tipoDocumento
         "SolicitudEvaluacion",// tag
         file
      )
      await setDocumentosFase(currentProject.id)
      e.target.reset()
   }

   return (
      <>
         <section className="space-y-5">
            <div>
               <h4 className="font-bold text-2xl">Fase 3: Primera Entrega del Anteproyecto</h4>
               <p className="text-gris-institucional text-sm">
                  Suba el documento del anteproyecto y las diapositivas correspondientes.&nbsp
                  El director y codirector revisarán los documentos y proporcionarán retroalimentación
               </p>

               {project && <MensajeFase estadoRevision={project?.estadoActual > 3 ? "ACEPTADA" : project?.estadoRevision} mensaje={project?.comentarioRevision} />}
            </div>

            <Actividades taskList={actividades} />

            <form onSubmit={onSubmit} className="flex flex-col gap-5">
               {/* Input de Documento de Anteproyecto si no hay documento */}
               {!anteproyectoDoc && (
                  <div className="space-y-1">
                     <h6 className="font-bold select-none">Documento del Anteproyecto (PDF)</h6>
                     <label
                        ref={anteproyectoLabelRef}
                        htmlFor="documentoAnteproyecto"
                        className={`border-dashed rounded-md w-full p-4 border cursor-pointer flex flex-col items-center justify-center gap-2 py-8
                        ${dragTarget === 'anteproyecto' ? "bg-azul-claro border-azul text-azul" : "border-gris-institucional text-gris-institucional bg-gris-claro/25"}`}
                        onDragOver={(e) => handleDragOver(e, 'anteproyecto')}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, 'anteproyecto')}
                     >
                        <Upload />
                        <p className="text-sm">
                           {dragTarget !== 'anteproyecto'
                              ? "Haga click para cargar el archivo o arrastre el archivo aquí"
                              : "Suelte aquí el documento del anteproyecto"}
                        </p>
                        <div className="flex items-center gap-2">
                           <p className="text-xs">{getFileInfo(formData.documentoAnteproyecto) ?? "PDF (MAX: 100MB)"}</p>
                           {formData.documentoAnteproyecto && (
                              <button
                                 type="button"
                                 className="ml-2 text-red-500 hover:text-red-700 font-bold text-lg"
                                 onClick={e => {
                                    e.stopPropagation()
                                    setFormData({ ...formData, documentoAnteproyecto: null })
                                    if (anteproyectoInputRef.current) anteproyectoInputRef.current.value = ""
                                 }}
                                 aria-label="Eliminar archivo"
                              >
                                 ×
                              </button>
                           )}
                        </div>
                     </label>
                     <input
                        ref={anteproyectoInputRef}
                        className='hidden'
                        name="documentoAnteproyecto"
                        id="documentoAnteproyecto"
                        onChange={(e) => handleFileChange(e, 'anteproyecto')}
                        type='file'
                        accept=".pdf"
                     />
                  </div>
               )}

               {/* Input de Presentación si no hay documento */}
               {!presentacionDoc && (
                  <div className="space-y-1">
                     <h6 className="font-bold select-none">Presentación del Anteproyecto (PDF)</h6>
                     <label
                        ref={presentacionLabelRef}
                        htmlFor="presentacionAnteproyecto"
                        className={`border-dashed rounded-md w-full p-4 border cursor-pointer flex flex-col items-center justify-center gap-2 py-8
                        ${dragTarget === 'presentacion' ? "bg-azul-claro border-azul text-azul" : "border-gris-institucional text-gris-institucional bg-gris-claro/25"}`}
                        onDragOver={(e) => handleDragOver(e, 'presentacion')}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, 'presentacion')}
                     >
                        <Upload />
                        <p className="text-sm">
                           {dragTarget !== 'presentacion'
                              ? "Haga click para cargar el archivo o arrastre el archivo aquí"
                              : "Suelte aquí la presentación del anteproyecto"}
                        </p>
                        <div className="flex items-center gap-2">
                           <p className="text-xs">{getFileInfo(formData.presentacionAnteproyecto) ?? "PDF (MAX: 100MB)"}</p>
                           {formData.presentacionAnteproyecto && (
                              <button
                                 type="button"
                                 className="ml-2 text-red-500 hover:text-red-700 font-bold text-lg"
                                 onClick={e => {
                                    e.stopPropagation()
                                    setFormData({ ...formData, presentacionAnteproyecto: null })
                                    if (presentacionInputRef.current) presentacionInputRef.current.value = ""
                                 }}
                                 aria-label="Eliminar archivo"
                              >
                                 ×
                              </button>
                           )}
                        </div>
                     </label>
                     <input
                        ref={presentacionInputRef}
                        className='hidden'
                        name="presentacionAnteproyecto"
                        id="presentacionAnteproyecto"
                        onChange={(e) => handleFileChange(e, 'presentacion')}
                        type='file'
                        accept=".pdf"
                     />
                  </div>
               )}

               {/* Mostrar documento de Anteproyecto si existe */}
               {anteproyectoDoc && (
                  <EstadoEntrega
                     label={anteproyectoDoc.nombre}
                     entrega={{
                        ...anteproyectoDoc,
                        comentarios: anteproyectoDoc.retroalimentacion?.length > 0 ? anteproyectoDoc.retroalimentacion.join("\n") : undefined,
                        estado: anteproyectoDoc.retroalimentacion?.length > 0 ? "ajustes" : undefined,
                     }}
                     acciones={
                        <div className="flex gap-2 mt-2">
                           <a href={anteproyectoDoc.url} target="_blank" rel="noopener noreferrer">
                              <Boton type={"button"} variant={"whitered"} customClassName="w-fit">
                                 <Download size={18} />
                                 Descargar
                              </Boton>
                           </a>
                           {
                              puedeEditar && !adminView &&
                              <Boton
                                 type="button"
                                 variant="borderwhite"
                                 customClassName="w-fit"
                                 onClick={() => handleEliminarDocumento(anteproyectoDoc.id)}
                              >
                                 Eliminar
                              </Boton>
                           }
                        </div>
                     }
                  />
               )}

               {/* Mostrar presentación si existe */}
               {presentacionDoc && (
                  <EstadoEntrega
                     label={presentacionDoc.nombre}
                     entrega={{
                        ...presentacionDoc,
                        comentarios: presentacionDoc.retroalimentacion?.length > 0 ? presentacionDoc.retroalimentacion.join("\n") : undefined,
                        estado: presentacionDoc.retroalimentacion?.length > 0 ? "ajustes" : undefined,
                     }}
                     acciones={
                        <div className="flex gap-2 mt-2">
                           <a href={presentacionDoc.url} target="_blank" rel="noopener noreferrer">
                              <Boton type={"button"} variant={"whitered"} customClassName="w-fit">
                                 <Download size={18} />
                                 Descargar
                              </Boton>
                           </a>
                           {
                              puedeEditar && !adminView &&
                              <Boton
                                 type="button"
                                 variant="borderwhite"
                                 customClassName="w-fit"
                                 onClick={() => handleEliminarDocumento(presentacionDoc.id)}
                              >
                                 Eliminar
                              </Boton>
                           }
                        </div>
                     }
                  />
               )}

               {/* Mostrar documentos IMPORTADO */}
               {listDocumentos?.filter(doc => doc.tag === "IMPORTADO").map(doc => (
                  <EstadoEntrega
                     key={doc.id}
                     label={doc.nombre}
                     entrega={doc}
                     acciones={
                        <div className="flex gap-2 mt-2">
                           <a href={doc.url} target="_blank" rel="noopener noreferrer">
                              <Boton type={"button"} variant={"whitered"} customClassName="w-fit">
                                 <Download size={18} />
                                 Descargar
                              </Boton>
                           </a>
                           {
                              puedeEditar && !adminView &&
                              <Boton
                                 type="button"
                                 variant="borderwhite"
                                 customClassName="w-fit"
                                 onClick={() => handleEliminarDocumento(doc.id)}
                              >
                                 Eliminar
                              </Boton>
                           }
                        </div>
                     }
                  />
               ))}

               {showSuccess.state && (
                  <div className="bg-green-100 border-green-400 text-green-700 z-40 whitespace-nowrap w-fit
               border px-4 py-2 fixed bottom-10 right-10 rounded mb-2 text-sm font-semibold flex items-center gap-2">
                     <CheckCircle size={18} />
                     {showSuccess.message || "Cambios guardados correctamente"}
                  </div>
               )}

               {
                  puedeEditar && !adminView &&
                  <div className="self-end space-x-2">
                     <Boton
                        type="button"
                        variant="whitered"
                        customClassName="w-fit"
                        onClick={() => setShowConfirmModal(true)}
                        disabled={!anteproyectoDoc || !presentacionDoc || listActas.length === 0}
                     >
                        Enviar a Revisión
                        <Send size={16} />
                     </Boton>

                     <Boton type={"submit"} variant={"borderwhite"} customClassName="w-fit">
                        Guardar Cambios
                        <Save size={16} />
                     </Boton>
                  </div>
               }
            </form>
         </section>
         {

            <section className="py-14">
               <div className="flex justify-between items-center gap-2 mb-4">
                  <div className="flex flex-col">
                     <h5 className="font-bold text-lg">Carta: Solicitud de Evaluación del Anteproyecto</h5>
                     <p className="text-gris-institucional text-sm">
                        Cuando haya subido los documentos requeridos, descargue la carta borrador, diligénciela con la información solicitada y cárguelo en formato PDF.
                     </p>
                  </div>
                  <a
                     className="text-blue-500 hover:underline"
                     rel="noopener noreferrer"
                     href={`${api_plantillas}/SOLICITUD-EVALUACION-PROPUESTA.docx`}
                     target="_blank"
                     download
                  >
                     <Boton variant={"whitered"} customClassName="w-fit">
                        Descargar Borrador
                     </Boton>
                  </a>
               </div>
               <div className="flex flex-col gap-3">
                  {
                     Array.isArray(listActas) && listActas.length > 0 && (
                        <div
                           key={listActas[0].id}
                           className="border-gris-claro rounded-md border flex flex-col md:flex-row md:items-center justify-between gap-2 p-4"
                        >
                           <div className="flex items-center gap-2 flex-1 min-w-0">
                              <File size={22} className="text-blue-400 shrink-0" />
                              <div className="flex flex-col min-w-0">
                                 <span className="truncate font-semibold text-sm">{listActas[0].nombre}</span>
                                 <span className="text-xs text-gray-500">{listActas[0].peso}</span>
                              </div>
                           </div>
                           <div className="flex gap-2 flex-shrink-0">
                              <a
                                 href={listActas[0].url}
                                 target="_blank"
                                 rel="noopener noreferrer"
                              >
                                 <Boton type="button" variant="whitered" customClassName="w-fit">
                                    Vista previa
                                 </Boton>
                              </a>
                              <a
                                 href={listActas[0].url}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 download
                              >
                                 <Boton type="button" variant="borderwhite" customClassName="w-fit">
                                    Descargar
                                 </Boton>
                              </a>
                           </div>
                        </div>
                     )
                  }
               </div>
               {
                  puedeEditar && !adminView &&
                  <div className="mt-6 space-y-2">
                     <label className="font-bold select-none">Agregar Solicitud de Evaluación del Anteproyecto</label>
                     <form
                        onSubmit={handleSubirCartaSolicitud}
                        className="flex flex-col md:flex-row gap-2 items-center"
                     >
                        <input
                           type="file"
                           name="actaArchivo"
                           className="border rounded p-2 text-sm"
                           accept=".pdf"
                           onChange={(e) => {
                              const file = e.target.files[0]
                              if (file && file.type !== 'application/pdf') {
                                 alert('Por favor, suba un archivo PDF')
                                 e.target.value = ''
                              }
                           }}
                           required
                        />
                        <Boton type="submit" variant="borderwhite" customClassName="w-fit">
                           Subir Carta
                        </Boton>
                     </form>
                  </div>
               }
            </section>
         }
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