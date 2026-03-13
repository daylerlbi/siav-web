import { ChevronDown, Save } from "lucide-react"
import Actividades from "../componentes/Actividades"
import { useState, useRef, useEffect } from "react"
import Boton from "../../../Boton"
import useProject from "../../../../lib/hooks/useProject"
import MensajeFase from "../componentes/MensajeFase"
import ConfirmarRevisionModal from "../componentes/ConfirmarRevisionModal"
import { Send } from "lucide-react"
import { CheckCircle } from "lucide-react"

const actividades = [
   {
      title: "Selección de Grupo de Investigación",
      tasks: [
         { desc: "Seleccionar grupo y línea de investigación" },
         { desc: "Recomendar director y codirector (OPCIONAL)" },
      ],
   },
]

export default function Fase_2({ project, adminView = false }) {
   const { listaGrupos, listDocentes, editProject, setReviewState } = useProject()

   const [currentProject, setCurrentProject] = useState(null)
   const [listGrupos, setListGrupos] = useState([])
   const [listDirectores, setListDirectores] = useState([])
   const [showConfirmModal, setShowConfirmModal] = useState(false)
   const [isGrupoOpen, setIsGrupoOpen] = useState(false)
   const [isLineaOpen, setIsLineaOpen] = useState(false)
   const [isDirectorOpen, setIsDirectorOpen] = useState(false)
   const [isCodirectorOpen, setIsCodirectorOpen] = useState(false)
   const [showSuccess, setShowSuccess] = useState({ message: "", state: false })

   const [formData, setFormData] = useState({
      grupo: null,
      linea: null,
      director: null,
      codirector: null,
   })

   const grupoRef = useRef(null)
   const lineaRef = useRef(null)
   const directorRef = useRef(null)
   const codirectorRef = useRef(null)

   useEffect(() => { fetchListas() }, [])
   useEffect(() => {
      const handleClickOutside = (event) => {
         if (grupoRef.current && !grupoRef.current.contains(event.target)) setIsGrupoOpen(false)
         if (lineaRef.current && !lineaRef.current.contains(event.target)) setIsLineaOpen(false)
         if (directorRef.current && !directorRef.current.contains(event.target)) setIsDirectorOpen(false)
         if (codirectorRef.current && !codirectorRef.current.contains(event.target)) setIsCodirectorOpen(false)
      }

      document.addEventListener("mousedown", handleClickOutside)
      return () => { document.removeEventListener("mousedown", handleClickOutside) }
   }, [])

   const fetchListas = async () => {
      const grupos = await listaGrupos()
      const docentes = await listDocentes()
      setCurrentProject(project)
      setListGrupos(grupos)
      setListDirectores(docentes)

      // --- NUEVA LÓGICA ---
      const { director: asignadoDirector, codirector: asignadoCodirector } = getDirectorCodirectorAsignados(project.usuariosAsignados)

      // Si hay director y codirector asignados, NO mostrar recomendacionDirectores
      if (asignadoDirector && asignadoCodirector) {
         setFormData({
            ...formData,
            grupo: grupos.find(g => g.id === project.lineaInvestigacion.grupoInvestigacion.id),
            linea: grupos.find(g => g.id === project.lineaInvestigacion.grupoInvestigacion.id).lineasInvestigacion.find(l => l.id === project.lineaInvestigacion.id),
            director: null,
            codirector: null,
         })
      } else {
         // Si NO hay ambos asignados, usar recomendacionDirectores para preseleccionar
         setFormData({
            ...formData,
            grupo: grupos.find(g => g.id === project.lineaInvestigacion.grupoInvestigacion.id),
            linea: grupos.find(g => g.id === project.lineaInvestigacion.grupoInvestigacion.id).lineasInvestigacion.find(l => l.id === project.lineaInvestigacion.id),
            director: docentes.find(d =>
               `${d.primerNombre ?? ""}${d.segundoNombre ?? ""}${d.primerApellido ?? ""}${d.segundoApellido ?? ""}`.replace(/\s+/g, "")
               ==
               `${project.recomendacionDirectores?.split(" y ")[0]}`.replace(/\s+/g, "")
            ),
            codirector: docentes.find(d =>
               `${d.primerNombre ?? ""}${d.segundoNombre ?? ""}${d.primerApellido ?? ""}${d.segundoApellido ?? ""}`.replace(/\s+/g, "")
               ==
               `${project.recomendacionDirectores?.split(" y ")[1]}`.replace(/\s+/g, "")
            ),
         })
      }
   }

   const onSubmit = async (e) => {
      if (e) e.preventDefault()

      try {
         const { linea, director, codirector } = formData

         const getNombreCompleto = (persona) => {
            if (!persona) return ""
            return [
               persona.primerNombre,
               persona.segundoNombre,
               persona.primerApellido,
               persona.segundoApellido
            ].filter(val => val && val.trim() !== "").join(" ").trim()
         }

         const nombres = [getNombreCompleto(director), getNombreCompleto(codirector)].filter(nombre => nombre && nombre.trim() !== "").join(" y ")

         const data = { lineaInvestigacion: { id: linea.id }, ...(nombres && { recomendacionDirectores: nombres }) }
         await editProject(data, currentProject.id)

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

   const getDirectorCodirectorAsignados = (usuariosAsignados = []) => {
      let director = null
      let codirector = null
      usuariosAsignados.forEach(u => {
         if (u.rol?.nombre === "Director") director = u
         if (u.rol?.nombre === "Codirector") codirector = u
      })
      return { director, codirector }
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

   // NUEVO: Detectar si hay director y codirector asignados
   const { director: asignadoDirector, codirector: asignadoCodirector } = getDirectorCodirectorAsignados(project.usuariosAsignados)

   const puedeEditar = (
      (project?.estadoActual === 2) &&
      (project?.estadoRevision === null || project?.estadoRevision === "RECHAZADA" || project?.estadoRevision === "SIN_REVISAR"))

   return (
      <>
         <section className="space-y-5">
            <div>
               <h4 className="font-bold text-2xl">Fase 2: Presentación Inicial del Proyecto</h4>
               <p className="text-gris-institucional text-sm">
                  Selecciona el grupo de investigación y la línea de investigación a la que pertenece tu proyecto.
               </p>
               {project && <MensajeFase estadoRevision={project?.estadoActual > 2 ? "ACEPTADA" : project?.estadoRevision} mensaje={project?.comentarioRevision} />}
            </div>

            <Actividades taskList={actividades} />

            <form onSubmit={onSubmit} className='flex flex-col w-full space-y-5 text-sm'>
               <div className="space-y-1">
                  <label className="font-bold select-none">Grupo y Línea de Investigación</label>
                  <div className="flex items-center gap-2">
                     <div ref={grupoRef} className="relative w-full">
                        <button disabled={!puedeEditar || adminView} onClick={() => currentProject?.estadoActual === 2 && setIsGrupoOpen(!isGrupoOpen)} type="button" className="border-gris-claro text-start border rounded-md p-2.5 w-full flex justify-between items-center">
                           <p>{!formData.grupo ? "Seleccione un grupo de investigación" : formData.grupo.nombre}</p>
                           <ChevronDown size={18} className={`${isGrupoOpen ? "-rotate-180" : "rotate-0"} duration-150`} />
                        </button>
                        {
                           isGrupoOpen &&
                           <div className="bg-white border-gris-claro max-h-40 overflow-y-auto border absolute top-[110%] left-0 w-full select-animation rounded-md z-10">
                              {
                                 listGrupos.map((grupo, index) =>
                                    <button key={index} onClick={() => {
                                       setFormData({ ...formData, grupo: grupo, linea: grupo.lineasInvestigacion[0] })
                                       setIsGrupoOpen(false)
                                    }} type="button"
                                       className="hover:bg-gris-claro/50 w-full text-start duration-150 p-2.5 text-sm">
                                       {grupo.nombre}
                                    </button>
                                 )
                              }
                           </div>
                        }
                     </div>
                     <div ref={lineaRef} className="relative w-full">
                        <button disabled={(!formData.grupo) || (!puedeEditar || adminView)} onClick={() => currentProject?.estadoActual === 2 && setIsLineaOpen(!isLineaOpen)} type="button" className="border-gris-claro text-start border rounded-md p-2.5 w-full flex justify-between items-center">
                           <p>{!formData.linea && !formData.grupo ? "Primero seleccione un grupo de investigación" : formData.linea.nombre}</p>
                           <ChevronDown size={18} className={`${isLineaOpen ? "-rotate-180" : "rotate-0"} duration-150`} />
                        </button>
                        {
                           isLineaOpen && formData.grupo &&
                           <div className="bg-white border-gris-claro max-h-40 overflow-y-auto border absolute top-[110%] left-0 w-full select-animation rounded-md z-10">
                              {
                                 formData.grupo.lineasInvestigacion.map((linea, index) =>
                                    <button key={index} onClick={() => {
                                       setFormData({ ...formData, linea: linea })
                                       setIsLineaOpen(false)
                                    }} type="button"
                                       className="hover:bg-gris-claro/50 w-full text-start duration-150 p-2.5 text-sm">
                                       {linea.nombre}
                                    </button>
                                 )
                              }
                           </div>
                        }
                     </div>
                  </div>
               </div>

               {/* Mostrar recomendación como inputs SOLO si NO hay director y codirector asignados.
                Si ya están asignados, mostrar sus nombres como texto. */}
               {(asignadoDirector || asignadoCodirector) ? (
                  <div className="space-y-1">
                     <label className="font-bold select-none">Director y Codirector asignados</label>
                     <div className="flex items-center gap-2">
                        <div className="w-full border rounded-md p-2.5 bg-gray-50">
                           <span className="font-semibold">Director: </span>
                           {asignadoDirector
                              ? (asignadoDirector.nombreUsuario || "Sin nombre")
                              : <span className="text-gray-400">No asignado</span>
                           }
                        </div>
                        <div className="w-full border rounded-md p-2.5 bg-gray-50">
                           <span className="font-semibold">Codirector: </span>
                           {asignadoCodirector
                              ? (asignadoCodirector.nombreUsuario || "Sin nombre")
                              : <span className="text-gray-400">No asignado</span>
                           }
                        </div>
                     </div>
                  </div>
               ) : (
                  <div className="space-y-1">
                     <label className="font-bold select-none">Recomendar Director y Codirector (OPCIONAL)</label>
                     <div className="flex items-center gap-2">
                        <div ref={directorRef} className="relative w-full">
                           <button disabled={!puedeEditar || adminView} onClick={() => currentProject?.estadoActual === 2 && setIsDirectorOpen(!isDirectorOpen)} type="button" className="border-gris-claro text-start border rounded-md p-2.5 w-full flex justify-between items-center">
                              <p>{!formData.director ? "Seleccione un director" :
                                 `${formData.director.primerNombre ?? ""} ${formData.director.segundoNombre ?? ""} 
                           ${formData.director.primerApellido ?? ""} ${formData.director.segundoApellido ?? ""}`}</p>
                              <ChevronDown size={18} className={`${isDirectorOpen ? "-rotate-180" : "rotate-0"} duration-150`} />
                           </button>
                           {
                              isDirectorOpen &&
                              <div className="bg-white border-gris-claro max-h-40 overflow-y-auto border absolute top-[110%] left-0 w-full select-animation rounded-md z-10">
                                 {
                                    listDirectores.filter(u => u.id !== formData.codirector?.id).map((user, index) =>
                                       <button key={index} onClick={() => {
                                          setFormData({ ...formData, director: user })
                                          setIsDirectorOpen(false)
                                       }} type="button"
                                          className="hover:bg-gris-claro/50 w-full text-start duration-150 p-2.5 text-sm">
                                          {`${user.primerNombre ?? ""} ${user.segundoNombre ?? ""} ${user.primerApellido ?? ""} ${user.segundoApellido ?? ""}`}
                                       </button>
                                    )
                                 }
                              </div>
                           }
                        </div>
                        <div ref={codirectorRef} className="relative w-full">
                           <button disabled={!puedeEditar || adminView} onClick={() => currentProject?.estadoActual === 2 && setIsCodirectorOpen(!isCodirectorOpen)} type="button" className="border-gris-claro text-start border rounded-md p-2.5 w-full flex justify-between items-center">
                              <p>{!formData.codirector ? "Seleccione un codirector" :
                                 `${formData.codirector.primerNombre ?? ""} ${formData.codirector.segundoNombre ?? ""} 
                           ${formData.codirector.primerApellido ?? ""} ${formData.codirector.segundoApellido ?? ""}`}</p>
                              <ChevronDown size={18} className={`${isCodirectorOpen ? "-rotate-180" : "rotate-0"} duration-150`} />
                           </button>
                           {
                              isCodirectorOpen &&
                              <div className="bg-white border-gris-claro max-h-40 overflow-y-auto border absolute top-[110%] left-0 w-full select-animation rounded-md z-10">
                                 {
                                    listDirectores.filter(u => u.id !== formData.director?.id).map((user, index) =>
                                       <button key={index} onClick={() => {
                                          setFormData({ ...formData, codirector: user })
                                          setIsCodirectorOpen(false)
                                       }} type="button"
                                          className="hover:bg-gris-claro/50 w-full text-start duration-150 p-2.5 text-sm">
                                          {`${user.primerNombre ?? ""} ${user.segundoNombre ?? ""} ${user.primerApellido ?? ""} ${user.segundoApellido ?? ""}`}
                                       </button>
                                    )
                                 }
                              </div>
                           }
                        </div>
                     </div>
                  </div>
               )}

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