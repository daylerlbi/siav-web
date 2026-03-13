import { useEffect, useRef, useState } from "react"
import { AlertTriangle } from "lucide-react"
import Boton from "../Boton"

export default function EliminarInformeModal({ informe, isOpen, onConfirm }) {
   const modalRef = useRef(null)
   const [eliminando, setEliminando] = useState(false)

   useEffect(() => {
      const handleClickOutside = (event) => {
         if (modalRef.current && !modalRef.current.contains(event.target) && !eliminando) {
            isOpen(null)
         }
      }
      document.addEventListener("mousedown", handleClickOutside)
      return () => { 
         document.removeEventListener("mousedown", handleClickOutside) 
      }
   }, [isOpen, eliminando])

   if (!informe) return null

   const handleEliminar = async () => {
      setEliminando(true)
      try {
         await onConfirm(informe)
         isOpen(null)
         // Recargar la página después de eliminar exitosamente
         window.location.reload()
      } catch (error) {
         console.error('Error al eliminar informe:', error)
         setEliminando(false)
      }
   }

   return (
      <main className="bg-black/50 backdrop-blur-md flex justify-center items-center fixed w-full h-full z-50 left-0 top-0">
         <section ref={modalRef} className="bg-white modal-animation max-w-xl w-full rounded-md p-6">
            <div className="flex items-center gap-2 mb-3">
               <AlertTriangle size={24} className="text-red-500" />
               <h6 className="text-lg font-semibold text-red-700">Eliminar Informe</h6>
            </div>
            
            <div className="mb-5">
               <p className="text-sm mb-2">
                  ¿Estás seguro de que deseas eliminar el informe:
               </p>
               <p className="font-semibold text-gray-900 mb-2">
                  "{informe.descripcion}"
               </p>
               <p className="text-sm text-red-600">
                  Esta acción no se puede deshacer.
               </p>
            </div>

            <div className="flex items-stretch gap-2">
               <Boton 
                  type="button" 
                  variant="borderwhite" 
                  onClick={() => isOpen(null)}
                  disabled={eliminando}
               >
                  Cancelar
               </Boton>
               <Boton 
                  type="button" 
                  variant="whitered" 
                  onClick={handleEliminar}
                  disabled={eliminando}
               >
                  {eliminando ? 'Eliminando...' : 'Eliminar'}
               </Boton>
            </div>
         </section>
      </main>
   )
}
