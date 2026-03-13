import { File, Upload } from "lucide-react"
import { useRef, useState } from "react"
import Boton from "../Boton"
import { User } from "lucide-react"

export default function ModalSubirCorreccion({ isOpen, onClose, documento, onSubir, recomendaciones }) {
    const [archivo, setArchivo] = useState(null)
    const [dragTarget, setDragTarget] = useState(false)
    const inputRef = useRef(null)

    if (!isOpen || !documento) return null

    // Utilidad para mostrar info del archivo
    const getFileInfo = (file) => file ? `${file.name} (${(file.size / 1024).toFixed(2)} KB)` : null

    return (
        <main className="bg-black/50 backdrop-blur-md flex justify-center items-center fixed w-full h-full z-50 left-0 top-0">
            <section className="bg-white modal-animation max-w-xl w-full rounded-md p-6 space-y-2">
                <h6 className="font-bold text-lg">Subir corrección</h6>

                <div className="rounded-md border p-2 ">
                    <h6 className="font-bold">Observaciones de los jurados</h6>
                    <div className="flex flex-col gap-2 my-2">
                        {recomendaciones && recomendaciones.length > 0 &&
                            recomendaciones.map((jurado, idx) => (
                                <div key={idx} className="bg-gray-50 border rounded-md p-2 flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <User size={16} className="text-blue-400" />
                                        <span className="font-semibold">{jurado.nombreUsuario}</span>
                                        {typeof jurado.nota === "number" && (
                                            <strong className="border-rojo-mate text-rojo-mate bg-rojo-claro rounded-full border px-2 text-xs/tight">
                                                {jurado.nota}
                                            </strong>
                                        )}
                                    </div>
                                    {jurado.observaciones && (
                                        <div className="whitespace-pre-line max-h-20 overflow-y-auto text-xs mt-1">
                                            {jurado.observaciones}
                                        </div>
                                    )}

                                </div>
                            ))}
                    </div>
                </div>

                <div className="rounded-md border p-2">
                    <h6 className="font-bold">Documento original</h6>
                    <div className="flex justify-between items-center rounded-md border gap-2 my-2 p-2.5">
                        <div className="flex items-center gap-2">
                            <File size={20} className="text-blue-400" />
                            <span className="font-semibold">{documento.nombre}</span>
                        </div>
                        <a href={documento.url} target="_blank" className="text-blue-500 hover:underline text-xs" download>
                            Descargar
                        </a>
                    </div>
                </div>

                <p className="text-sm text-gray-600">
                    Antes de subir tu corrección, asegúrate que implementas todas las recomendaciones de los jurados.
                </p>

                <div>
                    <label
                        htmlFor="archivoCorreccion"
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
                                ? "Suelte aquí el archivo corregido"
                                : "Haga click para cargar el archivo o arrastre el archivo aquí"}
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
                        name="archivoCorreccion"
                        id="archivoCorreccion"
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
                </div>
                <div className="flex gap-2 justify-end mt-4">
                    <Boton variant="borderwhite" onClick={onClose}>Cancelar</Boton>
                    <Boton
                        variant="whitered"
                        disabled={!archivo}
                        onClick={() => onSubir(archivo)}
                    >
                        Subir Corrección
                    </Boton>
                </div>
            </section>
        </main>
    )
}