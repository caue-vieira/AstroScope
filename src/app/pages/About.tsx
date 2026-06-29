import Image from "next/image";
 
function AboutPage() {
    return(
        <div className="w-full h-full overflow-y-auto">
            {/* Logo Container */}
            <div className="flex justify-center pt-12 px-4">
                <div className="rounded-full border-2 border-black dark:border-white p-4">
                    <Image 
                        src="/AstroScope-Logo-Dark.png"
                        alt="AstroScope logo" 
                        width={250} 
                        height={250}
                        className="rounded-full"
                    />
                </div>
            </div>
 
            {/* Heading */}
            <div className="flex justify-center pt-8 px-4">
                <h1 className="text-3xl font-bold text-black dark:text-white">Sobre o Projeto</h1>
            </div>
 
            {/* Lorem Ipsum Content */}
            <div className="max-w-2xl mx-auto pt-8 px-4 pb-12 text-justify text-gray-700 dark:text-gray-300">
                <p className="mb-4">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
                </p>
                <p className="mb-4">
                    Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
                </p>
                <p>
                    Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.
                </p>
            </div>
        </div>
    )
}
 
export default AboutPage;