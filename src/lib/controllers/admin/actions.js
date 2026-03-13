import axios from "axios"
import { getBackendUrl } from "../endpoints"

const backendUrl = getBackendUrl()

export const listarProyectos = async ({ accessToken, lineaId = "", grupoId = "" }) => {
   try {
      const params = [
         `lineaId=${lineaId}`,
         `grupoId=${grupoId}`
      ].join("&")
      const response = await axios.get(
         `${backendUrl}/proyectos?${params}`,
         { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      if (response.status !== 200) throw new Error('Error al LISTAR los proyectos.')
      return response.data
   } catch (error) {
      throw new Error(error ?? {
         httpStatus: "INTERNAL_SERVER_ERROR",
         reason: "Internal Server Error",
         message: "Oops, algo salió mal, por favor intenta más tarde.",
         httpStatusCode: 500
      })
   }
}

export const eliminarProyecto = async ({ accessToken, idProyecto }) => {
   try {
      const response = await axios.delete(`${backendUrl}/proyectos/${idProyecto}`,
         { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      if (response.status !== 200) throw new Error('Error al ELIMINAR un proyecto.')
      return response.data
   } catch (error) {
      throw new Error(error ?? {
         httpStatus: "INTERNAL_SERVER_ERROR",
         reason: "Internal Server Error",
         message: "Oops, algo salió mal, por favor intenta más tarde.",
         httpStatusCode: 500
      })
   }
}

export const listarGrupos = async ({ accessToken }) => {
   try {
      const response = await axios.get(`${backendUrl}/proyectos/grupos/lineas-investigacion`,
         { headers: { Authorization: `Bearer ${accessToken}` } }
      )

      if (response.status !== 200) throw new Error('Error al LISTAR los grupos.')
      const data = await response.data
      return data
   } catch (error) {
      throw new Error(error ?? {
         httpStatus: "INTERNAL_SERVER_ERROR",
         reason: "Internal Server Error",
         message: "Oops, algo salió mal, por favor intenta más tarde.",
         httpStatusCode: 500
      })
   }
}

export const listarDocentes = async ({ accessToken }) => {
   try {
      const response = await axios.get(`${backendUrl}/usuarios/rol/2`,
         { headers: { Authorization: `Bearer ${accessToken}` } }
      )

      if (response.status !== 200) throw new Error('Error al LISTAR los docentes.')
      const data = await response.data
      return data
   } catch (error) {
      throw new Error(error ?? {
         httpStatus: "INTERNAL_SERVER_ERROR",
         reason: "Internal Server Error",
         message: "Oops, algo salió mal, por favor intenta más tarde.",
         httpStatusCode: 500
      })
   }
}

export const actualizarProgreso = async ({ body, id, accessToken }) => {
   try {
      const response = await axios.put(`${backendUrl}/proyectos/${id}`, body,
         { headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` } })

      return response.data
   } catch (error) {
      throw new Error(error ?? {
         httpStatus: "INTERNAL_SERVER_ERROR",
         reason: "Internal Server Error",
         message: "Oops, algo salió mal, por favor intenta más tarde.",
         httpStatusCode: 500
      })
   }
}

export const setJurados = async ({ accessToken, body }) => {
   try {
      const response = await axios.post(`${backendUrl}/sustentaciones/evaluador`, body,
         { headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` } })

      return response.data
   } catch (error) {
      throw new Error(error ?? {
         httpStatus: "INTERNAL_SERVER_ERROR",
         reason: "Internal Server Error",
         message: "Oops, algo salió mal, por favor intenta más tarde.",
         httpStatusCode: 500
      })
   }
}

export const setDirectores = async ({ accessToken, body }) => {
   try {
      const response = await axios.post(`${backendUrl}/proyectos/asignar-usuario`, body,
         { headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` } })

      return response.data
   } catch (error) {
      throw new Error(error ?? {
         httpStatus: "INTERNAL_SERVER_ERROR",
         reason: "Internal Server Error",
         message: "Oops, algo salió mal, por favor intenta más tarde.",
         httpStatusCode: 500
      })
   }
}

export const crearSustentacion = async ({ body, accessToken }) => {
   try {
      const response = await axios.post(`${backendUrl}/sustentaciones`, body,
         { headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` } })

      return response.data
   } catch (error) {
      throw new Error(error ?? {
         httpStatus: "INTERNAL_SERVER_ERROR",
         reason: "Internal Server Error",
         message: "Oops, algo salió mal, por favor intenta más tarde.",
         httpStatusCode: 500
      })
   }
}

export const evaluarSustentacion = async ({ body, accessToken }) => {
   try {
      const response = await axios.put(`${backendUrl}/sustentaciones/evaluar-sustentacion`, body,
         { headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` } })

      return response.data
   } catch (error) {
      throw new Error(error ?? {
         httpStatus: "INTERNAL_SERVER_ERROR",
         reason: "Internal Server Error",
         message: "Oops, algo salió mal, por favor intenta más tarde.",
         httpStatusCode: 500
      })
   }
}

export const importarProyecto = async ({ body, accessToken }) => {
   try {
      const response = await axios.post(`${backendUrl}/proyectos/importar`,
         body, { headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` } })

      return response.data
   } catch (error) {
      throw new Error(error ?? {
         httpStatus: "INTERNAL_SERVER_ERROR",
         reason: "Internal Server Error",
         message: "Oops, algo salió mal, por favor intenta más tarde.",
         httpStatusCode: 500
      })
   }
}

export const crearGrupo = async ({ body, accessToken }) => {
   try {
      const response = await axios.post(`${backendUrl}/grupos-lineas/grupo`,
         body, { headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` } })

      return response.data
   } catch (error) {
      throw new Error(error ?? {
         httpStatus: "INTERNAL_SERVER_ERROR",
         reason: "Internal Server Error",
         message: "Oops, algo salió mal, por favor intenta más tarde.",
         httpStatusCode: 500
      })
   }
}


export const editarGrupo = async ({ body, id, accessToken }) => {
   try {
      const response = await axios.put(`${backendUrl}/grupos-lineas/grupo/${id}`,
         body, { headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` } })

      return response.data
   } catch (error) {
      throw new Error(error ?? {
         httpStatus: "INTERNAL_SERVER_ERROR",
         reason: "Internal Server Error",
         message: "Oops, algo salió mal, por favor intenta más tarde.",
         httpStatusCode: 500
      })
   }
}


export const eliminarGrupo = async ({ id, accessToken }) => {
   try {
      const response = await axios.delete(`${backendUrl}/grupos-lineas/grupo/${id}`,
         { headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` } })

      return response.data
   } catch (error) {
      throw new Error(error ?? {
         httpStatus: "INTERNAL_SERVER_ERROR",
         reason: "Internal Server Error",
         message: "Oops, algo salió mal, por favor intenta más tarde.",
         httpStatusCode: 500
      })
   }
}

export const crearLinea = async ({ body, accessToken }) => {
   try {
      const response = await axios.post(`${backendUrl}/grupos-lineas/linea`,
         body, { headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` } })

      return response.data
   } catch (error) {
      throw new Error(error ?? {
         httpStatus: "INTERNAL_SERVER_ERROR",
         reason: "Internal Server Error",
         message: "Oops, algo salió mal, por favor intenta más tarde.",
         httpStatusCode: 500
      })
   }
}


export const editarLinea = async ({ body, id, accessToken }) => {
   try {
      const response = await axios.put(`${backendUrl}/grupos-lineas/linea/${id}`,
         body, { headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` } })

      return response.data
   } catch (error) {
      throw new Error(error ?? {
         httpStatus: "INTERNAL_SERVER_ERROR",
         reason: "Internal Server Error",
         message: "Oops, algo salió mal, por favor intenta más tarde.",
         httpStatusCode: 500
      })
   }
}


export const eliminarLinea = async ({ id, accessToken }) => {
   try {
      const response = await axios.delete(`${backendUrl}/grupos-lineas/linea/${id}`,
         { headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` } })

      return response.data
   } catch (error) {
      throw new Error(error ?? {
         httpStatus: "INTERNAL_SERVER_ERROR",
         reason: "Internal Server Error",
         message: "Oops, algo salió mal, por favor intenta más tarde.",
         httpStatusCode: 500
      })
   }
}

export const listarProgramas = async ({ body, accessToken }) => {
   try {
      const response = await axios.get(`${backendUrl}/programas/listar`,
         body, { headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` } })

      return response.data
   } catch (error) {
      throw new Error(error ?? {
         httpStatus: "INTERNAL_SERVER_ERROR",
         reason: "Internal Server Error",
         message: "Oops, algo salió mal, por favor intenta más tarde.",
         httpStatusCode: 500
      })
   }
}

export const importarDocumentos = async ({ idProyecto, tag, tipoDoc, accessToken, archivos }) => {
   try {
      const formData = new FormData()
      // tags y tipos de documento como listas separadas por coma
      formData.append("tags", Array.isArray(tag) ? tag.join(",") : tag)
      formData.append("tipoDocumentos", Array.isArray(tipoDoc) ? tipoDoc.join(",") : tipoDoc)
      // Agrega todos los archivos individualmente
      if (archivos && archivos.length > 0) {
         Array.from(archivos).forEach(file => {
            formData.append("archivos", file)
         })
      }

      const response = await axios.post(
         `${backendUrl}/documentos/importar-a-proyecto/${idProyecto}`,
         formData, { headers: { Authorization: `Bearer ${accessToken}` } }
      )

      if (response.status !== 200) throw new Error('Error al IMPORTAR los documentos.')
      const data = await response.data
      return data
   } catch (error) {
      throw new Error(error ?? {
         httpStatus: "INTERNAL_SERVER_ERROR",
         reason: "Internal Server Error",
         message: "Oops, algo salió mal, por favor intenta más tarde.",
         httpStatusCode: 500
      })
   }
}

export const editarSustentacion = async ({ body, id, accessToken }) => {
   try {
      const response = await axios.put(`${backendUrl}/sustentaciones/${id}`,
         body, { headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` } })

      return response.data
   } catch (error) {
      throw new Error(error ?? {
         httpStatus: "INTERNAL_SERVER_ERROR",
         reason: "Internal Server Error",
         message: "Oops, algo salió mal, por favor intenta más tarde.",
         httpStatusCode: 500
      })
   }
}

export const completarSustentacion = async ({ id, accessToken }) => {
   try {
      const response = await axios.post(
         `${backendUrl}/sustentaciones/realizada/${id}`,
         {},
         { headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` } }
      )

      return response.data
   } catch (error) {
      throw new Error(error ?? {
         httpStatus: "INTERNAL_SERVER_ERROR",
         reason: "Internal Server Error",
         message: "Oops, algo salió mal, por favor intenta más tarde.",
         httpStatusCode: 500
      })
   }
}