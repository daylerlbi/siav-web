import { useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { useAuth } from "../../lib/hooks/useAuth"
import { getBackendUrl } from "../../lib/controllers/endpoints"

export default function Success() {
   const { userLoggedSetter } = useAuth()
   const [searchParams] = useSearchParams()
   const navigate = useNavigate()
   const token = searchParams.get("token")
   const backendUrl = getBackendUrl()

   useEffect(() => {
      try {
         const user = userLoggedSetter(token)
         console.log('Usuario decodificado:', user)
         console.log('Role:', user?.role)

         if (user?.role.toLowerCase() === "estudiante") {
            fetch(`${backendUrl}/api/estudiantes/email/${user.email}`)
               .then(r => r.json())
               .then(data => {
                  if (data.id) localStorage.setItem('estudianteId', data.id)
                  if (data.programaId) localStorage.setItem('programaIdEstudiante', data.programaId)
                  if (data.pensumId) localStorage.setItem('pensumIdEstudiante', data.pensumId)
                  navigate("/academico/materias")
               })
               .catch(err => {
                  console.error('Error obteniendo datos del estudiante:', err)
                  navigate("/academico/materias")
               })
            return
         }

         if (user?.role.toLowerCase() === "docente") { navigate("/listado-proyectos"); return }
         navigate("/estado-proyecto")

      } catch (error) {
         console.error('Error en Success:', error)
         navigate('/login')
      }
   }, [token, userLoggedSetter, navigate])

   return (
      <div className="hidden" />
   )
}