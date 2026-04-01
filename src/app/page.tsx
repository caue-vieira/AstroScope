import HeaderButton from "./components/HeaderButton";
import { HeaderSeparator } from "./components/HeaderSeparator";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex w-full h-20 shadow-md shadow-zinc-300 dark:shadow-zinc-900 items-center">
      <div className="flex-1 flex items-center gap-2">
        <Image 
          src="/AstroScope-Image-Light.png" 
          alt="AstroScope logo" 
          width={140} 
          height={40}
          className="h-auto ml-4"
        />
        <Image 
          src="/AstroScope-Text-Light-Crop.png" 
          alt="AstroScope logo" 
          width={250} 
          height={40}
          className="h-auto ml-[-16px]"
        />
      </div>
      <div className="flex h-full w-[35%] mx-auto justify-between">
        <HeaderButton text="Curva de Luz" index={0}/>
        <HeaderSeparator />
        <HeaderButton text="Órbita 3D" index={1}/>
        <HeaderSeparator />
        <HeaderButton text="Gerar PDF" index={2}/>
        <HeaderSeparator />
        <HeaderButton text="Sobre o projeto" index={2}/>
      </div>

      <div className="flex-1" />
    </div>
  );
}
