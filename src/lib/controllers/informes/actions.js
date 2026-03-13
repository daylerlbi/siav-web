import axios from "axios"
import { getBackendUrl } from "../endpoints"

const backendUrl = getBackendUrl()

export const obtenerInformes = async ({ googleToken }) => {
   try {
      const response = await axios.get(`${backendUrl}/coloquios/estudiante`,
         { headers: { Authorization: `Bearer ${googleToken}` } }
      )

      if (response.status !== 200) throw new Error('Error al LISTAR los informes.')
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

export const eliminarInforme = async ({ informeId, googleToken }) => {
   try {
      const response = await axios.delete(`${backendUrl}/coloquios/${informeId}`,
         { headers: { Authorization: `Bearer ${googleToken}` } }
      )
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

export const obtenerEntregaInformes = async ({ id, googleToken }) => {
   try {
      const response = await axios.get(`${backendUrl}/documentos/coloquio/${id}`,
         { headers: { Authorization: `Bearer ${googleToken}` } }
      )

      if (response.status !== 200) throw new Error('Error al LISTAR las entregas de los informes.')
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

export const entregarInforme = async ({ idColoquio, archivos, tipoDocumento, tag, googleToken }) => {
   try {
      const formData = new FormData()
      formData.append("idColoquio", idColoquio)
      formData.append("tipoDocumento", tipoDocumento)
      if (tag) formData.append("tag", tag)
      archivos.forEach(archivo => {
         formData.append("archivo", archivo)
      })

      const response = await axios.post(
         `${backendUrl}/documentos/coloquio`,
         formData, { headers: { Authorization: `Bearer ${googleToken}` } }
      )

      if (response.status !== 200) throw new Error('Error al ENTREGAR un informe.')
      return response.data
   } catch (error) {
      throw new Error(error?.message || "Error interno al enviar el informe.")
   }
}

export const eliminarInformeArchivo = async ({ docId, googleToken }) => {
   try {
      const response = await axios.delete(`${backendUrl}/documentos/${docId}`,
         { headers: { Authorization: `Bearer ${googleToken}` } }
      )
      if (response.status !== 204) throw new Error('Error al ELIMINAR el archivo del informe.')
      return response.data
   } catch (error) {
      throw new Error(error?.message || "Error interno al eliminar el archivo del informe.")
   }
}

export const listarGruposDocente = async ({ googleToken }) => {
   try {
      const response = await axios.get(`${backendUrl}/coloquios/docente`,
         { headers: { Authorization: `Bearer ${googleToken}` } }
      )

      if (response.status !== 200) throw new Error('Error al LISTAR los grupos del docente.')
      return response.data
   } catch (error) {
      throw new Error(error?.message || "Error interno al enviar el informe.")
   }
}

export const listarInformesDocente = async ({ googleToken, id }) => {
   try {
      const response = await axios.get(`${backendUrl}/coloquios/grupo-cohorte/${id}`,
         { headers: { Authorization: `Bearer ${googleToken}` } }
      )

      if (response.status !== 200) throw new Error('Error al LISTAR los informes del docente.')
      return response.data
   } catch (error) {
      throw new Error(error?.message || "Error interno al enviar el informe.")
   }
}

export const crearColoquio = async ({ googleToken, body }) => {
   try {
      const response = await axios.post(`${backendUrl}/coloquios`, body,
         { headers: { Authorization: `Bearer ${googleToken}` } }
      )

      if (response.status !== 200) throw new Error('Error al LISTAR los informes del docente.')
      return response.data
   } catch (error) {
      throw new Error(error?.message || "Error interno al enviar el informe.")
   }
}

export const editarColoquio = async ({ googleToken, body, id }) => {
   try {
      const response = await axios.put(`${backendUrl}/coloquios/${id}`,
         body, { headers: { Authorization: `Bearer ${googleToken}` } }
      )

      if (response.status !== 200) throw new Error('Error al LISTAR los informes del docente.')
      return response.data
   } catch (error) {
      throw new Error(error?.message || "Error interno al enviar el informe.")
   }
}

export const listarEntregasColoquio = async ({ googleToken, id }) => {
   try {
      const response = await axios.get(`${backendUrl}/coloquios/entregas/${id}`,
         { headers: { Authorization: `Bearer ${googleToken}` } }
      )

      if (response.status !== 200) throw new Error('Error al LISTAR los entregas del coloquio.')
      return response.data
   } catch (error) {
      throw new Error(error?.message || "Error interno al enviar el informe.")
   }
}

export const listarDocumentosDeEntregaColoquio = async ({ googleToken, idColoquio, idEstudiante }) => {
   try {
      const response = await axios.get(`${backendUrl}/documentos/coloquio/${idColoquio}?idEstudiante=${idEstudiante}`,
         { headers: { Authorization: `Bearer ${googleToken}` } }
      )

      if (response.status !== 200) throw new Error('Error al LISTAR los entregas del coloquio.')
      return response.data
   } catch (error) {
      throw new Error(error?.message || "Error interno al enviar el informe.")
   }
}