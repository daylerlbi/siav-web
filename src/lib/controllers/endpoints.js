const backendUrl = import.meta.env.VITE_BACKEND_URL
const clientId = import.meta.env.VITE_CLIENT_ID_GOOGLE
const moodleUrl = import.meta.env.VITE_MOODLE_URL
const moodleToken = import.meta.env.VITE_MOODLE_TOKEN

export const getBackendUrl = () => {
    if (!backendUrl) throw new Error("Falta la variable VITE_BACKEND_URL en el entorno")
    return backendUrl
}

export const getClientId = () => {
    if (!clientId) throw new Error("Falta la variable VITE_CLIENT_ID_GOOGLE en el entorno")
    return clientId
}

export const getMoodleUrl = () => {
    if (!moodleUrl) throw new Error("Falta la variable VITE_MOODLE_URL en el entorno")
    return moodleUrl
}

export const getMoodleToken = () => {
    if (!moodleToken) throw new Error("Falta la variable VITE_MOODLE_TOKEN en el entorno")
    return moodleToken
}