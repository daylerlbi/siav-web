import { useRef, useState, useEffect } from "react"
import useProject from "../../../../lib/hooks/useProject"
import Actividades from "../componentes/Actividades"
import { Alert } from "@heroui/alert"
import { FileBox, Upload, Download, File, Send, MessageCircle, ChevronDown, ChevronUp, User } from "lucide-react"
import Boton from "../../../Boton"
import MensajeFase from "../componentes/MensajeFase"
import { Save } from "lucide-react"
import ConfirmarRevisionModal from "../componentes/ConfirmarRevisionModal"
import { CheckCircle } from "lucide-react"
import { Delete } from "lucide-react"
import { Trash } from "lucide-react"
import { Trash2 } from "lucide-react"

const actividades = [
   {
      title: "Entrega de Documentos Finales",
      tasks: [
         { desc: "Suba el documento final de su proyecto" },
         { desc: "Suba el artículo de su proyecto" },
         { desc: "Suba la presentación de su proyecto" },
      ],
   }
]

export default function Fase_7({ project, adminView = false }) {
   const [showSuccess, setShowSuccess] = useState({ message: "", state: false })
   const { getDocuments, sendDocuments, deleteDocumentos, setReviewState } = useProject()
   const [showConfirmModal, setShowConfirmModal] = useState(false)
   const [currentProject, setCurrentProject] = useState(null)
   const [listDocumentos, setListDocumentos] = useState([])
   const [formData, setFormData] = useState({
      documentoTesis: null,
      articuloTesis: null,
      presentacionTesis: null,
   })
   const [dragTarget, setDragTarget] = useState(null)
   const [expandedFeedback, setExpandedFeedback] = useState({})

   const documentoInputRef = useRef(null)
   const articuloInputRef = useRef(null)
   const presentacionInputRef = useRef(null)

   useEffect(() => { setCurrentProject(project) }, [project])
   useEffect(() => { if (currentProject) setDocumentosFase(currentProject.id) }, [currentProject])

   const setDocumentosFase = async (projectId) => {
      const docs = await getDocuments(projectId, "TESIS")
      setListDocumentos(docs || [])
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
            if (target === 'documento') {
               setFormData({ ...formData, documentoTesis: file })
            } else if (target === 'articulo') {
               setFormData({ ...formData, articuloTesis: file })
            } else if (target === 'presentacion') {
               setFormData({ ...formData, presentacionTesis: file })
            }
         } else {
            alert('Por favor, suba únicamente archivos PDF')
         }
      }
   }

   const handleFileChange = (e, target) => {
      if (e.target.files && e.target.files.length > 0) {
         const file = e.target.files[0]
         if (target === 'documento') {
            setFormData({ ...formData, documentoTesis: file })
         } else if (target === 'articulo') {
            setFormData({ ...formData, articuloTesis: file })
         } else if (target === 'presentacion') {
            setFormData({ ...formData, presentacionTesis: file })
         }
      }
   }

   const getFileInfo = (file) => {
      return file ? `${file.name} (${(file.size / 1024).toFixed(2)} KB)` : null
   }

   // Buscar documentos por tag
   const documentoTesisDoc = listDocumentos?.find(doc => doc.tag === "DOCUMENTO_TESIS")
   const articuloTesisDoc = listDocumentos?.find(doc => doc.tag === "ARTICULO_TESIS")
   const presentacionTesisDoc = listDocumentos?.find(doc => doc.tag === "PRESENTACION_TESIS")
   const actaVB = listDocumentos?.find(doc => doc.tag === "ACTA_VB")

   // Validación para edición (igual que en fases anteriores)
   const puedeEditar = (
      project?.estadoActual === 7 &&
      (project?.estadoRevision === null ||
         project?.estadoRevision === "RECHAZADA" ||
         project?.estadoRevision === "SIN_REVISAR") &&
      !adminView
   )

   const documentosCompletos = !!(documentoTesisDoc && articuloTesisDoc && presentacionTesisDoc)

   const onSubmit = async (e) => {
      if (e) e.preventDefault()
      try {
         let documentosActualizados = false

         if (formData.documentoTesis) {
            await sendDocuments(currentProject.id, "TESIS", "DOCUMENTO_TESIS", formData.documentoTesis)
            documentosActualizados = true
         }
         if (formData.articuloTesis) {
            await sendDocuments(currentProject.id, "TESIS", "ARTICULO_TESIS", formData.articuloTesis)
            documentosActualizados = true
         }
         if (formData.presentacionTesis) {
            await sendDocuments(currentProject.id, "TESIS", "PRESENTACION_TESIS", formData.presentacionTesis)
            documentosActualizados = true
         }
         if (documentosActualizados) {
            await setDocumentosFase(currentProject.id)
            setFormData({ ...formData, documentoTesis: null, articuloTesis: null, presentacionTesis: null })
            if (documentoInputRef.current) documentoInputRef.current.value = ""
            if (articuloInputRef.current) articuloInputRef.current.value = ""
            if (presentacionInputRef.current) presentacionInputRef.current.value = ""
         }
         setShowSuccess({
            message: "Documentos enviados correctamente",
            state: true
         })
         setTimeout(() => setShowSuccess({ message: "", state: false }), 3000)
         return true
      } catch (error) {
         console.error("Error al enviar los documentos:", error)
         alert("Error al enviar los documentos. Por favor, inténtelo de nuevo más tarde.")
         return false
      }
   }

   const handleReview = async () => {
      const guardado = await onSubmit()
      if (!guardado) return

      if (!documentosCompletos) {
         alert("Por favor, asegúrese de haber subido todos los documentos requeridos antes de enviar a revisión.")
         return
      }

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
            setShowSuccess({ message: "Error al enviar el proyecto a revisión.", state: true })
            setTimeout(() => setShowSuccess({ message: "", state: false }), 3000)
         })
   }

   // Componente para mostrar documento subido
   const DocumentoSubido = ({ doc }) => {
      const tieneRetroalimentacion = doc.retroalimentacion && doc.retroalimentacion.length > 0
      const isExpanded = expandedFeedback[doc.id]

      return (
         <div className="border-gris-claro rounded-md border flex flex-col gap-2 p-4">
            <div className="flex justify-between items-center gap-2">
               <div className="flex items-center gap-2">
                  <File size={24} className="text-green-400" />
                  <div className="flex flex-col">
                     <p className="text-negro-institucional font-bold text-sm">{doc.nombre}</p>
                     <p className="text-gris-intermedio text-xs font-thin">{doc.peso}</p>
                  </div>
               </div>
               <div className="flex gap-2">
                  <a href={doc.url} target="_blank" rel="noopener noreferrer">
                     <Boton type={"button"} variant={"whitered"} customClassName="w-fit">
                        <Download size={18} />
                        Descargar
                     </Boton>
                  </a>
                  {
                     puedeEditar &&
                     <Boton
                        type="button"
                        variant="borderwhite"
                        customClassName="w-fit"
                        onClick={() => handleEliminarDocumento(doc.id)}
                     >
                        <Trash2 size={18} />
                        Eliminar
                     </Boton>
                  }
               </div>
            </div>

            {/* Sección de retroalimentación */}
            {tieneRetroalimentacion && (
               <div className="mt-3 border-t pt-3">
                  <button
                     type="button"
                     onClick={() => toggleFeedback(doc.id)}
                     className="flex items-center gap-2 text-azul hover:text-azul-oscuro transition-colors font-medium text-sm w-full justify-between"
                  >
                     <div className="flex items-center gap-2">
                        <MessageCircle size={16} />
                        <span>Retroalimentación de directores ({doc.retroalimentacion.length})</span>
                     </div>
                     {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {isExpanded && (
                     <div className="mt-3 space-y-3">
                        {doc.retroalimentacion.map((feedback, index) => (
                           <div key={feedback.id} className="bg-gray-50 rounded-lg p-3 border-l-4 border-azul">
                              <div className="flex items-start gap-3">
                                 <div className="flex-shrink-0">
                                    {feedback.fotoUsuario ? (
                                       <img
                                          src={feedback.fotoUsuario}
                                          alt={feedback.nombreUsuario}
                                          className="w-8 h-8 rounded-full"
                                       />
                                    ) : (
                                       <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                                          <User size={16} className="text-gray-600" />
                                       </div>
                                    )}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                       <p className="font-semibold text-sm text-gray-900">
                                          {feedback.nombreUsuario}
                                       </p>
                                       <p className="text-xs text-gray-500">
                                          {feedback.emailUsuario}
                                       </p>
                                    </div>
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                       {feedback.descripcion}
                                    </p>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            )}
         </div>
      )
   }

   const handleEliminarDocumento = async (docId) => {
      await deleteDocumentos(docId)
      await setDocumentosFase(currentProject.id)
   }

   const toggleFeedback = (docId) => {
      setExpandedFeedback(prev => ({
         ...prev,
         [docId]: !prev[docId]
      }))
   }

   return (
      <>
         <section className="space-y-5">
            <div>
               <h4 className="font-bold text-2xl">Fase 7: Entrega de Documentos Finales</h4>
               <p className="text-gris-institucional text-sm">
                  Cargue el documento final, el artículo y la presentación para su validación y revisión.
               </p>
               {project && <MensajeFase estadoRevision={project?.estadoActual > 7 ? "ACEPTADA" : project?.estadoRevision} mensaje={project?.comentarioRevision} />}
            </div>

            <Actividades taskList={actividades} />

            <Alert
               title={"Entrega de Documentos Finales"}
               classNames={{
                  title: "font-bold text-base",
                  base: "border-azul bg-azul-claro text-azul border py-5",
                  iconWrapper: "bg-transparent border-0 shadow-none",
                  description: "text-azul"
               }}
               description={"Asegúrese de adjuntar los archivos requeridos en formato PDF. Una vez cargados, serán evaluados por el comité para su aprobación."}
               icon={<><FileBox size={24} /></>}
            />

            <form onSubmit={onSubmit} className="border-gris-claro border p-4 rounded-md space-y-8">
               {/* Documento Final */}
               {!documentoTesisDoc && puedeEditar && (
                  <div className="space-y-1">
                     <h6 className="font-bold select-none">Documento Final (PDF)</h6>
                     <label
                        htmlFor="documentoTesis"
                        className={`border-dashed rounded-md w-full p-4 border cursor-pointer flex flex-col items-center justify-center gap-2 py-8
                        ${dragTarget === 'documento' ? "bg-azul-claro border-azul text-azul" : "border-gris-institucional text-gris-institucional bg-gris-claro/25"}`}
                        onDragOver={e => handleDragOver(e, 'documento')}
                        onDragLeave={handleDragLeave}
                        onDrop={e => handleDrop(e, 'documento')}
                     >
                        <Upload />
                        <p className="text-sm">
                           {dragTarget !== 'documento'
                              ? "Haga click para cargar el archivo o arrastre el archivo aquí"
                              : "Suelte aquí el documento final"}
                        </p>
                        <div className="flex items-center gap-2 flex-row-reverse">
                           <p className="text-xs">{getFileInfo(formData.documentoTesis) ?? "PDF (MAX: 100MB)"}</p>
                           {formData.documentoTesis && (
                              <button
                                 type="button"
                                 className="text-red-500 hover:text-red-700 font-bold text-lg"
                                 onClick={e => {
                                    e.stopPropagation()
                                    setFormData({ ...formData, documentoTesis: null })
                                    if (documentoInputRef.current) documentoInputRef.current.value = ""
                                 }}
                                 aria-label="Eliminar archivo"
                              >
                                 ×
                              </button>
                           )}
                        </div>
                     </label>
                     <input
                        ref={documentoInputRef}
                        className='hidden'
                        name="documentoTesis"
                        id="documentoTesis"
                        onChange={e => handleFileChange(e, 'documento')}
                        type='file'
                        accept=".pdf"
                     />
                  </div>
               )}

               {/* Artículo */}
               {!articuloTesisDoc && puedeEditar && (
                  <div className="space-y-1">
                     <h6 className="font-bold select-none">Artículo (PDF)</h6>
                     <label
                        htmlFor="articuloTesis"
                        className={`border-dashed rounded-md w-full p-4 border cursor-pointer flex flex-col items-center justify-center gap-2 py-8
                        ${dragTarget === 'articulo' ? "bg-azul-claro border-azul text-azul" : "border-gris-institucional text-gris-institucional bg-gris-claro/25"}`}
                        onDragOver={e => handleDragOver(e, 'articulo')}
                        onDragLeave={handleDragLeave}
                        onDrop={e => handleDrop(e, 'articulo')}
                     >
                        <Upload />
                        <p className="text-sm">
                           {dragTarget !== 'articulo'
                              ? "Haga click para cargar el archivo o arrastre el archivo aquí"
                              : "Suelte aquí el artículo"}
                        </p>
                        <div className="flex items-center gap-2 flex-row-reverse">
                           <p className="text-xs">{getFileInfo(formData.articuloTesis) ?? "PDF (MAX: 100MB)"}</p>
                           {formData.articuloTesis && (
                              <button
                                 type="button"
                                 className="text-red-500 hover:text-red-700 font-bold text-lg"
                                 onClick={e => {
                                    e.stopPropagation()
                                    setFormData({ ...formData, articuloTesis: null })
                                    if (articuloInputRef.current) articuloInputRef.current.value = ""
                                 }}
                                 aria-label="Eliminar archivo"
                              >
                                 ×
                              </button>
                           )}
                        </div>
                     </label>
                     <input
                        ref={articuloInputRef}
                        className='hidden'
                        name="articuloTesis"
                        id="articuloTesis"
                        onChange={e => handleFileChange(e, 'articulo')}
                        type='file'
                        accept=".pdf"
                     />
                  </div>
               )}

               {/* Presentación */}
               {!presentacionTesisDoc && puedeEditar && (
                  <div className="space-y-1">
                     <h6 className="font-bold select-none">Presentación (PDF)</h6>
                     <label
                        htmlFor="presentacionTesis"
                        className={`border-dashed rounded-md w-full p-4 border cursor-pointer flex flex-col items-center justify-center gap-2 py-8
                        ${dragTarget === 'presentacion' ? "bg-azul-claro border-azul text-azul" : "border-gris-institucional text-gris-institucional bg-gris-claro/25"}`}
                        onDragOver={e => handleDragOver(e, 'presentacion')}
                        onDragLeave={handleDragLeave}
                        onDrop={e => handleDrop(e, 'presentacion')}
                     >
                        <Upload />
                        <p className="text-sm">
                           {dragTarget !== 'presentacion'
                              ? "Haga click para cargar el archivo o arrastre el archivo aquí"
                              : "Suelte aquí la presentación"}
                        </p>
                        <div className="flex items-center gap-2 flex-row-reverse">
                           <p className="text-xs">{getFileInfo(formData.presentacionTesis) ?? "PDF (MAX: 100MB)"}</p>
                           {formData.presentacionTesis && (
                              <button
                                 type="button"
                                 className="text-red-500 hover:text-red-700 font-bold text-lg"
                                 onClick={e => {
                                    e.stopPropagation()
                                    setFormData({ ...formData, presentacionTesis: null })
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
                        name="presentacionTesis"
                        id="presentacionTesis"
                        onChange={e => handleFileChange(e, 'presentacion')}
                        type='file'
                        accept=".pdf"
                     />
                  </div>
               )}

               {/* Mostrar documento final si existe */}
               {documentoTesisDoc && (
                  <DocumentoSubido doc={documentoTesisDoc} />
               )}

               {/* Mostrar artículo si existe */}
               {articuloTesisDoc && (
                  <DocumentoSubido doc={articuloTesisDoc} />
               )}

               {/* Mostrar presentación si existe */}
               {presentacionTesisDoc && (
                  <DocumentoSubido doc={presentacionTesisDoc} />
               )}

               {showSuccess.state && (
                  <div className="bg-green-100 border-green-400 text-green-700 z-40 whitespace-nowrap w-fit
            border px-4 py-2 fixed bottom-10 right-10 rounded mb-2 text-sm font-semibold flex items-center gap-2">
                     <CheckCircle size={18} />
                     {showSuccess.message}
                  </div>
               )}

               <div className="flex justify-end items-center gap-2">
                  {puedeEditar && (
                     <>
                        <Boton
                           type="button"
                           variant="whitered"
                           customClassName="w-fit"
                           onClick={() => setShowConfirmModal(true)}
                           disabled={!documentosCompletos}
                        >
                           Enviar a Revisión
                           <Send size={16} />
                        </Boton>
                        <Boton type={"submit"} variant={"borderwhite"} customClassName="w-fit">
                           <Save size={16} />
                           Guardar Documentos
                        </Boton>
                     </>
                  )}
               </div>
            </form>

            {/* Acta de visto bueno (solo descarga, subida por admin) */}
            {actaVB && (
               <section className="my-10">
                  <div className="mb-4">
                     <h5 className="font-bold text-lg">Acta de Visto Bueno</h5>
                     <p className="text-gris-institucional text-sm">Descargue el acta de visto bueno cargada por el administrador.</p>
                  </div>
                  <div className="flex flex-col gap-3">
                     <div
                        className="border-gris-claro rounded-md border flex flex-col md:flex-row md:items-center justify-between gap-2 p-4"
                     >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                           <File size={22} className="text-blue-400 shrink-0" />
                           <div className="flex flex-col min-w-0">
                              <span className="truncate font-semibold text-sm">{actaVB.nombre}</span>
                              <span className="text-xs text-gray-500">{actaVB.peso}</span>
                           </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                           <a
                              href={actaVB.url}
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
                  </div>
               </section>
            )}
         </section>

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