import { useNavigate, useLocation } from 'react-router-dom'

export default function HelpButton() {
    const navigate = useNavigate()
    const location = useLocation()

    // Rutas donde debe aparecer el botón de ayuda
    const allowedRoutes = [
        '/estado-proyecto',
        '/seguimiento',
        '/informes',
        '/listado-proyectos',
        '/listado-informes',
        '/listado-sustentaciones',
        '/proyectos-admin',
        '/grupos-admin'
    ]

    // Verificar si la ruta actual está en la lista de rutas permitidas
    const shouldShowButton = allowedRoutes.includes(location.pathname)

    const handleClick = () => {
        navigate('/manual-usuario-final')
    }

    // No renderizar el botón si no está en una ruta permitida
    if (!shouldShowButton) {
        return null
    }

    return (
        <button
            onClick={handleClick}
            className="fixed bottom-6 right-6 z-50 bg-rojo-institucional hover:bg-rojo-mate text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 group"
            title="Manual de Usuario"
            aria-label="Abrir manual de usuario"
        >
            <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="lucide lucide-circle-question-mark-icon lucide-circle-question-mark"
            >
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <path d="M12 17h.01"/>
            </svg>
            
            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                Manual de Usuario
                <div className="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
            </div>
        </button>
    )
}
