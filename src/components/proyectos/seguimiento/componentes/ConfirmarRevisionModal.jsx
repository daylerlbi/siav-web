import { useEffect, useRef } from "react"
import Boton from "../../../Boton"

export default function ConfirmarRevisionModal({ isOpen, onConfirm, onCancel }) {
    const modalRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) onCancel()
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => { document.removeEventListener("mousedown", handleClickOutside) }
    }, [onCancel])

    if (!isOpen) return null

    return (
        <main className="bg-black/50 backdrop-blur-md flex justify-center items-center fixed w-full h-full z-50 left-0 top-0">
            <section ref={modalRef} className="bg-white modal-animation max-w-xl w-full rounded-md p-6">
                <h6 className="text-lg font-semibold text-red-700">Confirmar Envío a Revisión</h6>
                <p className="text-sm mb-5 mt-2">
                    <b>Verifica que toda la información esté completa y correcta.</b><br />
                    ¿Estás seguro de que deseas enviar tu proyecto a revisión? <b>NO</b> podrás editar el formulario hasta que el proyecto sea revisado.
                </p>
                <div className="flex items-stretch gap-2">
                    <Boton type="button" variant="borderwhite" onClick={onCancel}>
                        Cancelar
                    </Boton>
                    <Boton type="button" variant="whitered" onClick={onConfirm}>
                        Enviar a Revisión
                    </Boton>
                </div>
            </section>
        </main>
    )
}