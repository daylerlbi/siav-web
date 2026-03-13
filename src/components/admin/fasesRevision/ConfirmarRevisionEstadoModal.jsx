import { useEffect, useRef } from "react"
import Boton from "../../Boton"

export default function ConfirmarRevisionEstadoModal({ proyecto, fase, estado, isOpen, onConfirm, onCancel }) {
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
                <h6 className="text-lg font-semibold text-rojo-mate">Confirmar cambio de estado</h6>
                <p className="text-sm mb-5 mt-2">
                    ¿Seguro que deseas <b className="text-rojo-mate uppercase">{estado} {fase}</b> del proyecto <b>{proyecto?.titulo}</b>?
                </p>
                <div className="flex items-stretch gap-2">
                    <Boton type="button" variant="whitered" onClick={onCancel}>
                        Cancelar
                    </Boton>
                    <Boton type="button" variant="borderwhite" onClick={onConfirm}>
                        Confirmar cambio
                    </Boton>
                </div>
            </section>
        </main>
    )
}