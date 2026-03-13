import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import mermaid from 'mermaid'
import '../../styles/manual.css'

export default function ManualUsuarioFinal() {
    const [markdownContent, setMarkdownContent] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const containerRef = useRef(null)
    const navigate = useNavigate()

    // Configurar Mermaid
    useEffect(() => {
        mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            themeVariables: {
                primaryColor: '#BC0017',
                primaryTextColor: '#000000',
                primaryBorderColor: '#818386',
                lineColor: '#818386',
                sectionBkgColor: '#FFF1EF',
                altSectionBkgColor: '#EBEBEB',
                gridColor: '#C0C0C0',
                secondaryColor: '#1e40af',
                tertiaryColor: '#eef6ff'
            }
        })
    }, [])

    // Renderizar diagramas Mermaid después de cargar el contenido
    useEffect(() => {
        if (markdownContent && containerRef.current) {
            const renderMermaidDiagrams = async () => {
                const mermaidElements = containerRef.current.querySelectorAll('pre code.language-mermaid')

                for (let i = 0; i < mermaidElements.length; i++) {
                    const element = mermaidElements[i]
                    const code = element.textContent
                    const pre = element.parentElement

                    try {
                        const { svg } = await mermaid.render(`mermaid-${i}`, code)
                        const div = document.createElement('div')
                        div.className = 'mermaid-diagram'
                        div.innerHTML = svg
                        pre.parentNode.replaceChild(div, pre)
                    } catch (error) {
                        console.error('Error rendering Mermaid diagram:', error)
                    }
                }
            }

            // Delay para asegurar que el DOM esté listo
            setTimeout(renderMermaidDiagrams, 100)
        }
    }, [markdownContent])

    useEffect(() => {
        const fetchMarkdown = async () => {
            try {
                // Cargar el archivo Markdown desde la carpeta public/docs (ruta estática)
                const response = await fetch('/docs/MANUAL.md')
                if (!response.ok) {
                    throw new Error('No se pudo cargar el manual')
                }
                const content = await response.text()
                setMarkdownContent(content)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchMarkdown()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-azul-institucional mx-auto mb-4"></div>
                    <p className="text-gris-institucional">Cargando manual de usuario...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="text-red-500 text-xl mb-4">⚠️</div>
                    <h2 className="text-xl font-bold text-gris-institucional mb-2">Error al cargar el manual</h2>
                    <p className="text-gris-intermedio">{error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="relative">
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">Manual de Usuario</h1>
                <div
                    ref={containerRef}
                    className="prose prose-gray max-w-none manual-content"
                >
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            // Personalizar el renderizado de algunos elementos
                            h1: ({ node, ...props }) => <h1 className="text-4xl font-bold text-rojo-mate mb-6 pb-4 border-b-2 border-azul-claro" {...props} />,
                            h2: ({ node, ...props }) => <h2 className="text-3xl font-bold text-rojo-mate mb-5 mt-8 pb-3 border-b border-gris-claro" {...props} />,
                            h3: ({ node, ...props }) => <h3 className="text-2xl font-bold text-azul-institucional mb-4 mt-6" {...props} />,
                            h4: ({ node, ...props }) => <h4 className="text-xl font-semibold text-gris-institucional mb-3 mt-5" {...props} />,
                            h5: ({ node, ...props }) => <h5 className="text-lg font-semibold text-gris-institucional mb-2 mt-4" {...props} />,
                            h6: ({ node, ...props }) => <h6 className="text-base font-semibold text-gris-institucional mb-2 mt-3" {...props} />,
                            p: ({ node, ...props }) => <p className="text-gris-institucional mb-4 leading-relaxed" {...props} />,
                            ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-4 space-y-2 text-gris-institucional ml-4" {...props} />,
                            ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-4 space-y-2 text-gris-institucional ml-4" {...props} />,
                            li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
                            strong: ({ node, ...props }) => <strong className="font-bold text-azul-institucional" {...props} />,
                            em: ({ node, ...props }) => <em className="italic text-gris-intermedio" {...props} />,
                            code: ({ node, inline, ...props }) =>
                                inline ?
                                    <code className="bg-gris-claro px-2 py-1 rounded text-sm font-mono text-azul-institucional" {...props} /> :
                                    <code className="block bg-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto mb-4" {...props} />,
                            pre: ({ node, ...props }) => <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4" {...props} />,
                            blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-azul-claro bg-azul-claro bg-opacity-10 pl-4 py-2 mb-4 italic text-gris-intermedio" {...props} />,
                            table: ({ node, ...props }) => <div className="overflow-x-auto mb-4"><table className="w-full border-collapse border border-gris-claro" {...props} /></div>,
                            thead: ({ node, ...props }) => <thead className="bg-azul-claro bg-opacity-20" {...props} />,
                            th: ({ node, ...props }) => <th className="border border-gris-claro px-4 py-2 font-semibold text-gris-institucional text-left" {...props} />,
                            td: ({ node, ...props }) => <td className="border border-gris-claro px-4 py-2 text-gris-institucional" {...props} />,
                            a: ({ node, ...props }) => <a className="text-azul-institucional hover:text-azul-intermedio underline" {...props} />,
                            hr: ({ node, ...props }) => <hr className="border-t-2 border-gris-claro my-8" {...props} />
                        }}
                    >
                        {markdownContent}
                    </ReactMarkdown>
                </div>
            </div>

            {/* Floating Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="fixed bottom-6 right-6 bg-[#1e3a8a] hover:bg-[#1e40af] text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-50 group"
                title="Volver"
            >
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="m12 19-7-7 7-7" />
                    <path d="M19 12H5" />
                </svg>

                {/* Tooltip */}
                <span className="absolute bottom-full right-0 mb-2 px-3 py-1 text-sm text-white bg-gray-800 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                    Volver
                </span>
            </button>
        </div>
    )
}
