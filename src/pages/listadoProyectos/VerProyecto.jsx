import { useParams } from "react-router-dom"
import { Progress } from "@heroui/progress"
import { useState, useEffect, useRef } from "react"
import { User, Calendar, Clock, Users, BookHeart, CircleMinus, FileText, Download, Edit, Trash2, Save, X, CircleAlert, CheckCircle, Circle, XCircle, File, Upload, MessageCircle } from "lucide-react"
import useProject from "../../lib/hooks/useProject"
import { useAuth } from "../../lib/hooks/useAuth"
import { Progress as ProgressBar } from "@heroui/progress"
import Boton from "../../components/Boton"
import CoverSection from "../../components/proyectos/estado-proyecto/terminado/CoverSection"
import { Tab, Tabs } from "@heroui/tabs"
import DocumentoTab from "../../components/proyectos/estado-proyecto/terminado/DocumentoTab"
import ResumenTab from "../../components/proyectos/estado-proyecto/terminado/ResumenTab"
import ArticuloTab from "../../components/proyectos/estado-proyecto/terminado/ArticuloTab"
import DiapositivaTab from "../../components/proyectos/estado-proyecto/terminado/DiapositivaTab"

export default function VerProyecto() {
   const params = useParams()
   const [project, setProject] = useState(null)
   const [documentos, setDocumentos] = useState([])
   const [retroInputs, setRetroInputs] = useState({})
   const [sending, setSending] = useState(false)
   const [editRetroId, setEditRetroId] = useState(null)
   const [editRetroValue, setEditRetroValue] = useState("")
   const [listActas, setListActas] = useState([])
   const [showDeleteModal, setShowDeleteModal] = useState(false)
   const [actaToDelete, setActaToDelete] = useState(null)
   const [actaToResubir, setActaToResubir] = useState(null)
   const [resubirFile, setResubirFile] = useState(null)
   const resubirInputRef = useRef(null)

   const { getSpecificProject, getDocuments, sendRetroalimentacion, editRetroalimentacion, deleteRetroalimentacion, editProgress, sendDocuments, deleteDocumentos } = useProject()
   const { userLogged, userRole } = useAuth()

   useEffect(() => {
      const getProyectoEspecifico = async () => {
         const res = await getSpecificProject(params.projectId)
         if (res) setProject(res)
      }
      getProyectoEspecifico()
   }, [])

   useEffect(() => {
      const fetchDocs = async () => {
         if (project?.id) {
            const docs = await getDocuments(project.id, "")
            setDocumentos(docs)
            // Traer todas las actas (por tipoDocumento que empiece con ACTA)
            const actas = docs.filter(doc =>
               typeof doc.tipoDocumento === "string" &&
               doc.tipoDocumento.startsWith("ACTA")
            )
            setListActas(actas)
         }
      }
      fetchDocs()
   }, [project])

   // Agrupar documentos por tipoDocumento
   const docsPorTipo = documentos.reduce((acc, doc) => {
      if (!acc[doc.tipoDocumento]) acc[doc.tipoDocumento] = []
      acc[doc.tipoDocumento].push(doc)
      return acc
   }, {})

   // Manejar input de retroalimentación
   const handleRetroInput = (docId, value) => {
      setRetroInputs(prev => ({ ...prev, [docId]: value }))
   }

   // Enviar retroalimentación
   const handleSendRetro = async (docId) => {
      if (!retroInputs[docId] || !retroInputs[docId].trim()) return
      setSending(true)
      try {
         await sendRetroalimentacion({
            descripcion: retroInputs[docId],
            documentoId: docId
         })
         const docs = await getDocuments(project.id, "")
         setDocumentos(docs)
         setRetroInputs(prev => ({ ...prev, [docId]: "" }))
      } catch (e) {
         alert("Error al enviar retroalimentación")
      }
      setSending(false)
   }

   // Editar retroalimentación
   const handleEditRetro = (retro) => {
      setEditRetroId(retro.id)
      setEditRetroValue(retro.descripcion)
   }

   const handleSaveEditRetro = async (retro) => {
      if (!editRetroValue.trim()) return
      setSending(true)
      try {
         await editRetroalimentacion({
            id: retro.id,
            descripcion: editRetroValue
         })
         const docs = await getDocuments(project.id, "")
         setDocumentos(docs)
         setEditRetroId(null)
         setEditRetroValue("")
      } catch (e) {
         alert("Error al editar retroalimentación")
      }
      setSending(false)
   }

   // Eliminar retroalimentación
   const handleDeleteRetro = async (retro) => {
      if (!window.confirm("¿Seguro que deseas eliminar esta retroalimentación?")) return
      setSending(true)
      try {
         await deleteRetroalimentacion(retro.id)
         const docs = await getDocuments(project.id, "")
         setDocumentos(docs)
      } catch (e) {
         alert("Error al eliminar retroalimentación")
      }
      setSending(false)
   }

   // Validar objetivos
   const handleValidarObjetivo = async (objetivoId, esDirector, valor) => {
      const nuevosObjetivos = project.objetivosEspecificos.map(obj => {
         if (obj.id !== objetivoId) {
            return {
               id: obj.id,
               avanceReportado: obj.avanceReportado,
               avanceReal: obj.avanceReal,
               evaluacion: obj.evaluacion,
               fecha_inicio: obj.fecha_inicio,
               fecha_fin: obj.fecha_fin
            }
         } else {
            let nuevaEvaluacion = { ...obj.evaluacion }
            if (!nuevaEvaluacion) nuevaEvaluacion = {}
            if (esDirector) {
               nuevaEvaluacion.director = valor
            } else {
               nuevaEvaluacion.codirector = valor
            }
            return {
               id: obj.id,
               avanceReportado: obj.avanceReportado,
               avanceReal: obj.avanceReal,
               evaluacion: nuevaEvaluacion,
               fecha_inicio: obj.fecha_inicio,
               fecha_fin: obj.fecha_fin
            }
         }
      })

      await editProgress(
         { objetivosEspecificos: nuevosObjetivos },
         project.id
      )

      const res = await getSpecificProject(params.projectId)
      if (res) setProject(res)
   }

   function formatearFechaManual(fechaStr) {
      if (!fechaStr) return ""
      const meses = [
         "enero", "febrero", "marzo", "abril", "mayo", "junio",
         "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
      ]
      const dias = [
         "domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"
      ]
      const fecha = new Date(fechaStr)
      const diaSemana = dias[fecha.getDay()]
      const dia = String(fecha.getDate()).padStart(2, "0")
      const mes = meses[fecha.getMonth()]
      const anio = fecha.getFullYear()
      return `${diaSemana}, ${dia} de ${mes} del ${anio}`
   }

   // Obtener el id del usuario actual
   const usuarioId = userLogged?.id
   // Obtener el rol del usuario actual
   const usuarioRol = userLogged?.role

   const tiposDocenteEdita = ["ANTEPROYECTO", "REQUISITOS", "TESIS"]

   // --- ACTAS: Eliminar ---
   const handleDeleteActaClick = (acta) => {
      setActaToDelete(acta)
      setShowDeleteModal(true)
   }
   const handleConfirmDeleteActa = async () => {
      if (actaToDelete) {
         await deleteDocumentos(actaToDelete.id)
         // Refrescar lista de documentos y actas
         const docs = await getDocuments(project.id, "")
         setDocumentos(docs)
         setListActas(docs.filter(doc =>
            typeof doc.tipoDocumento === "string" &&
            doc.tipoDocumento.startsWith("ACTA")
         ))
         setShowDeleteModal(false)
         setActaToDelete(null)
      }
   }
   const handleCancelDeleteActa = () => {
      setShowDeleteModal(false)
      setActaToDelete(null)
   }

   // --- ACTAS: Resubir ---
   const handleResubirActaClick = (acta) => {
      setActaToResubir(acta)
      setResubirFile(null)
      if (resubirInputRef.current) resubirInputRef.current.value = ""
   }
   const handleResubirFileChange = (e) => {
      if (e.target.files && e.target.files.length > 0) {
         setResubirFile(e.target.files[0])
      }
   }
   const handleResubirActaSubmit = async (e) => {
      e.preventDefault()
      if (!actaToResubir || !resubirFile) return
      await sendDocuments(
         project.id,
         actaToResubir.tipoDocumento,
         actaToResubir.tag,
         resubirFile
      )
      // Refrescar lista de documentos y actas
      const docs = await getDocuments(project.id, "")
      setDocumentos(docs)
      setListActas(docs.filter(doc =>
         typeof doc.tipoDocumento === "string" &&
         doc.tipoDocumento.startsWith("ACTA")
      ))
      setActaToResubir(null)
      setResubirFile(null)
      if (resubirInputRef.current) resubirInputRef.current.value = ""
   }
   const handleCancelResubirActa = () => {
      setActaToResubir(null)
      setResubirFile(null)
      if (resubirInputRef.current) resubirInputRef.current.value = ""
   }
   if (project?.estadoActual === 0) {
      return (
         <main className="flex flex-col gap-4 h-full">
            <CoverSection currentProject={project} />
            <section className="p-6 mx-auto w-full max-w-5xl pb-40">
               <Tabs aria-label="Opciones" classNames={{ base: "w-full", tabList: "bg-gris-claro w-full rounded-md" }}>
                  <Tab key="resumen" title="Resumen">
                     <ResumenTab currentProject={project} />
                  </Tab>
                  <Tab key="documento" title="Documento de Tesis">
                     <DocumentoTab currentProject={project} listDocumentos={documentos.filter(doc => doc.tipoDocumento === "TESIS") || []} />
                  </Tab>
                  <Tab key="articulo" title="Artículo Científico">
                     <ArticuloTab currentProject={project} listDocumentos={documentos.filter(doc => doc.tipoDocumento === "TESIS") || []} />
                  </Tab>
                  <Tab key="diapositivas" title="Presentación">
                     <DiapositivaTab currentProject={project} listDocumentos={documentos.filter(doc => doc.tipoDocumento === "TESIS") || []} />
                  </Tab>
               </Tabs>
            </section>
         </main>
      )
   }

   return project && (
      <main className="flex flex-col gap-6 h-full">
         {/* Header Section - Compact */}
         <section className="bg-gradient-to-r from-azul-claro/20 to-rojo-claro/20 rounded-lg p-6 border">
            <div className="flex justify-between items-start gap-4 mb-4">
               <div className="flex-1">
                  <h1 className="font-black text-2xl text-gray-800 mb-2">{project.titulo}</h1>
                  <p className="text-gris-institucional text-sm">{project.objetivoGeneral}</p>
               </div>
               <div className="flex flex-col items-end gap-2">
                  <span className="bg-azul text-white rounded-full text-xs px-3 py-1 font-semibold">
                     Fase {project.estadoActual}
                  </span>
                  <span className="text-sm text-gris-institucional">
                     {(project.estadoActual / 10 * 100).toFixed(0)}% Completado
                  </span>
               </div>
            </div>

            {/* Quick Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
               <div className="flex items-center gap-2">
                  <User size={16} className="text-azul" />
                  <span>
                     <b>Estudiante:</b> {project.usuariosAsignados?.find(u => u.rol?.nombre?.toLowerCase() === "estudiante")?.nombreUsuario || "No asignado"}
                  </span>
               </div>
               <div className="flex items-center gap-2">
                  <Users size={16} className="text-azul" />
                  <span>
                     <b>Director:</b> {project.usuariosAsignados?.find(u => u.rol?.nombre?.toLowerCase() === "director")?.nombreUsuario || "No asignado"}
                  </span>
               </div>
               <div className="flex items-center gap-2">
                  <BookHeart size={16} className="text-azul" />
                  <span>
                     <b>Grupo:</b> {project.lineaInvestigacion?.grupoInvestigacion?.nombre || "No asignado"}
                  </span>
               </div>
            </div>
         </section>

         {/* Objectives Summary - Read Only */}
         <section className="bg-white rounded-lg border p-6">
            <h2 className="font-bold text-lg mb-4">Resumen de Objetivos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {project.objetivosEspecificos.slice(0, 4).map(obj => {
                  const avance = typeof obj.avanceReportado === "number" ? obj.avanceReportado : 0
                  const validadoDirector = obj.evaluacion?.director === true
                  const validadoCodirector = obj.evaluacion?.codirector === true

                  let statusColor = "bg-gray-200"
                  if (avance === 100 && validadoDirector && validadoCodirector) statusColor = "bg-green-200 text-green-800"
                  else if (avance > 0) statusColor = "bg-yellow-200 text-yellow-800"

                  return (
                     <div key={obj.id} className={`p-3 rounded-md border ${statusColor}`}>
                        <div className="font-medium text-sm mb-1">{obj.descripcion}</div>
                        <div className="flex justify-between items-center text-xs">
                           <span>Avance: {avance}%</span>
                           <div className="flex gap-1">
                              {validadoDirector && <CheckCircle size={14} className="text-green-600" />}
                              {validadoCodirector && <CheckCircle size={14} className="text-green-600" />}
                           </div>
                        </div>
                     </div>
                  )
               })}
            </div>
         </section>

         {/* MAIN FOCUS: Document Evaluation Section */}
         <section className="bg-white rounded-lg border p-6">
            <div className="flex justify-between items-center mb-6">
               <h2 className="font-bold text-xl text-gray-800">Evaluación de Documentos</h2>
               <span className="text-sm text-gris-institucional">
                  {Object.keys(docsPorTipo).filter(tipo => !tipo.startsWith("ACTA")).length} tipos de documentos
               </span>
            </div>

            {Object.keys(docsPorTipo).filter(tipo => !tipo.startsWith("ACTA")).length > 0 ? (
               <div className="space-y-6">
                  {Object.entries(docsPorTipo)
                     .filter(([tipo]) => !tipo.startsWith("ACTA"))
                     .map(([tipo, docs]) => (
                        <div key={tipo} className="border border-gray-200 rounded-lg overflow-hidden">
                           <div className="bg-gray-50 px-6 py-4 border-b">
                              <h3 className="font-bold text-lg text-gray-800">{tipo}</h3>
                              <p className="text-sm text-gris-institucional">{docs.length} documento(s)</p>
                           </div>

                           <div className="divide-y divide-gray-100">
                              {docs.map(doc => {
                                 const misRetros = doc.retroalimentacion?.filter(r => r.email === usuarioId) || []
                                 const yaRetro = misRetros.length > 0
                                 const puedeEditarRetro = (usuarioRol !== "Docente" || (usuarioRol === "Docente" && tiposDocenteEdita.includes(doc.tipoDocumento)))

                                 return puedeEditarRetro && (
                                    <div key={doc.id} className="p-6">
                                       {/* Document Header */}
                                       <div className="flex items-center justify-between mb-4">
                                          <div className="flex items-center gap-3">
                                             <div className="p-2 bg-blue-100 rounded-lg">
                                                <FileText className="text-blue-600" size={24} />
                                             </div>
                                             <div>
                                                <h4 className="font-semibold text-gray-800">{doc.nombre}</h4>
                                                <p className="text-sm text-gris-institucional">{doc.peso}</p>
                                             </div>
                                          </div>
                                          <Boton
                                             variant="borderwhite"
                                             customClassName="w-fit"
                                             onClick={() => window.open(doc.url, '_blank')}
                                          >
                                             <Download size={16} />
                                             Descargar
                                          </Boton>
                                       </div>

                                       {/* Existing Feedback */}
                                       {doc.retroalimentacion && doc.retroalimentacion.length > 0 && (
                                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                             <h5 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                                                <MessageCircle size={16} />
                                                Retroalimentaciones Existentes
                                             </h5>
                                             <div className="space-y-3">
                                                {doc.retroalimentacion.map(retro => (
                                                   <div key={retro.id} className="bg-white border rounded-lg p-3">
                                                      {editRetroId === retro.id ? (
                                                         <div className="space-y-2">
                                                            <textarea
                                                               className="w-full border rounded-md p-3 text-sm resize-none"
                                                               value={editRetroValue}
                                                               onChange={e => setEditRetroValue(e.target.value)}
                                                               rows={3}
                                                               disabled={sending}
                                                               placeholder="Edita tu retroalimentación..."
                                                            />
                                                            <div className="flex gap-2 justify-end">
                                                               <Boton
                                                                  variant="borderwhite"
                                                                  customClassName="w-fit"
                                                                  onClick={() => { setEditRetroId(null); setEditRetroValue(""); }}
                                                                  disabled={sending}
                                                               >
                                                                  <X size={16} />
                                                                  Cancelar
                                                               </Boton>
                                                               <Boton
                                                                  variant="borderwhite"
                                                                  customClassName="w-fit"
                                                                  onClick={() => handleSaveEditRetro(retro)}
                                                                  disabled={sending || !editRetroValue.trim()}
                                                               >
                                                                  <Save size={16} />
                                                                  Guardar
                                                               </Boton>
                                                            </div>
                                                         </div>
                                                      ) : (
                                                         <div>
                                                            <div className="flex justify-between items-start mb-2">
                                                               <span className="font-semibold text-sm text-blue-700">{retro.nombreUsuario}</span>
                                                               {retro.emailUsuario === usuarioId && puedeEditarRetro && (
                                                                  <div className="flex gap-1">
                                                                     <button
                                                                        className="text-blue-600 hover:text-blue-800 p-1"
                                                                        onClick={() => handleEditRetro(retro)}
                                                                        disabled={sending}
                                                                        title="Editar"
                                                                     >
                                                                        <Edit size={14} />
                                                                     </button>
                                                                     <button
                                                                        className="text-red-600 hover:text-red-800 p-1"
                                                                        onClick={() => handleDeleteRetro(retro)}
                                                                        disabled={sending}
                                                                        title="Eliminar"
                                                                     >
                                                                        <Trash2 size={14} />
                                                                     </button>
                                                                  </div>
                                                               )}
                                                            </div>
                                                            <p className="text-sm text-gray-700">{retro.descripcion}</p>
                                                         </div>
                                                      )}
                                                   </div>
                                                ))}
                                             </div>
                                          </div>
                                       )}

                                       {/* New Feedback Form */}
                                       {!yaRetro && puedeEditarRetro && (
                                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                             <h5 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                                                <Edit size={16} />
                                                Agregar Retroalimentación
                                             </h5>
                                             <form
                                                onSubmit={e => {
                                                   e.preventDefault()
                                                   handleSendRetro(doc.id)
                                                }}
                                                className="space-y-3"
                                             >
                                                <textarea
                                                   className="w-full border rounded-md p-3 text-sm resize-none"
                                                   rows={4}
                                                   placeholder="Escribe tu retroalimentación detallada aquí..."
                                                   value={retroInputs[doc.id] || ""}
                                                   onChange={e => handleRetroInput(doc.id, e.target.value)}
                                                   disabled={sending}
                                                />
                                                <div className="flex justify-end">
                                                   <Boton
                                                      type="submit"
                                                      variant="borderwhite"
                                                      customClassName="w-fit"
                                                      disabled={sending || !retroInputs[doc.id] || !retroInputs[doc.id].trim()}
                                                   >
                                                      {sending ? "Enviando..." : "Enviar Retroalimentación"}
                                                   </Boton>
                                                </div>
                                             </form>
                                          </div>
                                       )}
                                    </div>
                                 )
                              })}
                           </div>
                        </div>
                     ))
                  }
               </div>
            ) : (
               <div className="text-center py-12 text-gris-institucional">
                  <FileText size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No hay documentos para evaluar</p>
                  <p className="text-sm">Los documentos aparecerán aquí cuando el estudiante los suba</p>
               </div>
            )}
         </section>

         {/* ACTAS Section */}
         <section className="bg-white rounded-lg border p-6">
            <div className="flex justify-between items-center mb-6">
               <div>
                  <h2 className="font-bold text-xl text-gray-800">Gestión de Actas</h2>
                  <p className="text-sm text-gris-institucional">Descargar, resubir o eliminar actas del proyecto</p>
               </div>
               <span className="text-sm text-gris-institucional">
                  {listActas.length} acta(s)
               </span>
            </div>

            {listActas.length === 0 ? (
               <div className="text-center py-12 text-gris-institucional">
                  <File size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No hay actas disponibles</p>
                  <p className="text-sm">Las actas se generarán automáticamente durante el proceso</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 gap-4">
                  {listActas.map(acta => (
                     <div key={acta.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                 <File size={20} className="text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                 <h4 className="font-semibold text-gray-800 truncate">{acta.nombre}</h4>
                                 <p className="text-sm text-gris-institucional">{acta.peso}</p>
                                 <p className="text-xs text-gris-institucional">
                                    {acta.tipoDocumento} {acta.tag && `• ${acta.tag}`}
                                 </p>
                              </div>
                           </div>

                           <div className="flex gap-2 flex-shrink-0">
                              <Boton
                                 variant="borderwhite"
                                 customClassName="w-fit"
                                 onClick={() => window.open(acta.url, '_blank')}
                              >
                                 <Download size={16} />
                                 Descargar
                              </Boton>
                              <Boton
                                 variant="borderwhite"
                                 customClassName="w-fit"
                                 onClick={() => handleResubirActaClick(acta)}
                              >
                                 <Upload size={16} />
                                 Resubir
                              </Boton>
                              <Boton
                                 variant="whitered"
                                 customClassName="w-fit"
                                 onClick={() => handleDeleteActaClick(acta)}
                              >
                                 <Trash2 size={16} />
                                 Eliminar
                              </Boton>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            )}
         </section>

         {/* MODAL DE RESUBIR ACTA */}
         {actaToResubir && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
               <div className="bg-white rounded-lg p-6 max-w-md w-full">
                  <h3 className="font-bold text-lg mb-4">Resubir Acta</h3>
                  <p className="text-sm text-gris-institucional mb-4">
                     Selecciona el archivo PDF para reemplazar <b>{actaToResubir?.nombre}</b>
                  </p>
                  <form onSubmit={handleResubirActaSubmit} className="space-y-4">
                     <input
                        ref={resubirInputRef}
                        type="file"
                        accept=".pdf"
                        required
                        onChange={handleResubirFileChange}
                        className="w-full border rounded-md p-3 text-sm"
                     />
                     <div className="flex gap-3 justify-end">
                        <Boton
                           variant="borderwhite"
                           onClick={handleCancelResubirActa}
                           customClassName="w-fit"
                        >
                           Cancelar
                        </Boton>
                        <Boton
                           variant="borderwhite"
                           disabled={!resubirFile}
                           customClassName="w-fit"
                        >
                           Subir Nueva Versión
                        </Boton>
                     </div>
                  </form>
               </div>
            </div>
         )}

         {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
         {showDeleteModal && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
               <div className="bg-white rounded-lg p-6 max-w-md w-full">
                  <h3 className="font-bold text-lg mb-4">¿Eliminar Acta?</h3>
                  <p className="text-sm text-gris-institucional mb-6">
                     ¿Estás seguro de que deseas eliminar <b>{actaToDelete?.nombre}</b>? Esta acción no se puede deshacer.
                  </p>
                  <div className="flex gap-3 justify-end">
                     <Boton
                        variant="borderwhite"
                        onClick={handleCancelDeleteActa}
                        customClassName="w-fit"
                     >
                        Cancelar
                     </Boton>
                     <Boton
                        variant="whitered"
                        onClick={handleConfirmDeleteActa}
                        customClassName="w-fit"
                     >
                        Eliminar
                     </Boton>
                  </div>
               </div>
            </div>
         )}
      </main>
   )
}