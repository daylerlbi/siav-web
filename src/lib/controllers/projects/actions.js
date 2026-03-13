import axios from "axios"
import { getBackendUrl } from "../endpoints"

const backendUrl = getBackendUrl()

export const crearProyecto = async ({ body, googleToken }) => {
   try {
      const response = await axios.post(`${backendUrl}/proyectos`, body,
         { headers: { "Content-Type": "application/json", Authorization: `Bearer ${googleToken}` } })

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

export const listarProyectos = async ({ googleToken }) => {
   try {
      const response = await axios.get(`${backendUrl}/proyectos`,
         { headers: { Authorization: `Bearer ${googleToken}` } })

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

export const obtenerProyecto = async ({ googleToken }) => {
   try {
      const response = await axios.get(`${backendUrl}/proyectos/proyecto-estudiante`,
         { headers: { Authorization: `Bearer ${googleToken}` } })

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

export const obtenerProyectoEspecifico = async ({ id, googleToken }) => {
   try {
      const response = await axios.get(`${backendUrl}/proyectos/${id}`,
         { headers: { Authorization: `Bearer ${googleToken}` } })

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

export const obtenerEstadoProyecto = async ({ googleToken }) => {
   try {
      const response = await axios.get(`${backendUrl}/dashboard`,
         { headers: { Authorization: `Bearer ${googleToken}` } })

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

export const actualizarProyecto = async ({ body, id, googleToken }) => {
   try {
      const response = await axios.put(`${backendUrl}/proyectos/${id}`, body,
         { headers: { "Content-Type": "application/json", Authorization: `Bearer ${googleToken}` } })

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

export const actualizarProgreso = async ({ body, id, googleToken }) => {
   try {
      const response = await axios.put(`${backendUrl}/proyectos/${id}`, body,
         { headers: { "Content-Type": "application/json", Authorization: `Bearer ${googleToken}` } })

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

export const asignarDefinitiva = async ({ id, googleToken }) => {
   try {
      const response = await axios.get(`${backendUrl}/proyectos/definitiva?idProyecto=${id}&tipoSustentacion=TESIS`,
         { headers: { "Content-Type": "application/json", Authorization: `Bearer ${googleToken}` } })

      if (response.status !== 200) throw new Error('Error al ASIGNAR la nota definitiva.')

      const data = await response.json()
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

export const listarGrupos = async ({ googleToken }) => {
   try {
      const response = await axios.get(`${backendUrl}/proyectos/grupos/lineas-investigacion`,
         { headers: { Authorization: `Bearer ${googleToken}` } }
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

export const listarDocentes = async ({ googleToken }) => {
   try {
      const response = await axios.get(`${backendUrl}/usuarios/rol/2`,
         { headers: { Authorization: `Bearer ${googleToken}` } }
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

export const listarEstudiantes = async ({ googleToken }) => {
   try {
      const response = await axios.get(`${backendUrl}/usuarios/rol/1`,
         { headers: { Authorization: `Bearer ${googleToken}` } }
      )

      if (response.status !== 200) throw new Error('Error al LISTAR los estudiantes.')
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

export const listarSustentaciones = async ({ googleToken, idProyecto = "" }) => {
   try {
      const response = await axios.get(`${backendUrl}/sustentaciones?idProyecto=${idProyecto}`,
         { headers: { Authorization: `Bearer ${googleToken}` } }
      )

      if (response.status !== 200) throw new Error('Error al LISTAR las sustentaciones.')
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

export const obtenerDocumentos = async ({ id, tipoDoc, googleToken }) => {
   try {
      const response = await axios.get(`${backendUrl}/documentos/proyecto/${id}?tipoDocumento=${tipoDoc}`,
         { headers: { Authorization: `Bearer ${googleToken}` } }
      )

      if (response.status !== 200) throw new Error('Error al OBTENER los documentos.')
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

export const enviarDocumentos = async ({ id, tag, tipoDoc, googleToken, archivo }) => {
   try {
      const formData = new FormData()
      formData.append("tag", tag)
      formData.append("tipoDocumento", tipoDoc)
      formData.append("archivo", archivo)

      const response = await axios.post(`${backendUrl}/documentos/${id}`, formData,
         { headers: { Authorization: `Bearer ${googleToken}` } }
      )

      if (response.status !== 200) throw new Error('Error al ENVIAR los documentos.')
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

export const eliminarDocumentos = async ({ id, googleToken }) => {
   try {
      const response = await axios.delete(`${backendUrl}/documentos/${id}`,
         { headers: { Authorization: `Bearer ${googleToken}` } }
      )

      if (response.status !== 200) throw new Error('Error al ELIMINAR los documentos.')
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

export const enviarRetroalimentacion = async ({ body, googleToken }) => {
   try {
      const response = await axios.post(`${backendUrl}/documentos/retroalimentacion`, body,
         { headers: { Authorization: `Bearer ${googleToken}` } }
      )

      if (response.status !== 200) throw new Error('Error al ENVIAR una retroalimentación.')
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

export const editarRetroalimentacion = async ({ body, googleToken }) => {
   try {
      const response = await axios.put(`${backendUrl}/documentos/retroalimentacion`, body,
         { headers: { Authorization: `Bearer ${googleToken}` } }
      )

      if (response.status !== 200) throw new Error('Error al EDITAR una retroalimentación.')
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

export const eliminarRetroalimentacion = async ({ id, googleToken }) => {
   try {
      const response = await axios.delete(`${backendUrl}/documentos/retroalimentacion/${id}`,
         { headers: { Authorization: `Bearer ${googleToken}` } }
      )

      if (response.status !== 200) throw new Error('Error al ELIMINAR una retroalimentación.')
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

export const validarFase = async ({ id, body, googleToken }) => {
   try {
      const response = await axios.put(`${backendUrl}/proyectos/validar/${id}`,
         body, { headers: { Authorization: `Bearer ${googleToken}` } }
      )

      if (response.status !== 200) throw new Error('Error al VALIDAR una fase.')
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
