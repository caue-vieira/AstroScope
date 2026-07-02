"use client";

import Image from "next/image";

function AboutPage() {
    return (
        <div className="flex flex-col items-center justify-start min-h-screen p-8 gap-8">
            {/* Logo */}
            <div className="rounded-full border-2 border-black dark:border-white w-64 h-64 flex items-center justify-center overflow-hidden mt-8">
                <Image
                    src="/AstroScope-Logo-Dark.png"
                    alt="AstroScope logo"
                    width={250}
                    height={250}
                    className="rounded-full"
                />
            </div>

            {/* Main content */}
            <div className="max-w-2xl w-full text-center space-y-6">
                {/* Title */}
                <h1 className="text-3xl font-bold text-foreground">AstroScope</h1>

                {/* Subtitle */}
                <p className="text-lg text-muted-foreground font-semibold">
                    Plataforma Web para Visualização de Órbitas e Análise de Curvas de Luz de Asteroides
                </p>

                {/* Main description */}
                <div className="space-y-4 text-left text-foreground leading-relaxed">
                    <p>
                        O AstroScope é uma aplicação web desenvolvida para integrar, em uma única plataforma, ferramentas essenciais para o estudo de asteroides. A solução unifica a visualização tridimensional de órbitas, a análise de curvas de luz e a geração de relatórios, eliminando a necessidade de navegar por diversas ferramentas separadas.
                    </p>

                    <p>
                        Todo o processamento é realizado no navegador do usuário, sem a necessidade de um servidor backend dedicado, o que simplifica o uso e a distribuição da aplicação. Os dados são obtidos diretamente de fontes confiáveis como a API do JPL (NASA) para elementos orbitais e do banco de dados ALCDEF para informações fotométricas.
                    </p>

                    {/* Features */}
                    <div className="pt-4">
                        <h2 className="text-xl font-semibold mb-3">Funcionalidades principais</h2>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-start gap-2">
                                <span className="text-primary font-bold">✓</span>
                                <span>
                                    <strong>Visualização 3D de órbitas:</strong> Renderização interativa de trajetórias de asteroides calculadas a partir de elementos orbitais kepleranos
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary font-bold">✓</span>
                                <span>
                                    <strong>Análise de curvas de luz:</strong> Importação, visualização e filtragem de dados fotométricos em formato ALCDEF
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary font-bold">✓</span>
                                <span>
                                    <strong>Exportação em PDF:</strong> Geração de relatórios consolidados com informações orbitais, gráficos e visualizações
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary font-bold">✓</span>
                                <span>
                                    <strong>Interface acessível:</strong> Suporte a temas claro e escuro, navegação intuitiva e design focado em usabilidade
                                </span>
                            </li>
                        </ul>
                    </div>

                    {/* Target audience */}
                    <div className="pt-4 border-t border-border">
                        <h2 className="text-xl font-semibold mb-2">Para quem é</h2>
                        <p>
                            O AstroScope foi desenvolvido para estudantes e acadêmicos interessados em astronomia, física e desenvolvimento de software. A plataforma reduz barreiras de acesso a dados astronômicos de qualidade e oferece uma experiência intuitiva para análise e aprendizado.
                        </p>
                    </div>

                    {/* Technologies */}
                    <div className="pt-4 border-t border-border">
                        <h2 className="text-xl font-semibold mb-2">Tecnologias utilizadas</h2>
                        <p className="text-sm">
                            Desenvolvido com <strong>Next.js</strong> e <strong>TypeScript</strong>, utiliza <strong>Three.js</strong> para renderização 3D, <strong>Recharts</strong> para gráficos interativos e <strong>Tailwind CSS</strong> para estilização. Todas as bibliotecas são de código aberto e gratuitas.
                        </p>
                    </div>

                    {/* Project info */}
                    <div className="pt-4 border-t border-border text-center text-sm text-muted-foreground">
                        <p>
                            Projeto de Pesquisa para o Trabalho de Conclusão de Curso (TCC) — <strong>Centro Universitário Univinte</strong>
                        </p>
                        <p>
                            Curso de Análise e Desenvolvimento de Sistemas
                        </p>
                        <p>
                            Orientador: Prof. Rafael Leonardo Frasson, Me.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AboutPage;