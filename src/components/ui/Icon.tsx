/* eslint-disable @next/next/no-img-element */
type IconName = "search"|"filter"|"reset"|"user"|"theme"|"lang"|"time"|"chevronDown";
const files:Record<IconName,string>={search:"search",filter:"filter",reset:"reset",user:"user",theme:"moon",lang:"globe",time:"clock",chevronDown:"chevron-down"};
export default function Icon({name,size=24,className=""}:{name:IconName;size?:number;className?:string}){return <img src={`/icons/${files[name]}.svg`} alt="" width={size} height={size} className={className} aria-hidden="true"/>;}
