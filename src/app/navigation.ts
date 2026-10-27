import { useCallback, useEffect, useRef, useState } from 'react';
import type { Period, SortOrder } from './projections';
export type Screen = 'inicio' | 'ventas' | 'nueva-venta' | 'productos' | 'inventario' | 'reposicion' | 'caja' | 'mas' | 'reportes' | 'configuracion';
export type Stage = 'pick' | 'cart' | 'pay' | 'done';
export type Route = { screen: Screen; stage: Stage; search: string; category: string; sort: SortOrder; lowOnly: boolean; showFilters: boolean; detailId: string | null; period: Period; month?:string; scroll: number; parent: Route | null };
const screens: Screen[] = ['inicio','ventas','nueva-venta','productos','inventario','reposicion','caja','mas','reportes','configuracion'];
export const screenLabels: Record<Screen,string> = { inicio:'Resumen de hoy', ventas:'Ventas', 'nueva-venta':'Nueva venta', productos:'Productos', inventario:'Inventario', reposicion:'Reposición', caja:'Caja', mas:'Más', reportes:'Reportes', configuracion:'Configuración' };
export function freshRoute(screen: Screen, parent: Route | null = null): Route { return {screen,stage:'pick',search:'',category:'Todos',sort:'nombre',lowOnly:false,showFilters:false,detailId:null,period:'Hoy',scroll:0,parent}; }
function initialRoute(): Route {
  const screen = location.hash.slice(1).split('/')[0] as Screen;
  const stored = history.state?.moraRoute as Route | undefined;
  if (stored && screens.includes(stored.screen) && stored.screen === screen) return stored;
  const target = screens.includes(screen) ? screen : 'inicio';
  return freshRoute(target, ['productos','inventario','reposicion','reportes','configuracion'].includes(target) ? freshRoute('mas') : target==='nueva-venta'?freshRoute('inicio'):null);
}
/** History stores only navigation context. Business data always lives in Dexie. */
export function useNavigation() {
  const [route,setRoute] = useState(initialRoute), current = useRef(route);
  current.current=route;
  const write = useCallback((next:Route,push:boolean) => {
    const {moraModal:_modal,...state}=history.state??{};
    if(push) history.replaceState({...state,moraRoute:{...current.current,scroll:scrollY}},'',location.href);
    history[push?'pushState':'replaceState']({...state,moraRoute:next,moraDepth:push?(history.state?.moraDepth??0)+1:(history.state?.moraDepth??0)},'',`#${next.screen}`);
    current.current=next;setRoute(next);
  },[]);
  useEffect(()=>{
    history.replaceState({...history.state,moraRoute:current.current,moraDepth:history.state?.moraDepth??0},'',`#${current.current.screen}`);
    const onPop=()=>{const next=initialRoute();current.current=next;setRoute(next);};
    addEventListener('popstate',onPop);return()=>removeEventListener('popstate',onPop);
  },[]);
  useEffect(()=>{const frame=requestAnimationFrame(()=>{if(!document.activeElement?.matches('input,select,textarea')) document.querySelector<HTMLElement>('.mv-screen-heading h1')?.focus({preventScroll:true});window.scrollTo({top:route.scroll,behavior:'auto'});});return()=>cancelAnimationFrame(frame);},[route.screen,route.stage,route.detailId,route.scroll]);
  const patch=useCallback((value:Partial<Route>)=>write({...current.current,...value},false),[write]);
  const go=useCallback((screen:Screen, options:Partial<Route>={})=>write({...freshRoute(screen,{...current.current,scroll:scrollY}),...options},true),[write]);
  const root=useCallback((screen:Screen)=>write(freshRoute(screen),true),[write]);
  const step=useCallback((value:Partial<Route>)=>write({...current.current,...value,scroll:0,parent:{...current.current,scroll:scrollY}},true),[write]);
  const back=useCallback(()=>{
    const parent=current.current.parent;
    if(parent && history.state?.moraDepth>0) { history.back(); }
    else if(parent) write(parent,false);
    else write(freshRoute('inicio'),true);
  },[write]);
  return {route,patch,go,root,step,back};
}
