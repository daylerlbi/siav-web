export default function EstadoRevision({ estadoRevision, faseActual = "" }) {
    return (
        <span style={
            {
                backgroundColor:
                    faseActual === 0 ? "#f3f0ff" :
                    (estadoRevision === null || estadoRevision === "SIN_REVISAR") ? "#e9edfc" :
                        (estadoRevision === "EN_REVISION") ? "#fffaee" :
                            (estadoRevision === "RECHAZADA") ? "#fef2f2" :
                                (estadoRevision === "ACEPTADA") && "#ecfdf5",
                color:
                    faseActual === 0 ? "#7c3aed" :
                    (estadoRevision === null || estadoRevision === "SIN_REVISAR") ? "#3b64cf" :
                        (estadoRevision === "EN_REVISION") ? "#f79e08" :
                            (estadoRevision === "RECHAZADA") ? "#f44545" :
                                (estadoRevision === "ACEPTADA") && "#0fba80",
                borderColor:
                    faseActual === 0 ? "#7c3aed" :
                    (estadoRevision === null || estadoRevision === "SIN_REVISAR") ? "#3b64cf" :
                        (estadoRevision === "EN_REVISION") ? "#f6c33b" :
                            (estadoRevision === "RECHAZADA") ? "#f44545" :
                                (estadoRevision === "ACEPTADA") && "#0fba80"
            }
        }

            className="text-sm/tight font-bold rounded-full border px-2">
            {
                faseActual === 0 ? "Terminado" :
                (estadoRevision === null || estadoRevision === "SIN_REVISAR") ? `${faseActual === 4 || faseActual === 8 ? "Sustentación" : "En edición"}` :
                    (estadoRevision === "EN_REVISION") ? "Por revisar" :
                        (estadoRevision === "RECHAZADA") ? "Rechazado" :
                            (estadoRevision === "ACEPTADA") && "Aprobado"
            }
        </span>
    )
}