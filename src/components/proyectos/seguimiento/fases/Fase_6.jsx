import { useState, useEffect, useRef } from "react"
import Actividades from "../componentes/Actividades"
import { FileCode, Save, CheckCircle, CircleAlert, Circle, Send, Upload, File, Download } from "lucide-react"
import { Alert } from "@heroui/alert"
import Boton from "../../../Boton"
import { Progress } from "@heroui/progress"
import useProject from "../../../../lib/hooks/useProject"
import ConfirmarRevisionModal from "../componentes/ConfirmarRevisionModal"
import MensajeFase from "../componentes/MensajeFase"
import { useAuth } from "../../../../lib/hooks/useAuth"
import { getBackendUrl } from "../../../../lib/controllers/endpoints"

const actividades = [
   {
      title: "Seguimiento de Hitos",
      tasks: [
         { desc: "Subir documentos evidenciando los avances de cada hito" },
         { desc: "Actualizar porcentaje de avance de cada hito" },
         { desc: "Complete todos los hitos al 100%" },
      ],
   }
]

export default function Fase_6({ project, adminView = false }) {
   const [showSuccess, setShowSuccess] = useState({ message: "", state: false })
   const { editProgress, setReviewState, sendDocuments, getDocuments, deleteDocumentos } = useProject()
   const [showConfirmModal, setShowConfirmModal] = useState(false)
   const [currentProject, setCurrentProject] = useState(null)
   const { userRole, userLogged } = useAuth()

   const [dragTarget, setDragTarget] = useState(false)
   const fileInputRef = useRef(null)

   const [avanceError, setAvanceError] = useState("")
   const [listAvances, setListAvances] = useState([])
   const [acta, setActa] = useState(null)
   const [avanceFile, setAvanceFile] = useState(null)
   const [avanceTag, setAvanceTag] = useState("")

   useEffect(() => { setCurrentProject(project) }, [project])

   // Obtener documentos de avance al cargar el proyecto
   useEffect(() => {
      const fetchDocs = async () => {
         if (currentProject?.id) {
            const docs = await getDocuments(currentProject.id, "REQUISITOS")
            setListAvances(docs || [])
            const acta = await getDocuments(currentProject.id, "ACTAVB")
            setActa(acta[0] || null)
         }
      }
      fetchDocs()
   }, [currentProject])

   const puedeEditar = (project?.estadoActual === 6 && (project?.estadoRevision === null || project?.estadoRevision === "RECHAZADA" || project?.estadoRevision === "SIN_REVISAR"))
   const allFieldsFilled = currentProject?.objetivosEspecificos?.every(obj => typeof obj.avanceReportado === "number")

   const handleAvanceChange = async () => {
      await editProgress(currentProject, currentProject.id)
      setShowSuccess({ message: "Cambios guardados correctamente", state: true })
      setTimeout(() => setShowSuccess({ message: "", state: false }), 3000)
      setTimeout(() => window.location.reload(), 3000)
   }

   const handleReview = async () => {
      await handleAvanceChange()
      // Validación: todos los hitos al 100 % y validados por director y codirector
      const validos = currentProject.objetivosEspecificos.every(
         obj =>
            obj.avanceReportado === 100 &&
            obj.evaluacion?.director === true &&
            obj.evaluacion?.codirector === true
      )
      if (!validos) {
         setShowSuccess({ message: "Todos los hitos deben estar al 100% y validados.", state: true })
         setTimeout(() => setShowSuccess({ message: "", state: false }), 3000)
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

   const handleValidarObjetivo = async (objetivoId, esDirector, valor) => {
      const nuevosObjetivos = currentProject.objetivosEspecificos.map(obj => {
         if (obj.id !== objetivoId) return obj
         let nuevaEvaluacion = { ...obj.evaluacion }
         if (!nuevaEvaluacion) nuevaEvaluacion = {}
         if (esDirector) {
            nuevaEvaluacion.director = valor
         } else {
            nuevaEvaluacion.codirector = valor
         }
         return { ...obj, evaluacion: nuevaEvaluacion }
      })
      await editProgress(
         { ...currentProject, objetivosEspecificos: nuevosObjetivos },
         currentProject.id
      )
      setCurrentProject(prev => ({
         ...prev,
         objetivosEspecificos: nuevosObjetivos
      }))
   }

   const handleSubirAvance = async (e) => {
      e.preventDefault()
      setAvanceError("")
      if (!avanceFile || !avanceTag) {
         setAvanceError("Debes seleccionar un archivo y un tag.")
         return
      }
      // Validar que el tag no esté repetido
      if (listAvances.some(doc => doc.tag === avanceTag)) {
         setAvanceError("Ya existe un documento con ese tag.")
         return
      }
      await sendDocuments(
         currentProject.id,
         "REQUISITOS",
         avanceTag,
         avanceFile
      )
      setAvanceFile(null)
      setAvanceTag("")
      // Actualiza la lista de documentos
      const docs = await getDocuments(currentProject.id, "REQUISITOS")
      setListAvances(docs || [])
   }

   const usuarioId = userLogged?.id

   const esDirector = project.usuariosAsignados?.some(u => u.rol?.nombre?.toLowerCase() === "director" && u.email === usuarioId)
   const esCodirector = project.usuariosAsignados?.some(u => u.rol?.nombre?.toLowerCase() === "codirector" && u.email === usuarioId)
   const esAdmin = (userRole === "ROLE_ADMIN" || userRole === "ROLE_SUPERADMIN")

   const handleDragOver = (event) => {
      event.preventDefault()
      event.stopPropagation()
      setDragTarget(true)
   }
   const handleDragLeave = (event) => {
      event.preventDefault()
      event.stopPropagation()
      setDragTarget(false)
   }
   const handleDrop = (event) => {
      event.preventDefault()
      event.stopPropagation()
      setDragTarget(false)
      if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
         const file = event.dataTransfer.files[0]
         if (file.type === 'application/pdf') {
            setAvanceFile(file)
         } else {
            setAvanceError("Solo se permiten archivos PDF.")
         }
      }
   }

   const backendUrl = getBackendUrl()
   const api_plantillas = `${backendUrl}/plantillas`

   // documentos de actas
   const handleSubirActa = async (e) => {
      e.preventDefault()
      const file = e.target.actaArchivo.files[0]
      if (!file) return

      // Si existe una acta, elimínala antes de subir la nueva
      const lastActa = acta
      if (lastActa) { await deleteDocumentos(lastActa.id) }

      // Ahora sube la nueva acta
      await sendDocuments(
         currentProject.id,
         "ACTAVB",      // tipoDocumento
         "VistoBueno",  // tag
         file
      )
      const newActa = await getDocuments(currentProject.id, "ACTAVB")
      setActa(newActa[0] || null)
      e.target.reset()
   }

   return (
      <>
         <section className="space-y-5">
            <div>
               <h4 className="font-bold text-2xl">Fase 6: Seguimiento de Hitos</h4>
               <p className="text-gris-institucional text-sm">
                  Evalúe el avance reportado por el estudiante para cada hito del proyecto
               </p>
               {project && <MensajeFase estadoRevision={project?.estadoActual > 6 ? "ACEPTADA" : project?.estadoRevision} mensaje={project?.comentarioRevision} />}
            </div>

            <Actividades taskList={actividades} />

            <Alert
               title={"Seguimiento de Avance"}
               classNames={{
                  title: "font-bold text-base",
                  base: "border-azul bg-azul-claro text-azul border py-5",
                  iconWrapper: "bg-transparent border-0 shadow-none",
                  description: "text-azul"
               }}
               description={"Registra el avance de cada hito del proyecto. Para enviar el proyecto a revisión, asegúrate de que todos los hitos estén completados al 100% y validados por el director y codirector. Además, es necesario tener adjuntado el acta de visto bueno del anteproyecto. Revisa cuidadosamente que toda la información esté actualizada antes de continuar."}
               icon={<><FileCode size={24} /></>}
            />

            {listAvances.length > 0 && (
               <div className="flex flex-col gap-2 mb-4">
                  <h5 className="font-semibold">Documentos de Avance</h5>
                  {listAvances.map(doc => (
                     <div key={doc.id} className="border rounded-md flex items-center justify-between p-2 px-4">
                        <div className="flex items-center gap-2">
                           <File size={18} className="text-blue-400" />
                           <span className="font-semibold text-sm">{doc.nombre}</span>
                           <span className="text-xs text-gray-500">{doc.tag}</span>
                        </div>
                        <div className="flex gap-2">
                           <a href={doc.url} target="_blank" rel="noopener noreferrer">
                              <Boton type="button" variant="whitered" customClassName="w-fit">
                                 <Download size={16} /> Descargar
                              </Boton>
                           </a>
                           {puedeEditar && !adminView && (
                              <Boton
                                 type="button"
                                 variant="borderwhite"
                                 customClassName="w-fit"
                                 onClick={async () => {
                                    await deleteDocumentos(doc.id)
                                    // Actualiza la lista de documentos
                                    const docs = await getDocuments(currentProject.id, "REQUISITOS")
                                    setListAvances(docs || [])
                                 }}
                              >
                                 Eliminar
                              </Boton>
                           )}
                        </div>
                     </div>
                  ))}
               </div>
            )}


            {puedeEditar && !adminView && (
               <form onSubmit={handleSubirAvance} className="flex flex-col gap-2 items-center mb-4 w-full">
                  <label
                     htmlFor="avanceFile"
                     className={`border-dashed rounded-md w-full p-10 border cursor-pointer flex flex-col items-center justify-center gap-2 transition-colors
            ${dragTarget ? "bg-azul-claro border-azul text-azul" : "border-gris-institucional text-gris-institucional bg-gris-claro/25"}`}
                     onDragOver={handleDragOver}
                     onDragLeave={handleDragLeave}
                     onDrop={handleDrop}
                  >
                     <Upload />
                     <div className="flex items-center gap-2">
                        <p className="text-sm">
                           {dragTarget
                              ? "Suelta aquí el archivo PDF"
                              : avanceFile
                                 ? avanceFile.name
                                 : "Haz click o arrastra un archivo PDF aquí"}
                        </p>
                        {avanceFile && (
                           <button
                              type="button"
                              className="ml-2 text-red-500 hover:text-red-700 font-bold text-lg"
                              onClick={e => {
                                 e.stopPropagation()
                                 setAvanceFile(null)
                                 if (fileInputRef.current) fileInputRef.current.value = ""
                              }}
                              aria-label="Eliminar archivo"
                           >
                              ×
                           </button>
                        )}
                     </div>
                  </label>
                  {avanceError && <span className="text-red-500 text-xs">{avanceError}</span>}
                  <div className="flex items-center justify-center gap-2 w-full">
                     <input
                        className="border rounded p-2 text-sm w-64"
                        type="text"
                        placeholder="Escribe un tag único para el documento"
                        value={avanceTag}
                        onChange={e => setAvanceTag(e.target.value.trim())}
                        required
                        maxLength={40}
                     />
                     <input
                        ref={fileInputRef}
                        id="avanceFile"
                        name="avanceFile"
                        type="file"
                        className="hidden"
                        accept=".pdf"
                        onChange={e => {
                           const file = e.target.files[0]
                           if (file && file.type === "application/pdf") {
                              setAvanceFile(file)
                           } else if (file) {
                              setAvanceError("Solo se permiten archivos PDF.")
                              e.target.value = ""
                           }
                        }}
                        required
                     />
                     <Boton type="submit" variant="borderwhite" customClassName="w-fit">
                        <Upload size={16} /> Subir Documento
                     </Boton>
                  </div>
               </form>
            )}

            <div>
               <div className="grid grid-cols-12 gap-4 font-bold mb-2">
                  <div className="col-span-6">Objetivo Específico</div>
                  <div className="col-span-2">Período</div>
                  <div className={`${adminView ? "col-span-1" : "col-span-2"}`}>Progreso</div>
                  <div className="col-span-1">% Avance</div>
                  <div className={`${adminView ? "col-span-2" : "col-span-1"} text-center`}>Validación</div>
               </div>
               {currentProject?.objetivosEspecificos.map(obj => (
                  <div key={obj.id} className="grid grid-cols-12 gap-4 items-center mb-2">
                     <div className="col-span-6 text-sm">{obj.descripcion}</div>
                     <div className="col-span-2 text-sm">
                        {(() => {
                           const parse = (dateStr) => {
                              if (!dateStr) return ""
                              let date
                              if (dateStr.includes('T')) {
                                 date = new Date(dateStr)
                              } else {
                                 const [year, month, day] = dateStr.split('-').map(num => parseInt(num, 10))
                                 date = new Date(year, month - 1, day)
                              }
                              return date.toLocaleDateString('es-ES', {
                                 day: '2-digit',
                                 month: 'short',
                                 year: 'numeric'
                              })
                           }
                           return `${parse(obj.fecha_inicio)} - ${parse(obj.fecha_fin)}`
                        })()}
                     </div>
                     <div className={`${adminView ? "col-span-1" : "col-span-2"}`}>
                        <Progress aria-label="none" value={obj.avanceReportado} classNames={{ indicator: "bg-rojo-institucional", track: "bg-rojo-claro" }} />
                     </div>
                     <div className="col-span-1 text-sm">
                        <input
                           className="border-gris-claro border rounded-md p-2 w-full"
                           type="number"
                           min={0}
                           max={100}
                           value={obj.avanceReportado === 0 || obj.avanceReportado === "" || obj.avanceReportado == null ? "" : obj.avanceReportado}
                           disabled={!puedeEditar || adminView}
                           onChange={(e) => {
                              let value = e.target.value
                              // Permitir vacío
                              if (value === "") {
                                 setCurrentProject({
                                    ...currentProject,
                                    objetivosEspecificos: currentProject.objetivosEspecificos.map(o =>
                                       o.id === obj.id ? { ...o, avanceReportado: 0 } : o
                                    )
                                 })
                                 return
                              }
                              // Solo permitir números entre 0 y 100
                              value = Number(value)
                              if (!isNaN(value)) {
                                 value = Math.max(0, Math.min(100, value))
                                 setCurrentProject({
                                    ...currentProject,
                                    objetivosEspecificos: currentProject.objetivosEspecificos.map(o =>
                                       o.id === obj.id ? { ...o, avanceReportado: value } : o
                                    )
                                 })
                              }
                           }}
                           onBlur={() => {
                              // Si el usuario deja el campo vacío, lo interpretamos como 0
                              if (obj.avanceReportado === "" || obj.avanceReportado == null) {
                                 setCurrentProject({
                                    ...currentProject,
                                    objetivosEspecificos: currentProject.objetivosEspecificos.map(o =>
                                       o.id === obj.id ? { ...o, avanceReportado: 0 } : o
                                    )
                                 })
                              }
                           }}
                        />
                     </div>
                     <div className={`${adminView ? "col-span-2" : "col-span-1"} flex items-center gap-2 justify-center`}>
                        {/* Director */}
                        <div className="flex flex-col items-center">
                           {
                              obj.evaluacion == null
                                 ? <Circle className="text-gris-intermedio" />
                                 : obj.evaluacion.director === true
                                    ? <CheckCircle className="text-green-400" />
                                    : obj.evaluacion.director === false
                                       ? <CircleAlert className="text-amber-400" />
                                       : <Circle className="text-gris-intermedio" />
                           }
                           {(adminView && (esDirector || esAdmin)) && (
                              <div className="flex flex-col gap-1">
                                 <span className="text-xs/tight font-semibold">Director</span>
                                 <div className="flex justify-center">
                                    <button
                                       className="text-green-600 hover:text-green-800"
                                       title="Validar"
                                       onClick={() => handleValidarObjetivo(obj.id, true, true)}
                                    >
                                       <CheckCircle size={18} />
                                    </button>
                                    <button
                                       className="text-amber-500 hover:text-amber-700"
                                       title="No validar"
                                       onClick={() => handleValidarObjetivo(obj.id, true, false)}
                                    >
                                       <CircleAlert size={18} />
                                    </button>
                                 </div>
                              </div>
                           )}
                        </div>
                        {/* Codirector */}
                        <div className="flex flex-col items-center">
                           {
                              obj.evaluacion == null
                                 ? <Circle className="text-gris-intermedio" />
                                 : obj.evaluacion.codirector === true
                                    ? <CheckCircle className="text-green-400" />
                                    : obj.evaluacion.codirector === false
                                       ? <CircleAlert className="text-amber-400" />
                                       : <Circle className="text-gris-intermedio" />
                           }
                           {(adminView && (esCodirector || esAdmin)) && (
                              <div className="flex flex-col gap-1">
                                 <span className="text-xs/tight font-semibold">Codirector</span>
                                 <div className="flex justify-center">
                                    <button
                                       className="text-green-600 hover:text-green-800"
                                       title="Validar"
                                       onClick={() => handleValidarObjetivo(obj.id, false, true)}
                                    >
                                       <CheckCircle size={18} />
                                    </button>
                                    <button
                                       className="text-amber-500 hover:text-amber-700"
                                       title="No validar"
                                       onClick={() => handleValidarObjetivo(obj.id, false, false)}
                                    >
                                       <CircleAlert size={18} />
                                    </button>
                                 </div>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
               ))}
            </div>

            {showSuccess.state && (
               <div className="bg-green-100 border-green-400 text-green-700 z-40 whitespace-nowrap w-fit
            border px-4 py-2 fixed bottom-10 right-10 rounded mb-2 text-sm font-semibold flex items-center gap-2">
                  <CheckCircle size={18} />
                  {showSuccess.message}
               </div>
            )}

            {(puedeEditar && !adminView) && (
               <div className="flex justify-end items-center gap-2">
                  <Boton
                     type="button"
                     variant="whitered"
                     customClassName="w-fit"
                     onClick={() => setShowConfirmModal(true)}
                     disabled={
                        !allFieldsFilled || listAvances.length === 0 ||
                        !currentProject?.objetivosEspecificos?.every(
                           obj => obj.avanceReportado == 100 &&
                              obj.evaluacion?.director === true &&
                              obj.evaluacion?.codirector === true
                        ) || !acta
                     }
                  >
                     Enviar a Revisión
                     <Send size={16} />
                  </Boton>
                  <Boton
                     type="button"
                     variant="borderwhite"
                     customClassName="w-fit"
                     onClick={handleAvanceChange}
                  >
                     <Save size={16} />
                     Guardar Cambios
                  </Boton>
               </div>
            )}

            {
               <section className="py-14">
                  <div className="flex justify-between items-center gap-2 mb-4">
                     <div className="flex flex-col">
                        <h5 className="font-bold text-lg">Acta: Visto Bueno del Anteproyecto</h5>
                        <p className="text-gris-institucional text-sm">
                           Una vez hayas completado todos los hitos al 100%, tus directores diligenciarán esta acta para certificar que has cumplido con la totalidad del proyecto.
                        </p>
                     </div>
                     {
                        adminView &&
                        <a
                           className="text-blue-500 hover:underline"
                           rel="noopener noreferrer"
                           href={`${api_plantillas}/VISTO-BUENO-ANTEPROYECTO.docx`}
                           target="_blank"
                           download
                        >
                           <Boton variant={"whitered"} customClassName="w-fit">
                              Descargar Borrador
                           </Boton>
                        </a>
                     }
                  </div>
                  <div className="flex flex-col gap-3">
                     {
                        acta ? (
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
                                 >
                                    <Boton type="button" variant="whitered" customClassName="w-fit">
                                       Vista previa
                                    </Boton>
                                 </a>
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
                              </div>
                           </div>
                        ) : (
                           <div className="border rounded-md p-4 text-sm">
                              Aún no se ha subido el acta de visto bueno del anteproyecto.
                           </div>
                        )
                     }
                  </div>
                  {
                     (adminView && project.estadoRevision !== "EN_REVISION") &&
                     <div className="mt-6 space-y-2">
                        <label className="font-bold select-none">Agregar Acta de Visto Bueno del Anteproyecto</label>
                        <form
                           onSubmit={handleSubirActa}
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
                              Subir Acta
                           </Boton>
                        </form>
                     </div>
                  }
               </section>
            }
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