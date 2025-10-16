export function MuteSettingsButton({
    text,
    click,
    bgColor,
    className,
    styles
}:{
    text?: string;
    click: (e: React.MouseEvent<HTMLButtonElement>) => void;
    bgColor: string;
    className?: string;
    styles?: React.CSSProperties;
}){
return <button
 className={`text-amber-50 cursor-pointer mt-2 items-baseline ${className}`}
 style={{
    backgroundColor: bgColor,
    width: 30,
    height: 15,
    ...(typeof styles === 'object' && styles !== null ? styles : {})
 }}
 onClick={(e: React.MouseEvent<HTMLButtonElement>) => click(e)}
 >
{text &&
<span className="relative top-[-3] text-2xl">
    {text}
</span>
}
</button>

} 