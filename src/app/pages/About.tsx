import Image from "next/image";

function AboutPage() {
    return(
        <div>
            <div className="rounded-full border-zinc-200 border-2 w-50 h-50">
                <Image 
                    src="/AstroScope-Logo-Dark.png"
                    alt="AstroScope logo" 
                    width={250} 
                    height={250}
                    className="rounded-full"
                />
            </div>
            <h1>Página sobre o projeto</h1>
        </div>
    )
}

export default AboutPage;