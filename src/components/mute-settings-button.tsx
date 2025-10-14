export function MuteSettingsButton({
    text,
    click,
    bgColor,
    className,
    styles
}:{
    text: string;
    click: () => void;
    bgColor: string;
    className?: string;
    styles?: React.CSSProperties;
}){
return <button
 className={`text-amber-50 cursor-pointer mt-2 ${className}`}
 style={{
    backgroundColor: bgColor,
    width: 30,
    height: 15,
    ...(typeof styles === 'object' && styles !== null ? styles : {})
 }}
 onClick={() => click()}
 >
<span className="relative top-[-3] text-2xl">
    {text}
</span>

</button>

} 