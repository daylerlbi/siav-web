import { useEffect } from "react"
import Fase_1 from "../../components/proyectos/seguimiento/fases/Fase_1"
import Fase_2 from "../../components/proyectos/seguimiento/fases/Fase_2"
import Fase_3 from "../../components/proyectos/seguimiento/fases/Fase_3"
import Fase_4 from "../../components/proyectos/seguimiento/fases/Fase_4"
import Fase_5 from "../../components/proyectos/seguimiento/fases/Fase_5"
import Fase_6 from "../../components/proyectos/seguimiento/fases/Fase_6"
import Fase_7 from "../../components/proyectos/seguimiento/fases/Fase_7"
import Fase_8 from "../../components/proyectos/seguimiento/fases/Fase_8"
import Fase_9 from "../../components/proyectos/seguimiento/fases/Fase_9"
import { Circle } from "lucide-react"
import { useState } from "react"
import useProject from "../../lib/hooks/useProject"
import { useNavigate } from "react-router-dom"

export default function Seguimiento() {

   const { getProject } = useProject()
   const navigate = useNavigate()

   const [currentProject, setCurrentProject] = useState(null)
   const [isLoading, setIsLoading] = useState(true)
   const [currentView, setCurrentView] = useState(null)

   useEffect(() => {
      const fetchProject = async () => {
         try {
            const data = await getProject(true)
            if (!data) {
               setCurrentProject(null)
               return
            }
            setCurrentProject(data)
         } catch (error) {
            console.error("Error fetching project:", error)
         } finally {
            setIsLoading(false)
         }
      }
      fetchProject()
   }, [])

   // Redirigir si el proyecto está terminado
   useEffect(() => {
      if (currentProject && currentProject.estadoActual === 0) {
         navigate("/estado-proyecto")
      }
   }, [currentProject, navigate])

   // Solo definir fasesData cuando currentProject está disponible
   const fasesData = currentProject ? [
      { id: 1, title: "Fase 1", content: <Fase_1 project={currentProject} /> },
      { id: 2, title: "Fase 2", content: <Fase_2 project={currentProject} /> },
      { id: 3, title: "Fase 3", content: <Fase_3 project={currentProject} /> },
      { id: 4, title: "Fase 4", content: <Fase_4 project={currentProject} /> },
      { id: 5, title: "Fase 5", content: <Fase_5 project={currentProject} /> },
      { id: 6, title: "Fase 6", content: <Fase_6 project={currentProject} /> },
      { id: 7, title: "Fase 7", content: <Fase_7 project={currentProject} /> },
      { id: 8, title: "Fase 8", content: <Fase_8 project={currentProject} /> },
   ] : []

   // Actualizar currentView cuando se obtienen los datos
   useEffect(() => {
      if (currentProject && fasesData.length > 0) {
         const faseActual = fasesData.find(fase => fase.id === currentProject.estadoActual) || fasesData[0]
         setCurrentView(faseActual)
      }
   }, [currentProject])

   if (isLoading) return <div>Cargando...</div>
   if (!currentProject) return <Fase_1 />

   function getEstadoRevisionColor(estadoRevision) {
      if (estadoRevision === null || estadoRevision === "SIN_REVISAR") return "#3b8ee4"
      if (estadoRevision === "EN_REVISION") return "#f79e08"
      if (estadoRevision === "RECHAZADA") return "#f44545"
      if (estadoRevision === "ACEPTADA") return "#0fba80"
      return "#b0b0b07f"
   }

   return (
      <main className="flex flex-col gap-4 h-full">
         <h1 className="font-black text-3xl">Seguimiento del Proyecto</h1>
         <h5 className="font-bold text-xl">Progreso del Proyecto</h5>

         <div className="relative mb-12">
            <div className="bg-gris-claro absolute h-[1.5px] top-1/2 left-0 right-0 -translate-y-[9px] mx-4 -z-0" />
            <div className="relative flex justify-between">
               {
                  fasesData.map(faze => {
                     const isFuture = faze.id > currentProject.estadoActual
                     const isActual = faze.id === currentView?.id

                     const circleColor =
                        (faze.id < currentProject.estadoActual) ? "#0fba80" : // Color del círculo para fases pasadas
                           (faze.id > currentProject.estadoActual) ? "#ffffff" : // Color del círculo para fases futuras
                              (faze.id === currentProject.estadoActual) && getEstadoRevisionColor(currentProject?.estadoRevision) // Color del círculo para la fase actual

                     const titleColor =
                        (faze.id < currentProject.estadoActual) ? "text-green-600" : // Color del title para fases pasadas
                           (faze.id > currentProject.estadoActual) ? "text-[#c9c9c9]" : // Color del title para fases futuras
                              (faze.id === currentProject.estadoActual) && `text-[${getEstadoRevisionColor(currentProject?.estadoRevision)}]` // Color del title para la fase actual
                     return (
                        <button
                           key={faze.id}
                           className={`flex flex-col items-center ${isFuture ? "cursor-not-allowed" : ""}`}
                           onClick={() => {
                              if (!isFuture) setCurrentView(faze)
                           }}
                           disabled={isFuture}
                           type="button"
                        >
                           <Circle
                              className={`stroke-[0.75]`}
                              style={{
                                 fill: circleColor,
                                 stroke: `${isFuture ? "#c7c8c9" : "#262626"}`
                              }}
                           />
                           <span className={`${titleColor} ${isActual && "font-bold underline"} text-xs`}>
                              {faze.title}
                           </span>
                        </button>
                     )
                  })
               }
            </div>
         </div>

         <section className="mx-auto w-full pb-10">{currentView?.content}</section>
      </main >
   )
}