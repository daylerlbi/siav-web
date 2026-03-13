import { useState } from "react"
import { Circle } from "lucide-react"
import Fase_1 from "../proyectos/seguimiento/fases/Fase_1"
import Fase_2 from "../proyectos/seguimiento/fases/Fase_2"
import Fase_3 from "../proyectos/seguimiento/fases/Fase_3"
import Fase_4 from "../proyectos/seguimiento/fases/Fase_4"
import Fase_5 from "../proyectos/seguimiento/fases/Fase_5"
import Fase_6 from "../proyectos/seguimiento/fases/Fase_6"
import Fase_7 from "../proyectos/seguimiento/fases/Fase_7"
import Fase_8 from "../proyectos/seguimiento/fases/Fase_8"
import Fase_9 from "../proyectos/seguimiento/fases/Fase_9"
import { useRef } from "react"
import { useEffect } from "react"
import { XIcon } from "lucide-react"
import Boton from "../Boton"
import useProject from "../../lib/hooks/useProject"
import CustomSelect from "../CustomSelect"
import ConfirmarRevisionEstadoModal from "./fasesRevision/ConfirmarRevisionEstadoModal"

const fasesData = [
    { id: 1, title: "Fase 1", component: Fase_1 },
    { id: 2, title: "Fase 2", component: Fase_2 },
    { id: 3, title: "Fase 3", component: Fase_3 },
    { id: 4, title: "Fase 4", component: Fase_4 },
    { id: 5, title: "Fase 5", component: Fase_5 },
    { id: 6, title: "Fase 6", component: Fase_6 },
    { id: 7, title: "Fase 7", component: Fase_7 },
    { id: 8, title: "Fase 8", component: Fase_8 },
]

function getEstadoRevisionColor(estadoRevision) {
    if (estadoRevision === null || estadoRevision === "SIN_REVISAR") return "#3b8ee4"
    if (estadoRevision === "EN_REVISION") return "#f79e08"
    if (estadoRevision === "RECHAZADA") return "#f44545"
    if (estadoRevision === "ACEPTADA" || estadoRevision === "APROBADA") return "#0fba80"
    return "#b0b0b07f"
}

export default function RevisarFaseModal({ proyecto, isOpen, onClose }) {
    const { getDocuments } = useProject()
    const [hasActaVB, setHasActaVB] = useState(false)

    useEffect(() => {
        const fetchActa = async () => {
            const actas = await getDocuments(proyecto.id, "ACTAVB")
            setHasActaVB(Array.isArray(actas) && actas.length > 0)
        }
        if (proyecto?.id && proyecto.estadoActual === 6) fetchActa()
    }, [proyecto])

    const isFase6 = proyecto.estadoActual === 6

    const puedeAprobarFase6 = hasActaVB && proyecto.objetivosEspecificos.every(obj =>
        (obj.avanceReportado === 100 && obj.evaluacion?.director === true && obj.evaluacion?.codirector === true)
    )

    const estadoRevisionOptions =
        (!puedeAprobarFase6 && isFase6) ? [{ id: "RECHAZADA", value: "Rechazar fase" }] :
            (puedeAprobarFase6 || !isFase6) && [{ id: "ACEPTADA", value: "Aprobar fase" }, { id: "RECHAZADA", value: "Rechazar fase" }]

    if (!isOpen || !proyecto) return null
    const [currentFase, setCurrentFase] = useState(proyecto.estadoActual)
    const [showConfirmModal, setShowConfirmModal] = useState(false)
    const [estadoRevision, setEstadoRevision] = useState("")
    const [comentario, setComentario] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const { setReviewState } = useProject()

    const FaseComponent = fasesData.find(f => f.id === currentFase)?.component

    const handleValidar = async () => {
        setError("")
        if (!estadoRevision) {
            setError("Selecciona un estado de revisión.")
            return
        }
        if (estadoRevision === "RECHAZADA" && !comentario.trim()) {
            setError("Debes ingresar un comentario para rechazar la fase.")
            return
        }
        setLoading(true)
        const body = {
            estadoRevision: estadoRevision,
            comentarioRevision: comentario.trim()
        }
        await setReviewState(proyecto.id, body)
        setLoading(false)
        onClose()


        window.location.reload()
    }

    return (
        <>
            <main className="bg-black/50 backdrop-blur-md flex justify-center items-center fixed w-full h-full z-50 left-0 top-0">
                <section className="bg-white relative modal-animation max-w-6xl w-full rounded-md p-6">
                    <div className="bg-white">
                        <div className="flex justify-between items-center pb-2">
                            <h2 className="font-bold text-2xl mb-2">Revisión de Fases</h2>
                            <XIcon onClick={onClose} className="hover:text-red-500 transition-colors cursor-pointer" />
                        </div>

                        {/* Línea de fases */}
                        <div className="flex justify-between items-center mb-6">
                            {fasesData.map(fase => {
                                const isFuture = fase.id > proyecto.estadoActual
                                const isActual = fase.id === currentFase
                                const circleColor = isActual
                                    ? getEstadoRevisionColor(proyecto.estadoRevision)
                                    : (fase.id < proyecto.estadoActual ? "#0fba80" : "#ffffff")
                                return (
                                    <button
                                        key={fase.id}
                                        className={`flex flex-col items-center ${isFuture ? "opacity-50 cursor-not-allowed" : ""}`}
                                        onClick={() => !isFuture && setCurrentFase(fase.id)}
                                        disabled={isFuture}
                                        type="button"
                                    >
                                        <Circle
                                            className="stroke-[0.75]"
                                            style={{
                                                fill: circleColor,
                                                stroke: isFuture ? "#c7c8c9" : "#262626"
                                            }}
                                        />
                                        <span className={`${isFuture ? "text-[#c7c8c9]" : ""} text-xs font-medium`}>
                                            {fase.title}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                    {/* Contenido de la fase */}
                    <div className="bg-gray-50 overflow-y-auto rounded-md max-h-[400px] p-4">
                        {FaseComponent && <FaseComponent project={proyecto} adminView />}
                    </div>

                    <div className="bg-white pt-6 space-y-3 text-sm">
                        <div className="flex flex-col gap-2">
                            <CustomSelect
                                label={"Actualizar estado de la fase"}
                                options={estadoRevisionOptions}
                                defaultValue={estadoRevisionOptions.find(opt => opt.id === estadoRevision) || { value: "Selecciona un estado" }}
                                action={opt => setEstadoRevision(opt.id)}
                                className="border rounded px-3 py-2 flex justify-between items-center"
                            />
                        </div>
                        {estadoRevision === "RECHAZADA" && (
                            <div className="flex flex-col gap-2">
                                <label className="font-semibold">Comentario (obligatorio)</label>
                                <textarea
                                    className="border rounded px-3 py-2 resize-none"
                                    rows={3}
                                    value={comentario}
                                    onChange={e => setComentario(e.target.value)}
                                    placeholder="Explica por qué rechazas la fase..."
                                    required
                                />
                            </div>
                        )}
                        {error && <div className="text-red-600 text-sm">{error}</div>}
                        <Boton
                            variant={"borderwhite"}
                            customClassName="w-full"
                            onClick={() => setShowConfirmModal(true)}
                            disabled={loading || !estadoRevision || (estadoRevision === "RECHAZADA" && !comentario.trim())}
                        >
                            {loading ? "Enviando..." : "Enviar Validación"}
                        </Boton>
                    </div>
                </section>
            </main>
            <ConfirmarRevisionEstadoModal
                proyecto={proyecto}
                fase={currentFase}
                estado={estadoRevisionOptions.find(opt => opt.id === estadoRevision)?.value || ""}
                isOpen={showConfirmModal}
                onCancel={() => setShowConfirmModal(false)}
                onConfirm={async () => {
                    setShowConfirmModal(false)
                    await handleValidar()
                }}
            />
        </>
    )
}