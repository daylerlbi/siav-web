import Actividades from "../componentes/Actividades"
import { DatePicker } from "@heroui/date-picker"
import { Save, CircleHelp } from "lucide-react"
import { Alert } from "@heroui/alert"
import Boton from "../../../Boton"
import useProject from "../../../../lib/hooks/useProject"
import { parseDate } from "@internationalized/date"
import { useState, useEffect } from "react"
import { Send } from "lucide-react"
import ConfirmarRevisionModal from "../componentes/ConfirmarRevisionModal"
import { CheckCircle } from "lucide-react"
import MensajeFase from "../componentes/MensajeFase"

const actividades = [
   {
      title: "Planificación de Hitos del Proyecto",
      tasks: [
         { desc: "Definir fechas para cada objetivo específico" },
         { desc: "Revisar la distribución de tareas en 12 meses" },
         { desc: "Confirmación de la planificación con el director" },
      ],
   }
]

export default function Fase_5({ project, adminView = false }) {
   const [showSuccess, setShowSuccess] = useState({ message: "", state: false })
   const [showConfirmModal, setShowConfirmModal] = useState(false)
   const [currentProject, setCurrentProject] = useState(null)
   const { editProgress, setReviewState } = useProject()
   const [errores, setErrores] = useState({})

   const fetchProject = async () => {
      setCurrentProject(project)
   }

   useEffect(() => { fetchProject() }, [])

   const handleFechaChange = (id, field, value) => {
      setCurrentProject((prev) => ({
         ...prev,
         objetivosEspecificos: prev.objetivosEspecificos.map((obj) =>
            obj.id === id ? { ...obj, [field]: value?.toString() ?? "" } : obj
         ),
      }))
   }

   const formatDate = (date) => {
      if (!date) return ""
      if (typeof date === "string") return date
      if (typeof date === "object" && date.year && date.month && date.day) {
         const jsDate = new Date(date.year, date.month - 1, date.day)
         return jsDate.toISOString().slice(0, 10)
      }
      if (date instanceof Date) {
         return date.toISOString().slice(0, 10)
      }
      return ""
   }

   // Validación de fechas
   useEffect(() => {
      if (!currentProject?.objetivosEspecificos) return
      const errs = {}
      const objetivos = currentProject.objetivosEspecificos
      for (let i = 0; i < objetivos.length; i++) {
         const obj = objetivos[i]
         const inicio = obj.fecha_inicio ? new Date(formatDate(obj.fecha_inicio)) : null
         const fin = obj.fecha_fin ? new Date(formatDate(obj.fecha_fin)) : null

         // Regla 1: Fin después de inicio
         if (inicio && fin && fin <= inicio) {
            errs[obj.id] = { ...(errs[obj.id] || {}), fecha_fin: "La fecha de fin debe ser posterior a la fecha de inicio." }
         }

         // Regla 2: No solaparse con el anterior
         if (i > 0) {
            const prev = objetivos[i - 1]
            const prevFin = prev.fecha_fin ? new Date(formatDate(prev.fecha_fin)) : null
            if (inicio && prevFin && (inicio <= prevFin)) {
               errs[obj.id] = { ...(errs[obj.id] || {}), fecha_inicio: "La fecha de inicio debe ser posterior a la fecha de fin del objetivo anterior." }
            }
            if (fin && prevFin && (fin <= prevFin)) {
               errs[obj.id] = { ...(errs[obj.id] || {}), fecha_fin: "La fecha de fin debe ser posterior a la fecha de fin del objetivo anterior." }
            }
         }
      }
      setErrores(errs)
   }, [currentProject])

   const allFieldsFilled = currentProject?.objetivosEspecificos.every(
      obj => obj.fecha_inicio && obj.fecha_fin
   )

   const hasErrors = Object.keys(errores).length > 0

   const handleSave = async () => {
      try {
         if (hasErrors) {
            alert("Corrige los errores antes de guardar.")
            return
         }

         const objetivosFormateados = currentProject.objetivosEspecificos.map(obj => ({
            ...obj,
            fecha_inicio: formatDate(obj.fecha_inicio),
            fecha_fin: formatDate(obj.fecha_fin),
         }))

         await editProgress({ objetivosEspecificos: objetivosFormateados }, currentProject.id)

         setShowSuccess({
            message: "Cambios guardados correctamente",
            state: true
         })

         setTimeout(() => setShowSuccess({ message: "", state: false }), 3000)
         return true
      } catch (error) {
         console.error("Error al guardar:", error)
         alert("Error al guardar los cambios. Inténtalo de nuevo más tarde.")
         return false
      }
   }

   const handleReview = async () => {
      const guardado = await handleSave()
      if (!guardado) return

      if (!allFieldsFilled) {
         alert("Por favor, completa todas las fechas de inicio y fin.")
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
            alert("Error al enviar el proyecto a revisión. Inténtalo de nuevo más tarde.")
         })
   }

   const puedeEditar = ((project?.estadoActual === 5) && (project?.estadoRevision === null || project?.estadoRevision === "RECHAZADA" || project?.estadoRevision === "SIN_REVISAR"))

   return (
      <>
         <section className="space-y-5">
            <div>
               <h4 className="font-bold text-2xl">Fase 5: Planificación de Hitos del Proyecto</h4>
               <p className="text-gris-institucional text-sm">
                  Defina las fechas de inicio y fin para cada objetivo específico del proyecto
               </p>
               {project && <MensajeFase estadoRevision={project?.estadoActual > 5 ? "ACEPTADA" : project?.estadoRevision} mensaje={project?.comentarioRevision} />}

            </div>

            <Actividades taskList={actividades} />

            <Alert
               title={"Recomendación para la planificación"}
               classNames={{
                  title: "font-bold text-base",
                  base: "border-azul bg-azul-claro text-azul border py-5",
                  iconWrapper: "bg-transparent border-0 shadow-none",
                  description: "text-azul"
               }}
               description={"Se recomienda planificar todos los hitos del proyecto dentro de un período estimado de 12 meses. Asegúrese de distribuir las tareas de manera realista a lo largo de este tiempo."}
               icon={<><CircleHelp size={24} /></>}
            />

            <div className="overflow-x-auto overflow-y-auto">
               <div className="grid grid-cols-3 gap-4 font-bold mb-2">
                  <div>Objetivo Específico</div>
                  <div>Fecha de Inicio</div>
                  <div>Fecha de Fin</div>
               </div>
               {currentProject?.objetivosEspecificos.map(obj => (
                  <div key={obj.id} className="grid grid-cols-3 gap-4 items-center mb-2">
                     <div className="text-sm">{obj.descripcion}</div>
                     <div>
                        <div className="relative">
                           <DatePicker
                              value={obj.fecha_inicio ? parseDate(obj.fecha_inicio) : null}
                              onChange={(date) => handleFechaChange(obj.id, "fecha_inicio", date)}
                              aria-label="Fecha de inicio"
                              classNames={{
                                 inputWrapper: `border-gris-claro border rounded-md hover:bg-transparent bg-transparent shadow-none ${errores[obj.id]?.fecha_inicio ? "border-red-500" : ""}`
                              }}
                              title={errores[obj.id]?.fecha_inicio || ""}
                              isDisabled={!puedeEditar || adminView}
                           />
                           {errores[obj.id]?.fecha_inicio && (
                              <span className="absolute left-0 top-full mt-1 text-xs bg-red-500 text-white rounded px-2 py-1 z-10 shadow">
                                 {errores[obj.id]?.fecha_inicio}
                              </span>
                           )}
                        </div>
                     </div>
                     <div>
                        <div className="relative">
                           <DatePicker
                              value={obj.fecha_fin ? parseDate(obj.fecha_fin) : null}
                              onChange={(date) => handleFechaChange(obj.id, "fecha_fin", date)}
                              aria-label="Fecha de fin"
                              classNames={{
                                 inputWrapper: `border-gris-claro border rounded-md hover:bg-transparent bg-transparent shadow-none ${errores[obj.id]?.fecha_fin ? "border-red-500" : ""}`
                              }}
                              title={errores[obj.id]?.fecha_fin || ""}
                              isDisabled={!puedeEditar || adminView}
                           />
                           {errores[obj.id]?.fecha_fin && (
                              <span className="absolute left-0 top-full mt-1 text-xs bg-red-500 text-white rounded px-2 py-1 z-10 shadow">
                                 {errores[obj.id]?.fecha_fin}
                              </span>
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
                  {showSuccess.message || "Cambios guardados correctamente"}
               </div>
            )}
            {
               (puedeEditar && !adminView) &&
               <div className="flex justify-end items-center gap-2">
                  <Boton
                     type="button"
                     variant="whitered"
                     customClassName="w-fit"
                     onClick={() => setShowConfirmModal(true)}
                     disabled={!allFieldsFilled || hasErrors}
                  >
                     Enviar a Revisión
                     <Send size={16} />
                  </Boton>
                  <Boton customClassName="w-fit"
                     type={"button"}
                     variant={"borderwhite"}
                     onClick={handleSave}
                     disabled={hasErrors}
                  >
                     <Save size={16} />
                     Guardar Cambios
                  </Boton>
               </div>
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