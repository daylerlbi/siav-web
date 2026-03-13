import { useEffect, useState } from "react"
import Boton from "../Boton"
import { File } from "lucide-react"
import useProject from "../../lib/hooks/useProject"
import ModalResubirActa from "./ModalResubirActa"
import { getBackendUrl } from "../../lib/controllers/endpoints"

export default function ConfirmarCompletarSustentacionModal({ sustentacionRealizada, estadoFase, acta, faseActual, documentos, isOpen, onConfirm, onCancel, jurados, onEditarSustentacion }) {
    const [requiereCorrecciones, setRequiereCorrecciones] = useState((!!sustentacionRealizada === true) && (estadoFase === "SIN_REVISAR" || estadoFase === "RECHAZADA"))
    const [retroalimentaciones, setRetroalimentaciones] = useState([])
    const [modalResubirActa, setModalResubirActa] = useState(false)
    const [actaAprobacion, setActaAprobacion] = useState(acta)
    const { sendDocuments, deleteDocumentos } = useProject()

    useEffect(() => {
        setRetroalimentaciones(
            jurados?.map(j => ({
                idSustentacion: j.idSustentacion,
                idUsuario: j.idUsuario,
                nombre: j.nombreUsuario,
                observaciones: j.observaciones || "",
                nota: j.nota ?? ""
            })) || []
        )


    }, [jurados])

    if (!isOpen) return null

    const backendUrl = getBackendUrl()
    const api_plantillas = `${backendUrl}/plantillas`

    return (
        <main className="bg-black/50 backdrop-blur-md flex justify-center items-center fixed w-full h-full z-40 left-0 top-0">
            <section className="bg-white modal-animation max-w-2xl w-full rounded-md p-6">
                <h6 className="text-lg font-semibold text-rojo-mate">
                    {!sustentacionRealizada ? "Confirmar completado de sustentación"
                        : (sustentacionRealizada && (estadoFase === "SIN_REVISAR" || estadoFase === "RECHAZADA")) ? "Esperar Correcciones del Estudiante"
                            : sustentacionRealizada && estadoFase === "EN_REVISION" ? "Validar Correcciones del Estudiante"
                                : "Sustentación completada"
                    }

                </h6>
                <p className="text-sm my-2">
                    {
                        !sustentacionRealizada ?
                            <>
                                ¿Estás seguro de que deseas marcar la sustentación como completada? <br />
                                <b>Opcional:</b> Puedes ingresar retroalimentación y nota de cada jurado.
                            </>
                            : (sustentacionRealizada && (estadoFase === "SIN_REVISAR" || estadoFase === "RECHAZADA")) ?
                                <>
                                    <b>El estudiante en este momento se encuentra realizando las correcciones.</b> <br />
                                    Espera a que el estudiante suba las correcciones y luego podrás validar nuevamente la sustentación.
                                </>
                                :
                                <>
                                    <b>El estudiante ha subido las correcciones solicitadas.</b> <br />
                                    Verifica que todas las correcciones estén desarrolladas para avanzar de fase.
                                </>
                    }
                </p>

                {(faseActual === 4 || faseActual === 8) && (!!sustentacionRealizada === false) && (
                    <div className="my-2">
                        <div className="flex justify-between items-center gap-2">
                            <h6 className="font-bold select-none mb-1">
                                {faseActual === 4 ? "Subir acta de aprobación del anteproyecto (PDF)" :
                                    "Subir acta de sustentación de trabajo de grado"}
                            </h6>

                            <div className="flex items-center">
                                {
                                    faseActual === 8 &&
                                    <a
                                        className="text-blue-500 hover:underline translate-x-8"
                                        rel="noopener noreferrer"
                                        href={`${api_plantillas}/ACTA-ORIGINAL.docx`}
                                        target="_blank"
                                        download
                                    >
                                        <Boton variant={"whitered"} customClassName="w-fit scale-75">
                                            Descargar Original
                                        </Boton>
                                    </a>
                                }
                                <a
                                    className="text-blue-500 hover:underline"
                                    rel="noopener noreferrer"
                                    href={`${api_plantillas}/${faseActual === 4 ? "APROBACIÓN-ANTEPROYECTO-MAESTRÍA-TIC.docx"
                                        : "ACTA-BORRADOR.docx"}`}
                                    target="_blank"
                                    download
                                >
                                    <Boton variant={"whitered"} customClassName="w-fit scale-75">
                                        Descargar Borrador
                                    </Boton>
                                </a>
                            </div>
                        </div>
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault()
                                const file = e.target.actaAprobacionArchivo.files[0]
                                if (!file) return
                                // Elimina acta anterior si existe (por seguridad)
                                const anterior = actaAprobacion
                                if (anterior.length !== 0) await deleteDocumentos(actaAprobacion[0].id)
                                const newActa = await sendDocuments(
                                    documentos[0]?.idProyecto,
                                    faseActual === 4 ? "ACTAAPROBACION" : "ACTABORRADOR",
                                    "Acta de aprobación del anteproyecto",
                                    file
                                )
                                setActaAprobacion([newActa])
                                e.target.reset()
                            }}
                            className="flex gap-2 items-center"
                        >
                            <input
                                type="file"
                                name="actaAprobacionArchivo"
                                className="border rounded p-2 text-xs"
                                accept=".pdf"
                                required
                            />
                            <Boton type="submit" variant="borderwhite" customClassName="w-fit !text-xs">
                                Subir Acta
                            </Boton>
                        </form>
                    </div>
                )}

                {(faseActual === 4 || faseActual === 8) && actaAprobacion.length !== 0 && (
                    <div className="mb-2">
                        <div className="flex justify-between items-center gap-2">
                            <h6 className="font-bold select-none mb-1">
                                {faseActual === 4 ? "Acta de aprobación del anteproyecto (PDF)" :
                                    "Acta de sustentación de trabajo de grado (PDF)"}
                            </h6>

                            {
                                faseActual === 8 && sustentacionRealizada &&
                                <a
                                    className="text-blue-500 hover:underline"
                                    rel="noopener noreferrer"
                                    href={`${api_plantillas}/ACTA-ORIGINAL.docx`}
                                    target="_blank"
                                    download
                                >
                                    <Boton variant={"whitered"} customClassName="w-fit scale-75">
                                        Descargar Original
                                    </Boton>
                                </a>
                            }
                        </div>
                        <div className="flex justify-between items-center gap-2 rounded-md border text-xs p-2">
                            <div className="flex items-center gap-2">
                                <File size={16} className="text-blue-400" />
                                {actaAprobacion[0].nombre}
                            </div>
                            <div className="flex items-center gap-2">
                                {
                                    estadoFase !== "ACEPTADA" &&
                                    <button
                                        type="button"
                                        className="border-rojo-institucional text-rojo-mate bg-rojo-claro
                                    text-xs/tight rounded-md border w-fit px-2 py-0.5"
                                        onClick={() => setModalResubirActa(true)}
                                    >
                                        Resubir Acta
                                    </button>
                                }
                                <a
                                    href={actaAprobacion[0].url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                >
                                    Descargar
                                </a>
                            </div>
                        </div>
                        <ModalResubirActa
                            isOpen={modalResubirActa}
                            acta={actaAprobacion[0]}
                            onClose={() => setModalResubirActa(false)}
                            onSubir={async (archivo) => {
                                await deleteDocumentos(actaAprobacion[0].id)
                                const newActa = await sendDocuments(
                                    documentos[0]?.idProyecto,
                                    "ACTAAPROBACION",
                                    "Acta de aprobación del anteproyecto",
                                    archivo
                                )
                                setActaAprobacion([newActa])
                                setModalResubirActa(false)
                            }}
                        />
                    </div>
                )}

                {documentos && documentos.length > 0 && (
                    <div className="mb-2">
                        <label className="font-semibold">Documentos de sustentación</label>
                        <ul className="flex flex-col text-xs gap-2 mt-2">
                            {
                                documentos.map(doc =>
                                    <li key={doc.id} className="flex justify-between items-center gap-2 rounded-md border p-2">
                                        <div className="flex items-center gap-2">
                                            <File size={16} className="text-green-500" />
                                            {doc.nombre}
                                        </div>
                                        <a
                                            href={doc.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline"
                                        >
                                            Descargar
                                        </a>
                                    </li>
                                )
                            }
                        </ul>
                    </div>
                )}

                <label className="font-semibold">Retroalimentación de jurados</label>
                <div className="bg-gray-50 border rounded-md space-y-2 p-2 my-2">
                    {retroalimentaciones.map((r, idx) => (
                        <div key={r.idUsuario} className="text-sm">
                            <label className="font-semibold">{r.nombre}</label>

                            <div className="flex flex-col items-start my-2">
                                <label className="text-xs font-semibold">Nota:</label>
                                <input
                                    type="number"
                                    min={0}
                                    max={5}
                                    step={0.1}
                                    className="border rounded px-2 py-1 w-20"
                                    value={r.nota}
                                    onChange={e => {
                                        let value = e.target.value
                                        if (value === "") {
                                            const newArr = [...retroalimentaciones]
                                            newArr[idx].nota = ""
                                            setRetroalimentaciones(newArr)
                                            return
                                        }
                                        let num = parseFloat(value)
                                        if (isNaN(num)) num = 0
                                        if (num < 0) num = 0
                                        if (num > 5) num = 5
                                        const newArr = [...retroalimentaciones]
                                        newArr[idx].nota = num
                                        setRetroalimentaciones(newArr)
                                    }}
                                    placeholder="0.0"
                                />
                            </div>

                            <label className="text-xs font-semibold">Retroalimentación:</label>
                            <textarea
                                className="border rounded px-3 py-2 w-full resize-none"
                                rows={2}
                                value={r.observaciones}
                                onChange={e => {
                                    const newArr = [...retroalimentaciones]
                                    newArr[idx].observaciones = e.target.value
                                    setRetroalimentaciones(newArr)
                                }}
                                placeholder="Retroalimentación (opcional)"
                            />
                        </div>
                    ))}
                </div>
                {
                    ((!!sustentacionRealizada === false) || estadoFase === "EN_REVISION") &&
                    <div className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            id="requiere-correcciones"
                            checked={requiereCorrecciones}
                            onChange={e => setRequiereCorrecciones(e.target.checked)}
                        />
                        <label htmlFor="requiere-correcciones" className="select-none">
                            El estudiante debe subir correcciones
                        </label>
                    </div>
                }

                <div className="flex items-stretch gap-2 mt-4">
                    <Boton type="button" variant="borderwhite" onClick={onCancel}>
                        Cancelar
                    </Boton>
                    {(onEditarSustentacion && (!!sustentacionRealizada === false)) && (
                        <Boton
                            type="button"
                            variant="whitered"
                            onClick={onEditarSustentacion}
                        >
                            Editar sustentación
                        </Boton>
                    )}
                    <Boton
                        type="button"
                        variant="whitered"
                        disabled={faseActual === 4 && actaAprobacion.length === 0}
                        onClick={() => onConfirm({ retroalimentaciones, requiereCorrecciones })}
                    >
                        {(!!sustentacionRealizada === false) ? "Marcar como completada" : "Guardar cambios"}
                    </Boton>
                </div>
            </section>
        </main >
    )
}