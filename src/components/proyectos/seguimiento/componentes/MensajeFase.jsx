export default function MensajeFase({ estadoRevision, mensaje }) {
    const mensajeSinRevisar = "Esta fase ha sido habilitada para que puedas trabajar en ella, una vez que la termines, por favor envíala para revisión."
    const mensajeEnRevision = "Esta fase ha sido enviada para revisión, por favor espera la respuesta del administrador para continuar con tu proyecto."
    const mensajeRechazado = "Esta fase ha sido rechazada por un administrador, por favor revisa los comentarios y vuelve a enviarla para revisión."
    const mensajeAceptada = "Esta fase ha sido aceptada por un administrador, puedes continuar trabajando en tu proyecto."
    return (
        <div
            style={
                {
                    backgroundColor:
                        (estadoRevision === null || estadoRevision === "SIN_REVISAR") ? "#e9edfc" :
                            (estadoRevision === "EN_REVISION") ? "#fffaee" :
                                (estadoRevision === "RECHAZADA") ? "#fef2f2" :
                                    (estadoRevision === "ACEPTADA") && "#ecfdf5",
                    color:
                        (estadoRevision === null || estadoRevision === "SIN_REVISAR") ? "#3b64cf" :
                            (estadoRevision === "EN_REVISION") ? "#f79e08" :
                                (estadoRevision === "RECHAZADA") ? "#f44545" :
                                    (estadoRevision === "ACEPTADA") && "#0fba80",
                    borderColor:
                        (estadoRevision === null || estadoRevision === "SIN_REVISAR") ? "#3b64cf" :
                            (estadoRevision === "EN_REVISION") ? "#f6c33b" :
                                (estadoRevision === "RECHAZADA") ? "#f44545" :
                                    (estadoRevision === "ACEPTADA") && "#0fba80"

                }
            }
            className="rounded-md border mt-2.5 p-4">
            <strong className="text-lg">
                {(estadoRevision === null || estadoRevision === "SIN_REVISAR") ? "Fase sin revisión" :
                    (estadoRevision === "EN_REVISION") ? "Fase en revisión" :
                        (estadoRevision === "RECHAZADA") ? "Fase Rechazada" :
                            (estadoRevision === "ACEPTADA") && "Fase Aceptada"}
            </strong>
            <p className="text-sm">
                {(estadoRevision === null || estadoRevision === "SIN_REVISAR") ? mensajeSinRevisar :
                    (estadoRevision === "EN_REVISION") ? mensajeEnRevision :
                        (estadoRevision === "RECHAZADA") ? (mensaje === null || mensaje === "") ? mensajeRechazado : mensaje :
                            (estadoRevision === "ACEPTADA") && mensajeAceptada}

            </p>
        </ div>
    )
}