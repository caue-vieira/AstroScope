type HeaderButtonProps = {
    text: string;
    index: number;
}

export function HeaderButton({ text, index }: HeaderButtonProps) {
    return (
        <button type="button" className="px-8 rounded-md hover:bg-zinc-300 dark:hover:bg-zinc-900 hover:cursor-pointer h-[70%] my-auto w-full mx-2">{text}</button>
    );
}

export default HeaderButton;