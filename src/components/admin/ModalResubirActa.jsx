import { File, Upload } from "lucide-react"
import { useRef, useState } from "react"
import Boton from "../Boton"

export default function ModalResubirActa({ isOpen, onClose, acta, onSubir }) {
    const [archivo, setArchivo] = useState(null)
    const [dragTarget, setDragTarget] = useState(false)
    const inputRef = useRef(null)

    if (!isOpen || !acta) return null

    const getFileInfo = (file) => file ? `${file.name} (${(file.size / 1024).toFixed(2)} KB)` : null

    return (
        <main className="bg-black/50 backdrop-blur-md flex justify-center items-center fixed w-full h-full z-50 left-0 top-0">
            <section className="bg-white modal-animation max-w-xl w-full rounded-md p-6">
                <h6 className="font-bold text-lg mb-2">Resubir Acta de Aprobación</h6>
                <div className="flex justify-between items-center gap-2 border rounded-md p-2 mb-2">
                    <div className="flex items-center text-sm gap-2">
                        <File size={20} className="text-blue-400" />
                        <span className="font-semibold">{acta.nombre}</span>
                    </div>
                    <a href={acta.url} target="_blank" className="text-blue-500 hover:underline text-xs" download>
                        Descargar actual
                    </a>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                    Si subes una nueva acta, la actual será reemplazada.
                </p>
                <label
                    htmlFor="archivoActa"
                    className={`border-dashed rounded-md w-full p-4 border cursor-pointer flex flex-col items-center justify-center gap-2 py-8
                    ${dragTarget ? "bg-azul-claro border-azul text-azul" : "border-gris-institucional text-gris-institucional bg-gris-claro/25"}`}
                    onDragOver={e => { e.preventDefault(); setDragTarget(true) }}
                    onDragLeave={e => { e.preventDefault(); setDragTarget(false) }}
                    onDrop={e => {
                        e.preventDefault()
                        setDragTarget(false)
                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                            const file = e.dataTransfer.files[0]
                            if (file.type === 'application/pdf') {
                                setArchivo(file)
                                if (inputRef.current) inputRef.current.value = ""
                            } else {
                                alert('Por favor, suba únicamente archivos PDF')
                            }
                        }
                    }}
                >
                    <Upload />
                    <p className="text-sm">
                        {dragTarget
                            ? "Suelte aquí el nuevo acta"
                            : "Haga click para cargar el nuevo acta o arrastre el archivo aquí"}
                    </p>
                    <div className="flex items-center gap-2">
                        <p className="text-xs">{getFileInfo(archivo) ?? "PDF (MAX: 100MB)"}</p>
                        {archivo && (
                            <button
                                type="button"
                                className="ml-2 text-red-500 hover:text-red-700 font-bold text-lg"
                                onClick={e => {
                                    e.stopPropagation()
                                    setArchivo(null)
                                    if (inputRef.current) inputRef.current.value = ""
                                }}
                                aria-label="Eliminar archivo"
                            >
                                ×
                            </button>
                        )}
                    </div>
                </label>
                <input
                    ref={inputRef}
                    className="hidden"
                    name="archivoActa"
                    id="archivoActa"
                    type="file"
                    accept=".pdf"
                    onChange={e => {
                        const file = e.target.files[0]
                        if (file && file.type !== "application/pdf") {
                            alert("Por favor, suba un archivo PDF")
                            e.target.value = ""
                            setArchivo(null)
                            return
                        }
                        setArchivo(file)
                    }}
                />
                <div className="flex gap-2 justify-end mt-4">
                    <Boton variant="borderwhite" onClick={onClose}>Cancelar</Boton>
                    <Boton
                        variant="whitered"
                        disabled={!archivo}
                        onClick={() => {
                            onSubir(archivo)
                            setArchivo(null)
                            if (inputRef.current) inputRef.current.value = ""
                        }}
                    >
                        Subir nueva acta
                    </Boton>
                </div>
            </section>
        </main>
    )
}